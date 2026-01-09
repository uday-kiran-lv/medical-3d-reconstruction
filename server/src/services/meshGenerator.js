/**
 * 3D Mesh Generation Service
 * Generates procedural 3D mesh data for different organ types based on reconstruction parameters
 */

// Organ-specific mesh generators
const organGenerators = {
  // Ribcage/Thorax mesh for X-ray images
  ribcage: (params) => generateRibcageMesh(params),
  thorax: (params) => generateThoraxMesh(params),
  chest: (params) => generateThoraxMesh(params),
  
  // Individual organs
  heart: (params) => generateHeartMesh(params),
  lung: (params) => generateLungMesh(params),
  liver: (params) => generateLiverMesh(params),
  kidney: (params) => generateKidneyMesh(params),
  brain: (params) => generateBrainMesh(params),
  spine: (params) => generateSpineMesh(params),
  bone: (params) => generateBoneMesh(params),
  
  // Auto-detect defaults to thorax for X-ray type images
  auto: (params) => generateThoraxMesh(params),
}

/**
 * Generate complete thorax/ribcage mesh from X-ray
 */
function generateThoraxMesh(params) {
  const { detail = 0.8, smoothing = 0.7 } = params
  const segments = Math.floor(16 + detail * 32)
  
  const meshData = {
    type: 'thorax',
    components: []
  }
  
  // Spine - central column
  meshData.components.push({
    name: 'spine',
    geometry: 'cylinder',
    params: { radiusTop: 0.15, radiusBottom: 0.2, height: 3.5, segments: segments },
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    color: '#E8DCC8',
    opacity: 0.95
  })
  
  // Vertebrae details
  for (let i = 0; i < 12; i++) {
    const y = 1.5 - (i * 0.28)
    meshData.components.push({
      name: `vertebra_${i}`,
      geometry: 'box',
      params: { width: 0.35, height: 0.08, depth: 0.3 },
      position: [0, y, 0.1],
      rotation: [0, 0, 0],
      color: '#DED0BC',
      opacity: 0.9
    })
  }
  
  // Ribs - 12 pairs
  for (let i = 0; i < 12; i++) {
    const y = 1.4 - (i * 0.25)
    const ribLength = i < 7 ? 1.8 - (i * 0.05) : 1.4 - ((i - 7) * 0.15)
    const ribCurve = i < 7 ? 0.4 : 0.3
    
    // Left rib
    meshData.components.push({
      name: `rib_left_${i}`,
      geometry: 'torus',
      params: { 
        radius: ribLength, 
        tube: 0.04 + (detail * 0.02), 
        radialSegments: segments,
        tubularSegments: Math.floor(segments / 2),
        arc: Math.PI * 0.6
      },
      position: [-0.1, y, 0.3],
      rotation: [Math.PI / 2, 0, Math.PI * 0.1],
      color: '#F0E6D8',
      opacity: 0.92
    })
    
    // Right rib
    meshData.components.push({
      name: `rib_right_${i}`,
      geometry: 'torus',
      params: { 
        radius: ribLength, 
        tube: 0.04 + (detail * 0.02), 
        radialSegments: segments,
        tubularSegments: Math.floor(segments / 2),
        arc: Math.PI * 0.6
      },
      position: [0.1, y, 0.3],
      rotation: [Math.PI / 2, Math.PI, -Math.PI * 0.1],
      color: '#F0E6D8',
      opacity: 0.92
    })
  }
  
  // Sternum (breastbone)
  meshData.components.push({
    name: 'sternum',
    geometry: 'box',
    params: { width: 0.2, height: 1.8, depth: 0.12 },
    position: [0, 0.3, 1.4],
    rotation: [0.1, 0, 0],
    color: '#E8DCC8',
    opacity: 0.9
  })
  
  // Clavicles (collarbones)
  meshData.components.push({
    name: 'clavicle_left',
    geometry: 'cylinder',
    params: { radiusTop: 0.05, radiusBottom: 0.05, height: 1.2, segments: segments },
    position: [-0.6, 1.6, 0.8],
    rotation: [0, 0, Math.PI * 0.4],
    color: '#F0E6D8',
    opacity: 0.9
  })
  
  meshData.components.push({
    name: 'clavicle_right',
    geometry: 'cylinder',
    params: { radiusTop: 0.05, radiusBottom: 0.05, height: 1.2, segments: segments },
    position: [0.6, 1.6, 0.8],
    rotation: [0, 0, -Math.PI * 0.4],
    color: '#F0E6D8',
    opacity: 0.9
  })
  
  // Scapulae (shoulder blades)
  meshData.components.push({
    name: 'scapula_left',
    geometry: 'box',
    params: { width: 0.8, height: 1.0, depth: 0.08 },
    position: [-1.0, 1.0, -0.3],
    rotation: [0.2, 0.3, 0.1],
    color: '#E8DCC8',
    opacity: 0.85
  })
  
  meshData.components.push({
    name: 'scapula_right',
    geometry: 'box',
    params: { width: 0.8, height: 1.0, depth: 0.08 },
    position: [1.0, 1.0, -0.3],
    rotation: [0.2, -0.3, -0.1],
    color: '#E8DCC8',
    opacity: 0.85
  })
  
  // Lungs (transparent overlay)
  meshData.components.push({
    name: 'lung_left',
    geometry: 'sphere',
    params: { radius: 0.7, widthSegments: segments, heightSegments: segments },
    position: [-0.6, 0.5, 0.5],
    rotation: [0, 0, 0],
    scale: [0.8, 1.2, 0.6],
    color: '#FFB6C1',
    opacity: 0.3
  })
  
  meshData.components.push({
    name: 'lung_right',
    geometry: 'sphere',
    params: { radius: 0.75, widthSegments: segments, heightSegments: segments },
    position: [0.55, 0.5, 0.5],
    rotation: [0, 0, 0],
    scale: [0.85, 1.2, 0.6],
    color: '#FFB6C1',
    opacity: 0.3
  })
  
  // Heart (transparent overlay)
  meshData.components.push({
    name: 'heart',
    geometry: 'sphere',
    params: { radius: 0.4, widthSegments: segments, heightSegments: segments },
    position: [-0.15, 0.3, 0.7],
    rotation: [0, 0, 0.3],
    scale: [1, 1.2, 0.8],
    color: '#DC143C',
    opacity: 0.4
  })
  
  return meshData
}

