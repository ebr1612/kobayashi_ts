const { Color, GeomItem, Material ,CADBody} = window.zeaEngine

const highlightColor = new Color('#2D5DBD')
highlightColor.a = 0.2
const highlightMaterial = new Material(
  'highlightMaterial',
  'StandardSurfaceShader'
)
highlightMaterial.getParameter('BaseColor').setValue(new Color(1, 0, 0))

const calculateEstimate = (asset, metadata) => {
  const facesMap = {}
  asset.traverse((item) => {
    if (item instanceof GeomItem) {
      facesMap[item.getName()] = item
    }
  })

  const bends = metadata.bends
  let thickness = 0
  bends.forEach((bend) => {
    bend.faces.side_1.forEach((tag) => {
      const side_1Face = facesMap[tag]
      if (side_1Face) {
        side_1Face.getParameter('Material').setValue(highlightMaterial)
        // side_1Face.addHighlight('bend', highlightColor, true)
      }
    })
    bend.faces.side_2.forEach((tag) => {
      const side_2Face = facesMap[tag]
      if (side_2Face) {
        side_2Face.getParameter('Material').setValue(highlightMaterial)
        // side_2Face.addHighlight('bend', highlightColor, true)
      }
    })
    thickness += bend.thickness
  })

  const numBends = bends.length
  const costPerBend = 1100
  thickness /= numBends
  const price = numBends * costPerBend * thickness
  return {
    numBends,
    thickness,
    price,
  }
}

export { calculateEstimate }
