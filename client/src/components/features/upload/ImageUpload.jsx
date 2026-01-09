import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileImage, AlertCircle, Brain } from 'lucide-react'

const ImageUpload = ({ onImageUpload, onViewBrainModel }) => {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null)
    
    if (rejectedFiles.length > 0) {
      setError('Please upload a valid image file (JPEG, PNG, DICOM, or NIFTI format)')
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      
      // Validate file size (max 50MB for medical images)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        return
      }

      // Create preview for standard image formats
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target.result)
        }
        reader.readAsDataURL(file)
      } else {
        // For DICOM/NIFTI files, show file info instead of preview
        setPreview(null)
      }

      onImageUpload(file)
    }
  }, [onImageUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/dicom': ['.dcm', '.dicom'],
      'application/octet-stream': ['.nii', '.nii.gz']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const clearPreview = () => {
    setPreview(null)
    setError(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Medical Image
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload a 2D medical image (CT scan, MRI, X-ray) to generate a 3D reconstruction 
          of body organs using our advanced CNN model.
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-full h-64 object-contain mx-auto rounded"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearPreview()
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className={`w-12 h-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? 'Drop the image here...' : 'Drop medical image here, or click to browse'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports JPEG, PNG, DICOM (.dcm), and NIFTI (.nii) formats
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Maximum file size: 50MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* View Realistic Brain Model Button */}
      {onViewBrainModel && (
        <div className="mt-6 text-center">
          <div className="inline-block p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <p className="text-gray-600 mb-3">Or explore our anatomically accurate 3D models:</p>
            <button
              onClick={onViewBrainModel}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              <Brain className="w-5 h-5" />
              View Realistic 3D Brain Model
            </button>
            <p className="text-xs text-gray-500 mt-2">High-detail anatomical brain with gyri, sulci, cerebellum & brainstem</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Supported Formats Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <FileImage className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <h3 className="font-medium text-gray-900">CT Scans</h3>
          <p className="text-sm text-gray-500">DICOM format preferred</p>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <FileImage className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <h3 className="font-medium text-gray-900">MRI Images</h3>
          <p className="text-sm text-gray-500">NIFTI or DICOM</p>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <FileImage className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <h3 className="font-medium text-gray-900">X-rays</h3>
          <p className="text-sm text-gray-500">JPEG, PNG, DICOM</p>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <FileImage className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <h3 className="font-medium text-gray-900">Ultrasound</h3>
          <p className="text-sm text-gray-500">Standard image formats</p>
        </div>
      </div>
    </div>
  )
}

export default ImageUpload