/**
 * Generate ribcage mesh (alias for thorax)
 */
function generateRibcageMesh(params) {
  return generateThoraxMesh(params)
}

/**
 * Generate heart mesh
 */
function generateHeartMesh(params) {
  const { detail = 0.8, smoothing = 0.7 } = params
  const segments = Math.floor(16 + detail * 32)
  
  return {
    type: 'heart',
    components: [
      // Main heart body
      {
        name: 'heart_main',
        geometry: 'sphere',
        params: { radius: 1.2, widthSegments: segments, heightSegments: segments },
        position: [0, 0, 0],
        rotation: [0, 0, 0.3],
        scale: [1, 1.3, 0.9],
        color: '#DC143C',
        opacity: 0.9
      },
      // Left atrium
      {
        name: 'left_atrium',
        geometry: 'sphere',
        params: { radius: 0.5, widthSegments: segments, heightSegments: segments },
        position: [-0.4, 0.8, 0.2],
        rotation: [0, 0, 0],
        color: '#B22222',
        opacity: 0.85
      },
      // Right atrium
      {
        name: 'right_atrium',
        geometry: 'sphere',
        params: { radius: 0.45, widthSegments: segments, heightSegments: segments },
        position: [0.4, 0.7, 0.3],
        rotation: [0, 0, 0],
        color: '#B22222',
        opacity: 0.85
      },
      // Aorta
      {
        name: 'aorta',
        geometry: 'cylinder',
        params: { radiusTop: 0.15, radiusBottom: 0.2, height: 1.2, segments: segments },
        position: [0, 1.3, 0],
        rotation: [0.2, 0, 0],
        color: '#8B0000',
        opacity: 0.9
      },
      // Pulmonary artery
      {
        name: 'pulmonary_artery',
        geometry: 'cylinder',
        params: { radiusTop: 0.12, radiusBottom: 0.15, height: 0.8, segments: segments },
        position: [-0.3, 1.1, 0.3],
        rotation: [-0.3, 0.2, 0.4],
        color: '#4169E1',
        opacity: 0.85
      }
    ]
  }
}

/**
 * Generate lung mesh
 */
