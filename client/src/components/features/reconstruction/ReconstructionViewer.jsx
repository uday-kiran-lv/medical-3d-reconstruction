import { Suspense, useState, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Center, Text, ContactShadows } from '@react-three/drei'
import { Play, Pause, RotateCcw, Download, Eye, EyeOff, Layers } from 'lucide-react'
import * as THREE from 'three'

/**
 * Medical-grade studio background for professional anatomical visualization
 * Light gray gradient optimized for heart model display
 */
const MedicalBackground = () => {
  const { scene } = useThree()
  
  useEffect(() => {
    // Create professional studio-style gradient background
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    
    // Professional studio gradient - neutral gray for medical models
    const gradient = ctx.createRadialGradient(512, 400, 0, 512, 512, 700)
    gradient.addColorStop(0, '#f5f5f5')      // Bright center
    gradient.addColorStop(0.3, '#eeeeee')    // Light gray
    gradient.addColorStop(0.6, '#e0e0e0')    // Medium gray
    gradient.addColorStop(0.85, '#d5d5d5')   // Darker edges
    gradient.addColorStop(1, '#cccccc')      // Soft vignette
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1024, 1024)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.background = texture
    
    return () => {
      texture.dispose()
    }
  }, [scene])
  
  return null
}

/**
 * Custom geometry component for volumetric mesh from image analysis
 * Supports vertex colors for full 360° rotational 3D models
 * Enhanced with realistic medical-grade materials
 */
