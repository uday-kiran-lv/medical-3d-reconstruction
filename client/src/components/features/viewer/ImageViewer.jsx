import { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCw, Move, Download, Info } from 'lucide-react'

const ImageViewer = ({ image, metadata }) => {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [imageInfo, setImageInfo] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  const [slices, setSlices] = useState(1)
  const [currentSlice, setCurrentSlice] = useState(1)

  // ROI selection
  const [roiEnabled, setRoiEnabled] = useState(false)
  const [isDrawingRoi, setIsDrawingRoi] = useState(false)
  const [roi, setRoi] = useState(null)

  useEffect(() => {
    if (image) {
      // Reset transformations when new image is loaded
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
      
      // Extract image information
      const info = {
        name: image.name,
        size: `${(image.size / 1024 / 1024).toFixed(2)} MB`,
        type: image.type || 'Unknown',
        lastModified: new Date(image.lastModified).toLocaleDateString()
      }
      setImageInfo(info)

      // create object URL safely and clean up
      try {
        const url = URL.createObjectURL(image)
        setImageUrl(url)
      } catch (e) {
        setImageUrl(null)
      }

      // slices from metadata (fallback to 1)
      setSlices((metadata && metadata.slices) || 1)
      setCurrentSlice(1)
    }
  }, [image])

  useEffect(() => {
    return () => {
      if (imageUrl) {
        try { URL.revokeObjectURL(imageUrl) } catch (e) {}
      }
    }
  }, [imageUrl])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.25, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.25, 0.2))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleReset = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - lastMousePos.x
    const deltaY = e.clientY - lastMousePos.y
    
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))
    
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDownload = () => {
    if (image) {
      if (imageUrl) {
        const a = document.createElement('a')
        a.href = imageUrl
        a.download = image.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    }
  }

  if (!image) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <Info className="w-8 h-8" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Image Selected</h3>
        <p className="text-gray-500">Upload an image to view it here</p>
      </div>
    )
  }

  const displayIsImage = !!imageUrl && (image.type || '').startsWith('image/')

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header with controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Image Viewer</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={handleRotate}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Reset View"
            >
              <Move className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Image Info"
            >
              <Info className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            {/* ROI controls */}
            <button
              onClick={() => setRoiEnabled(prev => !prev)}
              className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors ${roiEnabled ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Toggle ROI Selector"
            >
              ROI
            </button>
            {roiEnabled && (
              <button
                onClick={() => { setIsDrawingRoi(!isDrawingRoi); setRoi(null) }}
                className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors ${isDrawingRoi ? 'bg-blue-100' : ''}`}
                title="Draw ROI"
              >
                {isDrawingRoi ? 'Drawing...' : 'Draw ROI'}
              </button>
            )}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Image container */}
      <div 
        ref={containerRef}
        className="relative h-96 bg-gray-100 overflow-hidden cursor-move"
        onMouseDown={(e) => {
          // if drawing ROI, handle drawing start
          if (roiEnabled && isDrawingRoi) {
            const rect = e.currentTarget.getBoundingClientRect()
            const startX = e.clientX - rect.left
            const startY = e.clientY - rect.top
            setRoi({ x: startX, y: startY, w: 0, h: 0 })
            setIsDrawingRoi(true)
            return
          }
          handleMouseDown(e)
        }}
        onMouseMove={(e) => {
          if (roiEnabled && isDrawingRoi && roi) {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            setRoi(prev => prev ? ({ ...prev, w: x - prev.x, h: y - prev.y }) : prev)
            return
          }
          handleMouseMove(e)
        }}
        onMouseUp={(e) => {
          if (roiEnabled && isDrawingRoi) {
            setIsDrawingRoi(false)
            return
          }
          handleMouseUp()
        }}
        onMouseLeave={() => { if (!isDrawingRoi) handleMouseUp() }}
      >
        {displayIsImage ? (
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Medical Image"
            className="absolute inset-0 m-auto max-w-none transition-transform duration-200"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
            draggable={false}
          />
        ) : (
          // Placeholder canvas for non-standard formats or multi-slice viewers
          <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
            <div className="space-y-2 text-center">
              <div>Slice Viewer</div>
              <div className="text-sm text-gray-300">{metadata?.modality || 'Unknown format'}</div>
              <div className="text-xs text-gray-400">Slice {currentSlice} / {slices}</div>
            </div>
          </div>
        )}
        
        {/* Grid overlay for precise positioning */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div 
            className="w-full h-full" 
            style={{
              backgroundImage: `
                linear-gradient(to right, #ffffff 1px, transparent 1px),
                linear-gradient(to bottom, #ffffff 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} 
          />
        </div>

        {/* ROI overlay */}
        {roi && (
          <div style={{position:'absolute', left: Math.min(roi.x, roi.x+roi.w), top: Math.min(roi.y, roi.y+roi.h), width: Math.abs(roi.w), height: Math.abs(roi.h), border: '2px dashed #fff', pointerEvents: 'none'}} />
        )}
      </div>

      {/* Slice navigation */}
      {slices && slices > 1 && (
        <div className="p-4">
          <input
            type="range"
            min={1}
            max={slices}
            value={currentSlice}
            onChange={(e) => setCurrentSlice(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-gray-600 mt-1">Slice {currentSlice} of {slices}</div>
        </div>
      )}

      {/* Image information panel */}
      {showInfo && imageInfo && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Image Information</h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">File Name:</dt>
            <dd className="text-gray-900 font-mono">{imageInfo.name}</dd>
            <dt className="text-gray-500">File Size:</dt>
            <dd className="text-gray-900">{imageInfo.size}</dd>
            <dt className="text-gray-500">File Type:</dt>
            <dd className="text-gray-900">{imageInfo.type}</dd>
            <dt className="text-gray-500">Last Modified:</dt>
            <dd className="text-gray-900">{imageInfo.lastModified}</dd>
          </dl>
        </div>
      )}
    </div>
  )
}

export default ImageViewer