function generateLungMesh(params) {
  const { detail = 0.8 } = params
  const segments = Math.floor(16 + detail * 32)
  
  return {
    type: 'lung',
    components: [
      // Left lung - upper lobe
      {
        name: 'left_lung_upper',
        geometry: 'sphere',
        params: { radius: 0.8, widthSegments: segments, heightSegments: segments },
        position: [-0.9, 0.5, 0],
        scale: [0.7, 1.0, 0.5],
        color: '#FFB6C1',
        opacity: 0.7
      },
      // Left lung - lower lobe
      {
        name: 'left_lung_lower',
        geometry: 'sphere',
        params: { radius: 0.9, widthSegments: segments, heightSegments: segments },
        position: [-0.9, -0.5, 0],
        scale: [0.75, 1.1, 0.55],
        color: '#FFA0B0',
        opacity: 0.7
      },
      // Right lung - upper lobe
      {
        name: 'right_lung_upper',
        geometry: 'sphere',
        params: { radius: 0.75, widthSegments: segments, heightSegments: segments },
        position: [0.9, 0.7, 0],
        scale: [0.75, 0.9, 0.5],
        color: '#FFB6C1',
        opacity: 0.7
      },
      // Right lung - middle lobe
      {
        name: 'right_lung_middle',
        geometry: 'sphere',
        params: { radius: 0.6, widthSegments: segments, heightSegments: segments },
        position: [0.95, 0, 0.1],
        scale: [0.65, 0.7, 0.45],
        color: '#FFA8B8',
        opacity: 0.7
      },
      // Right lung - lower lobe
      {
        name: 'right_lung_lower',
        geometry: 'sphere',
        params: { radius: 0.85, widthSegments: segments, heightSegments: segments },
        position: [0.9, -0.6, 0],
        scale: [0.8, 1.0, 0.55],
        color: '#FFA0B0',
        opacity: 0.7
      },
      // Trachea
      {
        name: 'trachea',
        geometry: 'cylinder',
        params: { radiusTop: 0.12, radiusBottom: 0.12, height: 1.5, segments: segments },
        position: [0, 1.5, 0],
        color: '#F5DEB3',
        opacity: 0.8
      },
      // Bronchi
      {
        name: 'bronchus_left',
        geometry: 'cylinder',
        params: { radiusTop: 0.08, radiusBottom: 0.1, height: 0.8, segments: segments },
        position: [-0.4, 0.8, 0],
        rotation: [0, 0, 0.5],
        color: '#F5DEB3',
        opacity: 0.8
      },
      {
        name: 'bronchus_right',
        geometry: 'cylinder',
        params: { radiusTop: 0.08, radiusBottom: 0.1, height: 0.7, segments: segments },
        position: [0.4, 0.85, 0],
        rotation: [0, 0, -0.4],
        color: '#F5DEB3',
        opacity: 0.8
      }
    ]
  }
}

/**
 * Generate liver mesh
 */
function generateLiverMesh(params) {
  const { detail = 0.8 } = params
  const segments = Math.floor(16 + detail * 32)
  
  return {
    type: 'liver',
    components: [
      // Right lobe (larger)
      {
        name: 'right_lobe',
        geometry: 'sphere',
        params: { radius: 1.2, widthSegments: segments, heightSegments: segments },
        position: [0.3, 0, 0],
        scale: [1.2, 0.8, 0.6],
        color: '#8B4513',
        opacity: 0.9
      },
      // Left lobe (smaller)
      {
        name: 'left_lobe',
        geometry: 'sphere',
        params: { radius: 0.8, widthSegments: segments, heightSegments: segments },
        position: [-0.8, 0.2, 0],
        scale: [0.9, 0.7, 0.5],
        color: '#A0522D',
        opacity: 0.9
      },
      // Caudate lobe
      {
        name: 'caudate_lobe',
        geometry: 'sphere',
        params: { radius: 0.3, widthSegments: segments, heightSegments: segments },
        position: [-0.2, 0.4, -0.3],
        color: '#8B4513',
        opacity: 0.85
      },
      // Gallbladder
      {
        name: 'gallbladder',
        geometry: 'sphere',
        params: { radius: 0.2, widthSegments: segments, heightSegments: segments },
        position: [0.6, -0.3, 0.4],
        scale: [0.6, 1, 0.6],
        color: '#3CB371',
        opacity: 0.8
      }
    ]
  }
}

/**
 * Generate kidney mesh
 */
function generateKidneyMesh(params) {
  const { detail = 0.8 } = params
  const segments = Math.floor(16 + detail * 32)
  
  return {
    type: 'kidney',
    components: [
      // Left kidney
      {
        name: 'left_kidney',
        geometry: 'sphere',
        params: { radius: 0.8, widthSegments: segments, heightSegments: segments },
        position: [-1.2, 0, 0],
        scale: [0.5, 1, 0.4],
        color: '#CD5C5C',
        opacity: 0.9
      },
      // Right kidney
      {
        name: 'right_kidney',
        geometry: 'sphere',
        params: { radius: 0.8, widthSegments: segments, heightSegments: segments },
        position: [1.2, -0.2, 0],
        scale: [0.5, 1, 0.4],
        color: '#CD5C5C',
        opacity: 0.9
      },
      // Left ureter
      {
        name: 'left_ureter',
        geometry: 'cylinder',
        params: { radiusTop: 0.05, radiusBottom: 0.05, height: 1.5, segments: segments },
        position: [-1.0, -1, 0],
        rotation: [0.1, 0, 0.2],
        color: '#F4A460',
        opacity: 0.8
      },
      // Right ureter
      {
        name: 'right_ureter',
        geometry: 'cylinder',
        params: { radiusTop: 0.05, radiusBottom: 0.05, height: 1.5, segments: segments },
        position: [1.0, -1.1, 0],
        rotation: [0.1, 0, -0.2],
        color: '#F4A460',
        opacity: 0.8
      },
      // Bladder
      {
        name: 'bladder',
        geometry: 'sphere',
        params: { radius: 0.5, widthSegments: segments, heightSegments: segments },
        position: [0, -2, 0.2],
        scale: [1.2, 0.8, 0.8],
        color: '#DEB887',
        opacity: 0.7
      }
    ]
  }
}

/**
 * Generate brain mesh
 */
function generateBrainMesh(params) {
  const { detail = 0.8 } = params
  const segments = Math.floor(16 + detail * 32)
  
  return {
    type: 'brain',
    components: [
      // Left hemisphere
      {
        name: 'left_hemisphere',
        geometry: 'sphere',
        params: { radius: 1.1, widthSegments: segments, heightSegments: segments },
        position: [-0.55, 0.2, 0],
        scale: [0.9, 1.1, 1],
        color: '#FFB6C1',
        opacity: 0.9
      },
      // Right hemisphere
      {
        name: 'right_hemisphere',
        geometry: 'sphere',
        params: { radius: 1.1, widthSegments: segments, heightSegments: segments },
        position: [0.55, 0.2, 0],
        scale: [0.9, 1.1, 1],
        color: '#FFB6C1',
        opacity: 0.9
      },
      // Cerebellum
      {
        name: 'cerebellum',
        geometry: 'sphere',
        params: { radius: 0.6, widthSegments: segments, heightSegments: segments },
        position: [0, -0.6, -0.5],
        scale: [1.4, 0.8, 0.9],
        color: '#DDA0DD',
        opacity: 0.85
      },
      // Brain stem
      {
        name: 'brain_stem',
        geometry: 'cylinder',
        params: { radiusTop: 0.2, radiusBottom: 0.15, height: 1, segments: segments },
        position: [0, -1.2, -0.3],
        rotation: [0.3, 0, 0],
        color: '#F5DEB3',
        opacity: 0.9
      }
    ]
  }
}

/**
 * Generate spine mesh
 */
function generateSpineMesh(params) {
  const { detail = 0.8 } = params
  const segments = Math.floor(12 + detail * 20)
  
  const meshData = {
    type: 'spine',
    components: []
  }
  
  // 24 vertebrae
  for (let i = 0; i < 24; i++) {
    const y = 2.5 - (i * 0.22)
    const size = i < 7 ? 0.2 : i < 19 ? 0.25 : 0.3
    
    // Vertebral body
    meshData.components.push({
      name: `vertebra_body_${i}`,
      geometry: 'cylinder',
      params: { radiusTop: size, radiusBottom: size, height: 0.15, segments: segments },
      position: [0, y, 0],
      color: '#F5F5DC',
      opacity: 0.95
    })
    
    // Spinous process
    meshData.components.push({
      name: `spinous_process_${i}`,
      geometry: 'box',
      params: { width: 0.05, height: 0.08, depth: 0.3 },
      position: [0, y, -0.2],
      color: '#FFFFF0',
      opacity: 0.9
    })
  }
  
  // Intervertebral discs
  for (let i = 0; i < 23; i++) {
    const y = 2.39 - (i * 0.22)
    meshData.components.push({
      name: `disc_${i}`,
      geometry: 'cylinder',
      params: { radiusTop: 0.18, radiusBottom: 0.18, height: 0.05, segments: segments },
      position: [0, y, 0],
      color: '#87CEEB',
      opacity: 0.6
    })
  }
  
  return meshData
}