const CustomMesh = ({ component, wireframe, materialType = 'bone' }) => {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  const geometry = useMemo(() => {
    const { params } = component
    const geo = new THREE.BufferGeometry()
    
    if (params.vertices && params.indices) {
      // Convert flat arrays to Float32Array for vertices
      const vertexArray = new Float32Array(params.vertices)
      geo.setAttribute('position', new THREE.BufferAttribute(vertexArray, 3))
      
      // Set indices
      const indexArray = new Uint32Array(params.indices)
      geo.setIndex(new THREE.BufferAttribute(indexArray, 1))
      
      // Set UVs if available
      if (params.uvs && params.uvs.length > 0) {
        const uvArray = new Float32Array(params.uvs)
        geo.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2))
      }
      
      // Set vertex colors if available (for image-based 3D models)
      if (params.vertexColors && params.vertexColors.length > 0) {
        const colorArray = new Float32Array(params.vertexColors)
        geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))
      }
      
      // Compute proper normals for smooth shading
      geo.computeVertexNormals()
      
      // Smooth the normals for better appearance
      geo.normalizeNormals()
    }
    
    return geo
  }, [component.params])

  // Check if we should use vertex colors
  const useVertexColors = component.useVertexColors && 
    component.params?.vertexColors && 
    component.params.vertexColors.length > 0

  // ==========================================================================
  // PHOTOREALISTIC ANATOMICAL MATERIALS
  // STRICT MEDICAL REALISM - Based on surgical/cadaveric/histological appearance
  // ==========================================================================
  // ABSOLUTELY NO: Cartoon shading, flat colors, stylized gradients,
  //                illustrative rendering, simplified anatomy, low-poly look
  // MUST HAVE: Real tissue properties, subsurface scattering hints,
  //            wet surface reflections, anatomically correct color variance
  // ==========================================================================
  const materialProps = useMemo(() => {
    const baseColor = component.color || '#ffffff'
    const name = (component.name || '').toLowerCase()
    
    // Bone material - realistic cortical bone appearance with periosteum
    if (name.includes('bone') || name.includes('skull') || name.includes('spine') || 
        name.includes('rib') || name.includes('vertebra') || name.includes('pelvis') ||
        name.includes('femur') || name.includes('tibia') || name.includes('humerus')) {
      return {
        roughness: 0.38,
        metalness: 0.02,
        envMapIntensity: 0.65,
        emissive: '#1a1a18',
        emissiveIntensity: 0.015,
        clearcoat: 0.1,
        clearcoatRoughness: 0.6
      }
    }
    
    // MYOCARDIUM - Fresh cardiac muscle as seen in open-heart surgery
    // Reference: Intraoperative cardiac appearance, surgical photography
    // Wet glistening epicardium, deep burgundy-red myocardial tissue
    // Striated muscle texture with visible fiber direction
    if (name.includes('ventricle') || name.includes('atrium') || 
        name.includes('septum') || name.includes('apex') || name.includes('heart') ||
        name.includes('papillary') || name.includes('trabeculae') || name.includes('infundibulum') ||
        name.includes('myocardium') || name.includes('crista') || name.includes('moderator') ||
        name.includes('lobe') && !name.includes('liver') && !name.includes('lung')) {
      return {
        roughness: 0.32,           // Smoother wet muscle surface - more realistic
        metalness: 0.0,
        envMapIntensity: 0.65,     // Strong environment reflections for wet look
        emissive: '#3a1212',       // Stronger subsurface blood glow
        emissiveIntensity: 0.12,   // More visible blood perfusion
        clearcoat: 0.62,           // Very wet epicardial/pericardial surface
        clearcoatRoughness: 0.22,  // Sharper wet reflections like reference
        sheen: 0.28,               // Stronger muscle fiber anisotropic sheen
        sheenRoughness: 0.38,
        sheenColor: '#bb6060',     // Brighter blood-rich muscle sheen
        transmission: 0.018,       // Slight translucency (real tissue)
        thickness: 1.2,
        attenuationColor: '#6a1818', // Blood absorption color
        attenuationDistance: 0.7
      }
    }
    
    // CORONARY ARTERIES - Prominent surface vessels visible on epicardium
    // Reference: Surgical/cadaveric appearance - clearly visible red vessels
    // Slightly raised from surface, filled with oxygenated blood
    if (name.includes('LAD') || name.includes('RCA') || name.includes('LCx') ||
        name.includes('coronary') || name.includes('LMCA') ||
        name.includes('diagonal') || name.includes('marginal') || name.includes('branch')) {
      return {
        roughness: 0.22,           // Very smooth vessel surface
        metalness: 0.0,
        envMapIntensity: 0.72,     // Strong wet surface reflections
        emissive: '#6a1818',       // Bright oxygenated blood glow
        emissiveIntensity: 0.14,   // Highly visible blood content
        clearcoat: 0.68,           // Very wet adventitia surface
        clearcoatRoughness: 0.18,  // Sharp wet highlights
        sheen: 0.22,
        sheenRoughness: 0.35,
        sheenColor: '#cc5050'      // Bright arterial sheen
      }
    }
    
    // GREAT ARTERIES - Aorta and branches
    // Reference: Surgical exposure, angiography, cadaveric dissection
    // Elastic vessel walls with visible pulsatile tension
    // Oxygenated blood gives bright red internal glow
    if (name.includes('aort') || name.includes('carotid') || 
        name.includes('subclavian') || name.includes('brachiocephalic') ||
        name.includes('PDA')) {
      return {
        roughness: 0.28,           // Smooth endothelium/intima - NOT matte
        metalness: 0.0,
        envMapIntensity: 0.60,     // Wet vessel surface reflections
        emissive: '#4a1010',       // Oxygenated blood internal glow
        emissiveIntensity: 0.09,   // Visible blood content
        clearcoat: 0.55,           // Wet adventitia/serosal surface
        clearcoatRoughness: 0.25,  // Sharp wet reflections
        sheen: 0.15,
        sheenRoughness: 0.45,
        sheenColor: '#aa4040'      // Realistic arterial sheen
      }
    }
    
    // VEINS - Deoxygenated systemic/cardiac venous system
    // Reference: Venography, cadaveric dissection, surgical exposure
    // Thinner walls, collapsible, dark blue-purple from deoxygenated Hb
    if (name.includes('vena_cava') || name.includes('cardiac_vein') || 
        name.includes('coronary_sinus') || name.includes('great_cardiac') ||
        name.includes('middle_cardiac') || name.includes('small_cardiac') ||
        name.includes('svc') || name.includes('ivc')) {
      return {
        roughness: 0.32,           // Smooth venous endothelium
        metalness: 0.0,
        envMapIntensity: 0.52,     // Wet surface reflections
        emissive: '#0c1530',       // Deoxygenated hemoglobin color
        emissiveIntensity: 0.07,   // Visible blood content
        clearcoat: 0.48,           // Wet vessel surface
        clearcoatRoughness: 0.32,
        sheen: 0.15,
        sheenRoughness: 0.48,
        sheenColor: '#506090',     // Bluish venous sheen
        transmission: 0.02,        // Thin wall translucency
        thickness: 0.5
      }
    }
    
    // PULMONARY CIRCULATION - Special case
    // PA carries deoxygenated (blue), PV carries oxygenated (red)
    if (name.includes('pulmonary_trunk') || name.includes('pulmonary_artery') ||
        name.includes('ligamentum')) {
      return {
        roughness: 0.34,
        metalness: 0.0,
        envMapIntensity: 0.5,
        emissive: '#0a1530',
        emissiveIntensity: 0.05,
        clearcoat: 0.4,
        clearcoatRoughness: 0.4
      }
    }
    
    // Duplicate pulmonary check removed - handled above
    
    // VALVE TISSUE - Fibrous connective tissue (collagen/elastin)
    // Reference: Echocardiography, valve surgery, histology
    // Thin, translucent leaflets with visible collagen fiber bundles
    // Pearly white/cream color, slightly glistening
    if (name.includes('valve') || name.includes('annulus') || name.includes('fibrous') || name.includes('chordae')) {
      return {
        roughness: 0.40,           // Smooth collagen surface
        metalness: 0.0,
        envMapIntensity: 0.48,     // Subtle reflections
        emissive: '#1a1512',       // Minimal warm tissue glow
        emissiveIntensity: 0.04,
        clearcoat: 0.35,           // Wet serosal surface
        clearcoatRoughness: 0.40,
        sheen: 0.25,               // Collagen fiber sheen
        sheenRoughness: 0.50,
        sheenColor: '#e8ddd0',     // Pearly collagen sheen
        transmission: 0.08,        // Thin leaflet translucency
        thickness: 0.3,
        attenuationColor: '#f5e8d8'
      }
    }
    
    // ADIPOSE TISSUE - Epicardial fat
    // Yellow, slightly translucent, soft appearance
    if (name.includes('fat') || name.includes('pericardium')) {
      return {
        roughness: 0.52,
        metalness: 0.0,
        envMapIntensity: 0.32,
        emissive: '#1a1808',
        emissiveIntensity: 0.025,
        clearcoat: 0.12,
        clearcoatRoughness: 0.55,
        transmission: 0.08,        // Fat translucency
        thickness: 0.4
      }
    }
    
    // ENDOCARDIUM - Inner heart lining
    if (name.includes('endocardium')) {
      return {
        roughness: 0.38,
        metalness: 0.0,
        envMapIntensity: 0.45,
        emissive: '#2a1515',
        emissiveIntensity: 0.04,
        clearcoat: 0.4,
        clearcoatRoughness: 0.35
      }
    }
    
    // =========================================================================
    // PHOTOREALISTIC BRAIN TISSUE MATERIALS
    // PBR settings for medical-grade neural tissue visualization
    // =========================================================================
    
    // CEREBRUM - Main brain hemispheres with gyri and sulci
    // Fresh neural tissue: pinkish-gray, wet surface, subsurface scattering
    if (name.includes('cerebrum') || name.includes('hemisphere') || name.includes('brain')) {
      return {
        roughness: 0.42,           // Slightly wet brain surface
        metalness: 0.0,
        envMapIntensity: 0.55,     // Wet reflections
        emissive: '#1a0808',       // Subsurface blood glow
        emissiveIntensity: 0.06,   // Living tissue warmth
        clearcoat: 0.45,           // Wet pia mater surface
        clearcoatRoughness: 0.35,  // Soft wet reflections
        sheen: 0.18,               // Neural tissue sheen
        sheenRoughness: 0.5,
        sheenColor: '#c09090',     // Pinkish tissue sheen
        transmission: 0.02,        // Slight translucency
        thickness: 1.2,
        attenuationColor: '#a06060',
        attenuationDistance: 1.0
      }
    }
    
    // CEREBELLUM - "Little brain" with folia pattern
    if (name.includes('cerebellum') || name.includes('folia')) {
      return {
        roughness: 0.44,
        metalness: 0.0,
        envMapIntensity: 0.52,
        emissive: '#180808',
        emissiveIntensity: 0.055,
        clearcoat: 0.42,
        clearcoatRoughness: 0.38,
        sheen: 0.15,
        sheenRoughness: 0.52,
        sheenColor: '#b88888'
      }
    }
    
    // BRAINSTEM - Midbrain, pons, medulla oblongata
    if (name.includes('brainstem') || name.includes('midbrain') || 
        name.includes('pons') || name.includes('medulla')) {
      return {
        roughness: 0.46,
        metalness: 0.0,
        envMapIntensity: 0.48,
        emissive: '#150808',
        emissiveIntensity: 0.05,
        clearcoat: 0.38,
        clearcoatRoughness: 0.42,
        sheen: 0.12,
        sheenRoughness: 0.55,
        sheenColor: '#a88080'
      }
    }
    
    // CEREBRAL BLOOD VESSELS - Arteries on brain surface
    if (name.includes('cerebral') && name.includes('artery') ||
        name.includes('middle_cerebral') || name.includes('anterior_cerebral') ||
        name.includes('basilar')) {
      return {
        roughness: 0.28,
        metalness: 0.0,
        envMapIntensity: 0.58,
        emissive: '#3a0808',
        emissiveIntensity: 0.08,
        clearcoat: 0.55,
        clearcoatRoughness: 0.25,
        sheen: 0.12,
        sheenRoughness: 0.4,
        sheenColor: '#aa4040'
      }
    }
    
    // =========================================================================
    // PHOTOREALISTIC KIDNEY TISSUE MATERIALS
    // Realistic tissue colors - reddish-pink, vascular, soft-tissue appearance
    // Similar to heart tissue rendering for anatomical realism
    // =========================================================================
    
    // RENAL CORTEX - Outer functional layer (reddish-pink tissue)
    if (name.includes('cortex') || name.includes('renal_column') || name.includes('cortical')) {
      return {
        roughness: 0.38,           // Smooth wet tissue surface
        metalness: 0.0,
        envMapIntensity: 0.55,     // Good reflections for wet tissue
        emissive: '#4a2028',       // Deep reddish glow
        emissiveIntensity: 0.12,
        clearcoat: 0.58,           // Wet tissue surface
        clearcoatRoughness: 0.32,
        sheen: 0.18,
        sheenRoughness: 0.45,
        sheenColor: '#c08080'      // Pinkish tissue sheen
      }
    }
    
    // RENAL MEDULLA - Inner region with pyramids (darker reddish-brown)
    if (name.includes('medulla') || name.includes('pyramid')) {
      return {
        roughness: 0.42,
        metalness: 0.0,
        envMapIntensity: 0.48,
        emissive: '#3a1820',       // Dark reddish-brown emission
        emissiveIntensity: 0.14,
        clearcoat: 0.52,
        clearcoatRoughness: 0.38,
        sheen: 0.15,
        sheenRoughness: 0.50,
        sheenColor: '#905050'
      }
    }
    
    // RENAL PELVIS & CALYCES - Collecting system (pale pink mucosal)
    if (name.includes('pelvis') || name.includes('calyx') || name.includes('calyces')) {
      return {
        roughness: 0.35,
        metalness: 0.0,
        envMapIntensity: 0.52,
        emissive: '#4a3535',
        emissiveIntensity: 0.10,
        clearcoat: 0.62,           // Moist mucosal lining
        clearcoatRoughness: 0.30,
        sheen: 0.20,
        sheenRoughness: 0.42,
        sheenColor: '#d0a0a0'
      }
    }
    
    // RENAL HILUM - Concave medial region (darker tissue)
    if (name.includes('hilum')) {
      return {
        roughness: 0.45,
        metalness: 0.0,
        envMapIntensity: 0.42,
        emissive: '#2a1518',
        emissiveIntensity: 0.15,
        clearcoat: 0.48,
        clearcoatRoughness: 0.42
      }
    }
    
    // RENAL ARTERY - Bright arterial red
    if (name.includes('renal_artery') || name.includes('segmental_artery') || 
        name.includes('interlobar_artery') || name.includes('arcuate_artery')) {
      return {
        roughness: 0.25,
        metalness: 0.0,
        envMapIntensity: 0.60,
        emissive: '#5a1820',
        emissiveIntensity: 0.18,
        clearcoat: 0.68,
        clearcoatRoughness: 0.25,
        sheen: 0.15,
        sheenRoughness: 0.40,
        sheenColor: '#e06060'
      }
    }
    
    // RENAL VEIN - Deep purple-blue venous
    if (name.includes('renal_vein') || name.includes('segmental_vein')) {
      return {
        roughness: 0.28,
        metalness: 0.0,
        envMapIntensity: 0.58,
        emissive: '#2a1835',
        emissiveIntensity: 0.15,
        clearcoat: 0.65,
        clearcoatRoughness: 0.28,
        sheen: 0.14,
        sheenRoughness: 0.45,
        sheenColor: '#8060a0'
      }
    }
    
    // URETER - Pale tan/pink tubular tissue
    if (name.includes('ureter') || name.includes('ureteropelvic')) {
      return {
        roughness: 0.40,
        metalness: 0.0,
        envMapIntensity: 0.50,
        emissive: '#3a2820',
        emissiveIntensity: 0.08,
        clearcoat: 0.55,
        clearcoatRoughness: 0.38
      }
    }
    
    // RENAL CAPSULE - Pale pinkish-white fibrous membrane
    if (name.includes('capsule')) {
      return {
        roughness: 0.38,
        metalness: 0.0,
        envMapIntensity: 0.58,
        emissive: '#4a3838',
        emissiveIntensity: 0.06,
        clearcoat: 0.55,
        clearcoatRoughness: 0.35,
        transmission: 0.15,
        thickness: 0.5
      }
    }
    
    // PERIRENAL FAT - Yellowish adipose tissue
    if (name.includes('perirenal') || name.includes('fat')) {
      return {
        roughness: 0.55,
        metalness: 0.0,
        envMapIntensity: 0.45,
        emissive: '#3a3520',
        emissiveIntensity: 0.05,
        clearcoat: 0.25,
        clearcoatRoughness: 0.50,
        transmission: 0.12,
        thickness: 0.3
      }
    }
    
    // =========================================================================
    // LIVER TISSUE MATERIALS - Photorealistic hepatic visualization
    // Based on surgical appearance and medical imaging
    // =========================================================================
    
    // LIVER PARENCHYMA - Main liver tissue, reddish-brown
    if (name.includes('lobe') || name.includes('liver') || materialType === 'liver') {
      return {
        roughness: 0.42,           // Smooth Glisson's capsule surface
        metalness: 0.0,
        envMapIntensity: 0.52,     // Wet organ surface reflections
        emissive: '#2a1212',       // Deep blood-rich tissue glow
        emissiveIntensity: 0.08,   // Hepatic blood perfusion
        clearcoat: 0.45,           // Wet serosal surface
        clearcoatRoughness: 0.32,  // Soft wet reflections
        sheen: 0.18,               // Tissue surface sheen
        sheenRoughness: 0.48,
        sheenColor: '#905050',     // Reddish-brown tissue sheen
        transmission: 0.01,        // Minimal translucency
        thickness: 1.2
      }
    }
    
    // PORTAL VEIN - Large vein carrying nutrient-rich blood
    if (name.includes('portal_vein')) {
      return {
        roughness: 0.32,
        metalness: 0.0,
        envMapIntensity: 0.55,
        emissive: '#0a1528',       // Dark venous blood
        emissiveIntensity: 0.08,
        clearcoat: 0.50,
        clearcoatRoughness: 0.28,
        sheen: 0.12,
        sheenRoughness: 0.45,
        sheenColor: '#405080'
      }
    }
    
    // HEPATIC ARTERY - Oxygenated blood supply
    if (name.includes('hepatic_artery')) {
      return {
        roughness: 0.28,
        metalness: 0.0,
        envMapIntensity: 0.58,
        emissive: '#3a0a0a',
        emissiveIntensity: 0.10,
        clearcoat: 0.55,
        clearcoatRoughness: 0.25,
        sheen: 0.14,
        sheenRoughness: 0.42,
        sheenColor: '#aa4040'
      }
    }
    
    // HEPATIC VEINS - Drain into IVC
    if (name.includes('hepatic_vein') || name.includes('inferior_vena_cava')) {
      return {
        roughness: 0.34,
        metalness: 0.0,
        envMapIntensity: 0.52,
        emissive: '#08102a',
        emissiveIntensity: 0.07,
        clearcoat: 0.48,
        clearcoatRoughness: 0.32,
        sheen: 0.10,
        sheenRoughness: 0.48,
        sheenColor: '#405080'
      }
    }
    
    // BILE DUCTS - Yellow-green biliary system
    if (name.includes('bile') || name.includes('hepatic_duct') || name.includes('cystic') || materialType === 'duct') {
      return {
        roughness: 0.38,
        metalness: 0.0,
        envMapIntensity: 0.45,
        emissive: '#1a1a08',
        emissiveIntensity: 0.05,
        clearcoat: 0.42,
        clearcoatRoughness: 0.35,
        sheen: 0.15,
        sheenRoughness: 0.50,
        sheenColor: '#808040',
        transmission: 0.05,
        thickness: 0.3
      }
    }
    
    // GALLBLADDER - Green-tinted organ
    if (name.includes('gallbladder') || materialType === 'gallbladder') {
      return {
        roughness: 0.40,
        metalness: 0.0,
        envMapIntensity: 0.50,
        emissive: '#0a1a0a',
        emissiveIntensity: 0.06,
        clearcoat: 0.48,
        clearcoatRoughness: 0.32,
        sheen: 0.16,
        sheenRoughness: 0.45,
        sheenColor: '#508050',
        transmission: 0.08,
        thickness: 0.4
      }
    }
    
    // FALCIFORM LIGAMENT - Connective tissue
    if (name.includes('falciform') || name.includes('ligament')) {
      return {
        roughness: 0.55,
        metalness: 0.0,
        envMapIntensity: 0.38,
        emissive: '#1a1815',
        emissiveIntensity: 0.03,
        clearcoat: 0.22,
        clearcoatRoughness: 0.52,
        sheen: 0.12,
        sheenRoughness: 0.55,
        sheenColor: '#c0b8a8'
      }
    }
    
    // GLISSON'S CAPSULE - Thin fibrous covering
    if (name.includes('glisson') || name.includes('capsule')) {
      return {
        roughness: 0.42,
        metalness: 0.0,
        envMapIntensity: 0.55,
        emissive: '#181515',
        emissiveIntensity: 0.04,
        clearcoat: 0.38,
        clearcoatRoughness: 0.40,
        transmission: 0.15,
        thickness: 0.3
      }
    }
    
    // =========================================================================
    // KIDNEY REALISTIC TISSUE MATERIALS - Photorealistic Rendering
    // Realistic tissue colors with wet surface appearance
    // =========================================================================
    
    // KIDNEY CORTEX - Outer layer, reddish-pink tissue
    if (materialType === 'kidney_cortex_mri' || materialType === 'kidney_surface_mri' ||
        materialType === 'kidney_cortex') {
      return {
        roughness: 0.38,
        metalness: 0.0,
        envMapIntensity: 0.55,
        emissive: '#4a2028',
        emissiveIntensity: 0.12,
        clearcoat: 0.58,
        clearcoatRoughness: 0.32,
        sheen: 0.18,
        sheenRoughness: 0.45,
        sheenColor: '#c08080',
        transmission: 0.02,
        thickness: 0.4
      }
    }
    
    // KIDNEY MEDULLA - Inner pyramids, darker reddish-brown
    if (materialType === 'kidney_medulla_mri' || materialType === 'kidney_medulla') {
      return {
        roughness: 0.42,
        metalness: 0.0,
        envMapIntensity: 0.48,
        emissive: '#3a1820',
        emissiveIntensity: 0.14,
        clearcoat: 0.52,
        clearcoatRoughness: 0.38,
        sheen: 0.15,
        sheenRoughness: 0.50,
        sheenColor: '#905050'
      }
    }
    
    // KIDNEY PAPILLA - Pyramid tips, darker tissue
    if (materialType === 'kidney_papilla_mri') {
      return {
        roughness: 0.45,
        metalness: 0.0,
        envMapIntensity: 0.42,
        emissive: '#2a1218',
        emissiveIntensity: 0.16,
        clearcoat: 0.48,
        clearcoatRoughness: 0.42
      }
    }
    
    // KIDNEY CALYX - Cup-shaped collectors, pale pink
    if (materialType === 'kidney_calyx_mri' || materialType === 'kidney_calyx') {
      return {
        roughness: 0.35,
        metalness: 0.0,
        envMapIntensity: 0.52,
        emissive: '#4a3030',
        emissiveIntensity: 0.10,
        clearcoat: 0.60,
        clearcoatRoughness: 0.32,
        sheen: 0.18,
        sheenRoughness: 0.45,
        sheenColor: '#c09090'
      }
    }
    
    // KIDNEY PELVIS - Central collecting chamber, pale pink mucosal
    if (materialType === 'kidney_pelvis_mri' || materialType === 'kidney_pelvis') {
      return {
        roughness: 0.35,
        metalness: 0.0,
        envMapIntensity: 0.52,
        emissive: '#4a3535',
        emissiveIntensity: 0.10,
        clearcoat: 0.62,
        clearcoatRoughness: 0.30,
        sheen: 0.20,
        sheenRoughness: 0.42,
        sheenColor: '#d0a0a0'
      }
    }
    
    // KIDNEY HILUM - Concave entry region, darker tissue
    if (materialType === 'kidney_hilum_mri' || materialType === 'kidney_hilum') {
      return {
        roughness: 0.45,
        metalness: 0.0,
        envMapIntensity: 0.42,
        emissive: '#2a1518',
        emissiveIntensity: 0.15,
        clearcoat: 0.48,
        clearcoatRoughness: 0.42
      }
    }
    
    // RENAL ARTERY - Bright arterial red
    if (materialType === 'renal_artery_mri' || materialType === 'renal_artery') {
      return {
        roughness: 0.25,
        metalness: 0.0,
        envMapIntensity: 0.60,
        emissive: '#5a1820',
        emissiveIntensity: 0.18,
        clearcoat: 0.68,
        clearcoatRoughness: 0.25,
        sheen: 0.15,
        sheenRoughness: 0.40,
        sheenColor: '#e06060'
      }
    }
    
    // RENAL VEIN - Deep purple-blue venous
    if (materialType === 'renal_vein_mri' || materialType === 'renal_vein') {
      return {
        roughness: 0.28,
        metalness: 0.0,
        envMapIntensity: 0.58,
        emissive: '#2a1835',
        emissiveIntensity: 0.15,
        clearcoat: 0.65,
        clearcoatRoughness: 0.28,
        sheen: 0.14,
        sheenRoughness: 0.45,
        sheenColor: '#8060a0'
      }
    }
    
    // URETER - Pale tan/pink tubular tissue
    if (materialType === 'ureter_mri' || materialType === 'ureter') {
      return {
        roughness: 0.40,
        metalness: 0.0,
        envMapIntensity: 0.50,
        emissive: '#3a2820',
        emissiveIntensity: 0.08,
        clearcoat: 0.55,
        clearcoatRoughness: 0.38
      }
    }
    
    // KIDNEY CAPSULE - Pale pinkish-white fibrous membrane
    if (materialType === 'kidney_capsule_mri' || materialType === 'kidney_capsule') {
      return {
        roughness: 0.38,
        metalness: 0.0,
        envMapIntensity: 0.58,
        emissive: '#4a3838',
        emissiveIntensity: 0.06,
        clearcoat: 0.55,
        clearcoatRoughness: 0.35,
        transmission: 0.15,
        thickness: 0.5
      }
    }
    
    // PERIRENAL FAT - Yellowish adipose tissue
    if (materialType === 'fat_mri' || materialType === 'fat') {
      return {
        roughness: 0.55,
        metalness: 0.0,
        envMapIntensity: 0.45,
        emissive: '#3a3520',
        emissiveIntensity: 0.05,
        clearcoat: 0.25,
        clearcoatRoughness: 0.50,
        transmission: 0.12,
        thickness: 0.3
      }
    }
    
    // =========================================================================
    // MRI VOLUMETRIC RECONSTRUCTION MATERIALS
    // Generic MRI tissue visualization with grayscale rendering
    // =========================================================================
    
    // MRI Bright signal (fluid, fat) - High T2 signal
    if (name.includes('mri_bright') || name.includes('bright_region') || 
        materialType === 'mri_bright') {
      return {
        roughness: 0.50,
        metalness: 0.0,
        envMapIntensity: 0.55,
        emissive: '#252525',
        emissiveIntensity: 0.08,
        clearcoat: 0.30,
        clearcoatRoughness: 0.45,
        sheen: 0.12,
        sheenRoughness: 0.5,
        sheenColor: '#c0c0c0'
      }
    }
    
    // MRI Medium signal (muscle, solid organs)
    if (name.includes('mri_medium') || name.includes('medium_region') || 
        name.includes('mri_tissue') || materialType === 'mri_medium' || 
        materialType === 'mri_tissue') {
      return {
        roughness: 0.55,
        metalness: 0.0,
        envMapIntensity: 0.45,
        emissive: '#1a1a1a',
        emissiveIntensity: 0.06,
        clearcoat: 0.22,
        clearcoatRoughness: 0.50,
        sheen: 0.08,
        sheenRoughness: 0.55,
        sheenColor: '#909090'
      }
    }
    
    // MRI Dark signal (air, cortical bone, flow void)
    if (name.includes('mri_dark') || name.includes('dark_region') || 
        name.includes('mri_vessel') || materialType === 'mri_dark' ||
        materialType === 'mri_vessel') {
      return {
        roughness: 0.45,
        metalness: 0.0,
        envMapIntensity: 0.35,
        emissive: '#0a0a0a',
        emissiveIntensity: 0.12,
        clearcoat: 0.35,
        clearcoatRoughness: 0.40
      }
    }
    
    // MRI Background plane
    if (name.includes('mri_back') || materialType === 'mri_background') {
      return {
        roughness: 0.80,
        metalness: 0.0,
        envMapIntensity: 0.15,
        emissive: '#050505',
        emissiveIntensity: 0.02
      }
    }
    
    // MRI Voxel (intensity-based 3D reconstruction)
    if (name.includes('voxel')) {
      return {
        roughness: 0.52,
        metalness: 0.0,
        envMapIntensity: 0.48,
        emissive: '#181818',
        emissiveIntensity: 0.05,
        clearcoat: 0.20,
        clearcoatRoughness: 0.55
      }
    }
    
    // Default medical soft tissue
    return {
      roughness: 0.45,
      metalness: 0.05,
      envMapIntensity: 0.6,
      emissive: '#0a0a0a',
      emissiveIntensity: 0.01
    }
  }, [component.name, component.color, component.materialType])

  const color = useMemo(() => {
    if (useVertexColors) return '#ffffff'
    if (hovered) {
      const baseColor = new THREE.Color(component.color || '#ffffff')
      baseColor.offsetHSL(0, 0.05, 0.08)
      return baseColor
    }
    return component.color || '#ffffff'
  }, [component.color, hovered, useVertexColors])

  const position = component.position || [0, 0, 0]
  const rotation = component.rotation || [0, 0, 0]
  const scale = component.scale || [1, 1, 1]
  const opacity = component.opacity || 1

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={color}
        wireframe={wireframe}
        transparent={opacity < 1 || wireframe}
        opacity={wireframe ? Math.min(opacity, 0.6) : opacity}
        roughness={materialProps.roughness}
        metalness={materialProps.metalness}
        side={THREE.DoubleSide}
        flatShading={false}
        envMapIntensity={materialProps.envMapIntensity}
        vertexColors={useVertexColors}
        emissive={materialProps.emissive}
        emissiveIntensity={materialProps.emissiveIntensity}
        clearcoat={materialProps.clearcoat || 0.15}
        clearcoatRoughness={materialProps.clearcoatRoughness || 0.4}
        sheen={materialProps.sheen || 0}
        sheenRoughness={materialProps.sheenRoughness || 0.5}
        sheenColor={materialProps.sheenColor || '#ffffff'}
        transmission={materialProps.transmission || 0}
        thickness={materialProps.thickness || 0}
      />
    </mesh>
  )
}

