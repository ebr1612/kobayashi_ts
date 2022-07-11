
const { resourceLoader , CADAsset} = window.zeaEngine

const loadAsset = (url, callback) => {
  const asset = new CADAsset()

  asset.on('error', (event) => {
    console.error('Error:', event)
  })

  asset.on('loaded', () => {
    const materials = asset.getMaterialLibrary().getMaterials()
    materials.forEach((material) => {
      const baseColor = material.getParameter('BaseColor')
      if (baseColor) {
        baseColor.setValue(baseColor.getValue().toGamma())
      }
    })
  })

  asset.load(url).then(callback)

  return asset
}

export { loadAsset }