/**
 * Generate generic bone mesh
 */
function generateBoneMesh(params) {
  const { detail = 0.8 } = params
  const segments = Math.floor(12 + detail * 20)
  
  return {
    type: 'bone',
    components: [
      // Bone shaft
      {
        name: 'shaft',
        geometry: 'cylinder',
        params: { radiusTop: 0.2, radiusBottom: 0.2, height: 3, segments: segments },
        position: [0, 0, 0],
        color: '#FFFFF0',
        opacity: 0.95
      },
      // Proximal epiphysis
      {
        name: 'proximal_epiphysis',
        geometry: 'sphere',
        params: { radius: 0.4, widthSegments: segments, heightSegments: segments },
        position: [0, 1.6, 0],
        scale: [1.2, 0.8, 1.2],
        color: '#F5F5DC',
        opacity: 0.9
      },
      // Distal epiphysis
      {
        name: 'distal_epiphysis',
        geometry: 'sphere',
        params: { radius: 0.35, widthSegments: segments, heightSegments: segments },
        position: [0, -1.6, 0],
        scale: [1.1, 0.7, 1.1],
        color: '#F5F5DC',
        opacity: 0.9
      }
    ]
  }
}

/**
 * Main function to generate 3D mesh based on organ type and parameters
 */
export function generateMesh(organType, parameters) {
  const generator = organGenerators[organType] || organGenerators.auto
  const meshData = generator(parameters)
  
  // Calculate mesh statistics
  let totalVertices = 0
  let totalFaces = 0
  
  meshData.components.forEach(component => {
    const p = component.params
    if (component.geometry === 'sphere') {
      const w = p.widthSegments || 32
      const h = p.heightSegments || 32
      totalVertices += (w + 1) * (h + 1)
      totalFaces += w * h * 2
    } else if (component.geometry === 'cylinder') {
      const s = p.segments || 32
      totalVertices += s * 4 + 2
      totalFaces += s * 4
    } else if (component.geometry === 'box') {
      totalVertices += 24
      totalFaces += 12
    } else if (component.geometry === 'torus') {
      const r = p.radialSegments || 16
      const t = p.tubularSegments || 32
      totalVertices += r * t
      totalFaces += r * t * 2
    }
  })
  
  meshData.statistics = {
    vertices: totalVertices,
    faces: totalFaces,
    components: meshData.components.length
  }
  
  return meshData
}

/**
 * Detect organ type from image analysis (simplified version)
 * In production, this would use actual AI/ML analysis
 */
export function detectOrganType(imageMetadata) {
  const fileName = (imageMetadata?.fileName || '').toLowerCase()
  const imageType = (imageMetadata?.image_type || '').toLowerCase()
  
  // Check filename for hints
  if (fileName.includes('chest') || fileName.includes('thorax') || fileName.includes('xray') || fileName.includes('x-ray')) {
    return 'thorax'
  }
  if (fileName.includes('heart') || fileName.includes('cardiac')) {
    return 'heart'
  }
  if (fileName.includes('brain') || fileName.includes('head') || fileName.includes('cranial')) {
    return 'brain'
  }
  if (fileName.includes('lung') || fileName.includes('pulmonary')) {
    return 'lung'
  }
  if (fileName.includes('liver') || fileName.includes('hepatic')) {
    return 'liver'
  }
  if (fileName.includes('kidney') || fileName.includes('renal')) {
    return 'kidney'
  }
  if (fileName.includes('spine') || fileName.includes('vertebr')) {
    return 'spine'
  }
  
  // Check image type
  if (imageType === 'x-ray') {
    return 'thorax'
  }
  if (imageType === 'ct' || imageType === 'mri') {
    return 'thorax' // Default for CT/MRI
  }
  
  return 'thorax' // Default to thorax for X-ray images
}

export default {
  generateMesh,
  detectOrganType
}