/**
 * Points visualization for edge highlights
 */
const PointsMesh = ({ component }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const { points, size } = component.params
    
    if (points && points.length > 0) {
      const positions = []
      points.forEach(p => {
        positions.push(p.x, p.strength * 0.5 + 0.1, -p.y)
      })
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    }
    
    return geo
  }, [component.params])

  return (
    <points geometry={geometry} position={component.position || [0, 0, 0]}>
      <pointsMaterial
        color={component.color || '#4A90D9'}
        size={component.params.size || 0.03}
        transparent
        opacity={component.opacity || 0.5}
        sizeAttenuation
      />
    </points>
  )
}

/**
 * Individual mesh component that renders a single organ/bone part
 * Enhanced with realistic medical-grade materials
 */
const MeshComponent = ({ component, wireframe, isPlaying }) => {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  // Handle custom geometry types
  if (component.geometry === 'custom') {
    return <CustomMesh component={component} wireframe={wireframe} />
  }
  
  if (component.geometry === 'points') {
    return <PointsMesh component={component} />
  }

  // Create geometry based on component type with higher detail
  const geometry = useMemo(() => {
    const { geometry: geoType, params } = component
    
    switch (geoType) {
      case 'sphere':
        return new THREE.SphereGeometry(
          params.radius || 1,
          params.widthSegments || 64,
          params.heightSegments || 64
        )
      case 'cylinder':
        return new THREE.CylinderGeometry(
          params.radiusTop || 0.5,
          params.radiusBottom || 0.5,
          params.height || 1,
          params.segments || 64
        )
      case 'box':
        return new THREE.BoxGeometry(
          params.width || 1,
          params.height || 1,
          params.depth || 1,
          4, 4, 4
        )
      case 'torus':
        return new THREE.TorusGeometry(
          params.radius || 1,
          params.tube || 0.1,
          params.radialSegments || 32,
          params.tubularSegments || 100,
          params.arc || Math.PI * 2
        )
      case 'cone':
        return new THREE.ConeGeometry(
          params.radius || 0.5,
          params.height || 1,
          params.segments || 64
        )
      default:
        return new THREE.SphereGeometry(1, 64, 64)
    }
  }, [component])

  // Determine material properties based on organ/tissue type
  const materialProps = useMemo(() => {
    const name = (component.name || '').toLowerCase()
    
    // Bone material
    if (name.includes('bone') || name.includes('skull') || name.includes('spine') || 
        name.includes('rib') || name.includes('vertebra') || name.includes('pelvis')) {
      return {
        roughness: 0.35,
        metalness: 0.05,
        envMapIntensity: 0.8,
        emissive: '#1a1a1a',
        emissiveIntensity: 0.02
      }
    }
    
    // Heart tissue
    if (name.includes('heart') || name.includes('ventricle') || name.includes('atrium') ||
        name.includes('myocardium')) {
      return {
        roughness: 0.6,
        metalness: 0.0,
        envMapIntensity: 0.4,
        emissive: '#330000',
        emissiveIntensity: 0.05,
        clearcoat: 0.3,
        clearcoatRoughness: 0.5
      }
    }
    
    // Blood vessels - enhanced materials
    if (name.includes('artery') || name.includes('vein') || name.includes('aorta') ||
        name.includes('vessel') || name.includes('coronary')) {
      return {
        roughness: 0.32,
        metalness: 0.08,
        envMapIntensity: 0.6,
        emissive: '#2a0505',
        emissiveIntensity: 0.06,
        clearcoat: 0.4,
        clearcoatRoughness: 0.3
      }
    }
    
    // Default medical tissue
    return {
      roughness: 0.45,
      metalness: 0.05,
      envMapIntensity: 0.6,
      emissive: '#0a0a0a',
      emissiveIntensity: 0.01,
      clearcoat: 0.1,
      clearcoatRoughness: 0.5
    }
  }, [component.name])

  // Material color - slightly brighter on hover
  const color = useMemo(() => {
    if (hovered) {
      const baseColor = new THREE.Color(component.color || '#ffffff')
      baseColor.offsetHSL(0, 0.05, 0.08)
      return baseColor
    }
    return component.color || '#ffffff'
  }, [component.color, hovered])

  const position = component.position || [0, 0, 0]
  const rotation = component.rotation || [0, 0, 0]
  const scale = component.scale || [1, 1, 1]
  const opacity = component.opacity || 1

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={color}
        wireframe={wireframe}
        transparent={opacity < 1 || wireframe}
        opacity={wireframe ? Math.min(opacity, 0.6) : opacity}
        roughness={materialProps.roughness}
        metalness={materialProps.metalness}
        side={THREE.DoubleSide}
        envMapIntensity={materialProps.envMapIntensity}
        emissive={materialProps.emissive}
        emissiveIntensity={materialProps.emissiveIntensity}
        clearcoat={materialProps.clearcoat || 0.15}
        clearcoatRoughness={materialProps.clearcoatRoughness || 0.4}
        sheen={materialProps.sheen || 0}
        sheenRoughness={materialProps.sheenRoughness || 0.5}
        sheenColor={materialProps.sheenColor || '#ffffff'}
        transmission={materialProps.transmission || 0}
        thickness={materialProps.thickness || 0}
      />
    </mesh>
  )
}

