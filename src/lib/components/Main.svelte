<script lang="ts">
  import { toast } from '@zerodevx/svelte-toast'
  import request from 'superagent'
  import { onMount } from 'svelte'
  import Dropzone from 'svelte-file-dropzone'
  
  import { loadAsset } from '$lib/helpers/loadAsset.js'
  import { calculateEstimate } from '$lib/helpers/calculateEstimate.js'
  
  import Spinner from '$lib/components/Spinner.svelte'
  
  import { assets } from '$lib/stores/assets.js'
  import { scene } from '$lib/stores/scene.js'
  import { ui } from '$lib/stores/ui.js'

  import Button from '$lib/components/Button.svelte'
  
  let canvas
  let estimateInterval
  let numBends = ''
  let price = ''
  let processorDone = false
  let processorLatestError
  let progress
  let shouldDisplayDropZone = true
  let shouldShowSpinner = false
  let thickness = ''

  const ASSET_URL = 'http://localhost:3333/converted.zcad'
  const urlParams = new URLSearchParams(window.location.search)

  const formatter = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 2,
  })

  const sendFileRequest = async (file) => {
    const response = await request
      .post('http://localhost:3333/files/upload')
      .attach('file', file)
      .on('progress', (event) => {
        progress = {
          completed: event.percent / 100,
          filename: file.name,
          label: 'Uploading',
        }
        shouldDisplayDropZone = false
      })
  }

  const showError = (error) => {
    toast.push(error, {
      theme: {
        '--toastBackground': '#F56565',
        '--toastProgressBackground': '#C53030',
      },
    })
  }

  const resetAppState = () => {
    //$assets.removeAllChildren()  // pcu:TBR

    $ui.disableEstimateButton = true

    processorDone = false
    processorLatestError = null
    shouldShowSpinner = false

    window.clearInterval(estimateInterval)

    numBends = ''
    thickness = ''
    price = ''
  }

  const doEstimate = async () => {
    const response = await request.get('http://localhost:3333/converted.json')
    const asset = $assets.getChild(0)
    const estimate = calculateEstimate(asset, response.body)

    numBends = estimate.numBends
    thickness = estimate.thickness
    price = formatter.format(estimate.price)
  }
  
  /* {{{ Handlers. */
  const handleMainDragOver = () => {
    if (progress) {
      return
    }

    shouldDisplayDropZone = true
  }

  const handleFileSelect = async (event) => {
    resetAppState()

    const { acceptedFiles } = event.detail
    const file = acceptedFiles[0]
    await sendFileRequest(file)
  }

  const handleClickStop = async () => {
    const response = await request.delete('http://localhost:3333/files/stop')
  }

  const handleClickEstimate = () => {
    window.clearInterval(estimateInterval)
    shouldShowSpinner = true

    estimateInterval = window.setInterval(() => {
      if (!processorDone) {
        return
      }

      window.clearInterval(estimateInterval)
      shouldShowSpinner = false

      if (processorLatestError) {
        showError(processorLatestError)
        return
      }

      doEstimate()
    }, 2000)
  }
  
  /* }}} Handlers. */

  onMount(() => {
    const {
      Color,
      TreeItem,
      GLRenderer,
      Scene,
      SystemDesc,
      EnvMap,
      CameraManipulator,
      GLCADPass
    } = window.zeaEngine

    const renderer = new GLRenderer(canvas, {
      debugGeomIds: urlParams.has('debugGeomIds'),
      xrCompatible: false,
    })

    $scene = new Scene()
	
	// $scene.setupGrid(10.0, 10)

    // Assigning an Environment Map enables PBR lighting
    // for nicer shiny surfaces.
    // if (!SystemDesc.isMobileDevice && SystemDesc.gpuDesc.supportsWebGL2) {
    //   const envMap = new EnvMap('envMap')
    //   envMap.getParameter('FilePath').setValue(`/data/StudioA.zenv`)
    //   envMap.getParameter('HeadLightMode').setValue(true)
    //   $scene.getSettings().getParameter('EnvMap').setValue(envMap)
    // }
    // Assigning an Environment Map enables PBR lighting for nicer shiny surfaces.
     if (!SystemDesc.isMobileDevice && SystemDesc.gpuDesc.supportsWebGL2) { // pcu:TBR
      const envMap = new EnvMap('envMap')
      envMap.load(`/data//HDR_029_Sky_Cloudy_Ref.vlenv`)
      envMap.headlightModeParam.value = true
      $scene.envMapParam.value = envMap
    }

    // $scene.setupGrid(10, 10)
    //$scene
    // .getSettings()
    // .getParameter('BackgroundColor')
    // .setValue(new Color('#F9FAFB'))
    renderer.setScene($scene)

    renderer
      .getViewport()
      .getManipulator()
      .setDefaultManipulationMode(CameraManipulator.MANIPULATION_MODES.tumbler)
	  
	  /* {{{ CAD */
    $assets = new TreeItem('Assets')
    $scene.getRoot().addChild($assets)
    //renderer.addPass(new GLCADPass()) // pcu:TBR
    /* }}} CAD */

    /* {{{ WebSocket. */
    const SOCKET_URL = 'http://localhost:3334'
    const socket = window.io(SOCKET_URL)

    socket.on('converter-progress', (payload) => {
      progress = {
        completed: payload.percentage / 100,
        filename: payload.filename,
        label: payload.label,
      }
      shouldDisplayDropZone = false
    })

    socket.on('converter-done', (payload) => {
      progress = null
      shouldDisplayDropZone = false

      const asset = loadAsset(ASSET_URL, () => {
        renderer.frameAll()
      })

      $assets.addChild(asset)

      $ui.disableEstimateButton = false
    })

    socket.on('converter-error', (payload) => {
      progress = null
      shouldDisplayDropZone = true

      showError(payload.error)
    })

    socket.on('processor-done', (payload) => {
      processorDone = true
    })

    socket.on('processor-error', (payload) => {
      processorDone = true
      processorLatestError = payload.error
    })
    /* }}} WebSocket. */

    return () => {
      socket.removeAllListeners()
    }
  }) 
</script>

<main
  class="Main flex flex-1 relative bg-blue-50"
  on:dragover={handleMainDragOver}
>
  <div class="relative flex-1 h-full">
    <canvas bind:this={canvas} class="absolute" />
  </div>

  <div class="p-5">
    <div class="grid grid-cols-2 gap-4 mb-5">
      <div>Number of bends:</div>
      <input
        type="text"
        disabled
        class="border-2 border-gray-400 rounded"
        value={numBends}
      />

      <div>Thickness:</div>
      <input
        type="text"
        disabled
        class="border-2 border-gray-400 rounded"
        value={thickness}
      />
      
      <Button
        on:click={handleClickEstimate}
        disabled={$ui.disableEstimateButton}
      >
        {#if shouldShowSpinner}
          <Spinner />
        {/if}
        estimate
      </Button>

      <input
        type="text"
        disabled
        class="border-2 border-gray-400 rounded"
        value={price}
      />
    </div>
  </div>

  {#if progress}
    <div
      class="absolute inset-0 bg-white flex flex-col items-center justify-center p-2 bg-opacity-60"
    >
      <p class="text-center text-gray-800 text-lg mb-4">
        {progress.filename}
      </p>
      <progress value={progress.completed} />
      <p class="text-gray-500 text-sm mb-4">
        {progress.label}
      </p>

      <Button on:click={handleClickStop}>stop</Button>
    </div>
  {/if}

  {#if shouldDisplayDropZone}
    <Dropzone
      containerClasses="absolute inset-1 border-dashed border-4 border-blue-300 rounded-2xl shadow bg-white flex flex-col items-center justify-center p-2 bg-opacity-60"
      disableDefaultStyles
      multiple={false}
      on:drop={handleFileSelect}
    >
      <p class="mb-1 text-center text-4xl text-primary">Drop file here</p>
      <p class="mb-8 text-center text-gray-500">or click to select it.</p>
    </Dropzone>
  {/if}
</main>

<style>
  canvas {
    touch-action: none;
  }
</style>