/**
 * Container for all mesh components with animation
 */
const OrganMesh = ({ meshData, wireframe = false, isPlaying = true, showLabels = false }) => {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current && isPlaying) {
      groupRef.current.rotation.y += 0.003
    }
  })

  if (!meshData || !meshData.components || meshData.components.length === 0) {
    return (
      <Center>
        <Text fontSize={0.3} color="#666" anchorX="center" anchorY="middle">
          No mesh data available
        </Text>
      </Center>
    )
  }

  return (
    <group ref={groupRef}>
      <Center>
        {meshData.components.map((component, index) => (
          <MeshComponent
            key={`${component.name}-${index}`}
            component={component}
            wireframe={wireframe}
            isPlaying={isPlaying}
          />
        ))}
      </Center>
    </group>
  )
}

/**
 * Loading fallback while mesh is being prepared
 */
const LoadingFallback = () => {
  const textRef = useRef()
  
  useFrame((state) => {
    if (textRef.current) {
      textRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <Center>
      <group ref={textRef}>
        <Text fontSize={0.4} color="#3b82f6" anchorX="center" anchorY="middle">
          Loading 3D Model...
        </Text>
      </group>
    </Center>
  )
}

/**
 * Grid helper for spatial reference
 */
const GridHelper = ({ visible }) => {
  if (!visible) return null
  return (
    <gridHelper args={[10, 20, '#888888', '#cccccc']} rotation={[0, 0, 0]} />
  )
}

const ReconstructionViewer = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [showGrid, setShowGrid] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const controlsRef = useRef()

  // Extract mesh data from reconstruction data
  const meshData = useMemo(() => {
    if (data?.meshData) {
      return data.meshData
    }
    return null
  }, [data])

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  const handleDownload = () => {
    // Export mesh data as JSON
    if (meshData) {
      const dataStr = JSON.stringify(meshData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `3d-reconstruction-${meshData.type || 'model'}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  if (!data) {
    return (
      <div className="card p-8 text-center">
        <div className="text-gray-400 mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <Eye className="w-8 h-8" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No 3D Reconstruction</h3>
        <p className="text-gray-600">Process an image to view the 3D reconstruction</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {/* Header with controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">3D Reconstruction</h3>
            {meshData?.type && (
              <span className="text-sm text-primary-600 capitalize">
                {meshData.type} Model • {meshData.components?.length || 0} components
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title={isPlaying ? 'Pause Animation' : 'Play Animation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setWireframe(!wireframe)}
              className={`p-2 rounded transition-colors ${
                wireframe 
                  ? 'text-primary-600 bg-primary-100' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
              title={wireframe ? 'Solid View' : 'Wireframe View'}
            >
              {wireframe ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded transition-colors ${
                showGrid 
                  ? 'text-primary-600 bg-primary-100' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
              title="Toggle Grid"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Download Model"
              disabled={!meshData}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Reconstruction metadata */}
        {data.metadata && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Processing Time:</span>
              <span className="ml-2 font-medium">{data.metadata.processingTime}</span>
            </div>
            <div>
              <span className="text-gray-600">Accuracy:</span>
              <span className="ml-2 font-medium text-green-600">{data.metadata.accuracy}</span>
            </div>
            <div>
              <span className="text-gray-600">Vertices:</span>
              <span className="ml-2 font-medium">
                {(meshData?.statistics?.vertices || data.metadata.vertices)?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Faces:</span>
              <span className="ml-2 font-medium">
                {(meshData?.statistics?.faces || data.metadata.faces)?.toLocaleString()}
              </span>
            </div>
            {data.metadata.imageAnalysis && (
              <>
                <div>
                  <span className="text-gray-600">Source:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    {data.metadata.reconstructionMethod || 'Image-Based'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Regions Detected:</span>
                  <span className="ml-2 font-medium">{data.metadata.imageAnalysis.regionsDetected}</span>
                </div>
                {data.metadata.resolution && (
                  <div>
                    <span className="text-gray-600">Resolution:</span>
                    <span className="ml-2 font-medium text-green-600">{data.metadata.resolution}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3D Viewer - Medical Grade Visualization */}
      <div className="h-[500px] bg-gradient-to-b from-slate-50 to-slate-100 relative">
        <Canvas 
          shadows 
          dpr={[1, 2]}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1
          }}
        >
          <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={40} near={0.1} far={100} />
          
          {/* Medical-grade background */}
          <MedicalBackground />
          
          {/* Professional medical lighting setup - optimized for heart tissue */}
          <ambientLight intensity={0.4} color="#fff8f0" />
          
          {/* Key light - main illumination from upper right with warm tint */}
          <directionalLight 
            position={[8, 12, 6]} 
            intensity={2.2} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={0.5}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-bias={-0.0001}
            color="#fff5f0"
          />
          
          {/* Fill light - cooler, from left for depth */}
          <directionalLight 
            position={[-10, 8, -6]} 
            intensity={1.1} 
            color="#e0f0ff"
          />
          
          {/* Rim light - creates depth separation with subtle warmth */}
          <directionalLight 
            position={[0, -8, -10]} 
            intensity={0.7} 
            color="#ffe8e0"
          />
          
          {/* Top accent light for highlights */}
          <pointLight position={[0, 10, 0]} intensity={0.8} color="#ffffff" distance={20} decay={2} />
          
          {/* Subtle bottom fill for shadow lifting */}
          <pointLight position={[0, -5, 2]} intensity={0.3} color="#e8f0f8" distance={15} decay={2} />
          
          {/* Front fill light for surface details */}
          <spotLight 
            position={[0, 5, 10]}
            angle={0.5}
            penumbra={1}
            intensity={0.6}
            color="#fff8f5"
          />
          
          {/* Side accent for muscle definition */}
          <pointLight position={[-6, 2, 4]} intensity={0.4} color="#ffeedd" distance={12} decay={2} />
          <pointLight position={[6, 2, -4]} intensity={0.4} color="#ddeeff" distance={12} decay={2} />
          
          {/* Studio environment for realistic reflections */}
          <Environment preset="studio" />
          
          {/* Contact shadows for grounding */}
          <ContactShadows
            position={[0, -2.5, 0]}
            opacity={0.4}
            scale={15}
            blur={2.5}
            far={4}
            resolution={512}
            color="#1a365d"
          />
          
          {/* Grid helper */}
          <GridHelper visible={showGrid} />
          
          {/* Controls */}
          <OrbitControls 
            ref={controlsRef}
            autoRotate={autoRotate && isPlaying}
            autoRotateSpeed={1.2}
            enableDamping
            dampingFactor={0.05}
            minDistance={1.5}
            maxDistance={20}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI - Math.PI / 8}
          />
          
          {/* 3D Model */}
          <Suspense fallback={<LoadingFallback />}>
            <OrganMesh 
              meshData={meshData} 
              wireframe={wireframe} 
              isPlaying={isPlaying}
              showLabels={showLabels}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Footer with additional controls */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Auto Rotate</span>
            </label>
            <label className="flex items-center space-x-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={wireframe}
                onChange={(e) => setWireframe(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Wireframe</span>
            </label>
          </div>
          
          <div className="text-sm text-gray-500">
            <span>🖱️ Drag to orbit • Scroll to zoom • Right-click to pan</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReconstructionViewer
