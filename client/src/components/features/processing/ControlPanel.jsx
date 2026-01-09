import { useState } from 'react'
import { Play, Settings, Info, RefreshCw } from 'lucide-react'

const ControlPanel = ({ onStartReconstruction, disabled = false, onSaveConfiguration, onBackToUpload }) => {
  const [parameters, setParameters] = useState({
    resolution: 'high',
    algorithm: 'cnn-advanced',
    model: 'standard-cnn',
    targetOutput: 'mesh',
    smoothing: 0.7,
    detail: 0.8,
    organType: 'auto',
    enhancement: true,
    edgeDetection: true,
    noiseReduction: 0.6,
    roiEnabled: false
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const handleParameterChange = (key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleStartProcessing = async () => {
    setIsValidating(true)
    
    // Simulate parameter validation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsValidating(false)
    onStartReconstruction(parameters)
  }

  const handleReset = () => {
    setParameters({
      resolution: 'high',
      algorithm: 'cnn-advanced',
      model: 'standard-cnn',
      targetOutput: 'mesh',
      smoothing: 0.7,
      detail: 0.8,
      organType: 'auto',
      enhancement: true,
      edgeDetection: true,
      noiseReduction: 0.6
    })
  }

  const getEstimatedTime = () => {
    const baseTime = 45 // seconds
    const resolutionMultiplier = {
      'low': 0.5,
      'medium': 0.8,
      'high': 1.0,
      'ultra': 1.5
    }
    
    return Math.round(baseTime * resolutionMultiplier[parameters.resolution])
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Reconstruction Settings</h3>
              <p className="text-sm text-gray-600">Configure CNN parameters for optimal results</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
            title="Reset to defaults"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="p-6 space-y-6">
        {/* Resolution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Resolution
          </label>
          <select
            value={parameters.resolution}
            onChange={(e) => handleParameterChange('resolution', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low (512x512) - Fast</option>
            <option value="medium">Medium (1024x1024) - Balanced</option>
            <option value="high">High (2048x2048) - Quality</option>
            <option value="ultra">Ultra (4096x4096) - Best</option>
          </select>
        </div>

        {/* Algorithm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reconstruction Algorithm
          </label>
          <select
            value={parameters.algorithm}
            onChange={(e) => handleParameterChange('algorithm', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cnn-basic">CNN Basic - Fast processing</option>
            <option value="cnn-advanced">CNN Advanced - Better accuracy</option>
            <option value="cnn-medical">CNN Medical - Specialized for organs</option>
            <option value="hybrid">Hybrid CNN-GAN - Highest quality</option>
          </select>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
          <select
            value={parameters.model}
            onChange={(e) => handleParameterChange('model', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="standard-cnn">Standard CNN</option>
            <option value="high-detail-3dgan">High-Detail 3DGAN</option>
            <option value="medical-specialized">Medical Specialized</option>
          </select>
        </div>

        {/* Target Output */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Output</label>
          <select
            value={parameters.targetOutput}
            onChange={(e) => handleParameterChange('targetOutput', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mesh">3D Mesh</option>
            <option value="volume">Volume</option>
            <option value="segmentation">Organ Segmentation</option>
          </select>
        </div>

        {/* Organ Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Organ Type
          </label>
          <select
            value={parameters.organType}
            onChange={(e) => handleParameterChange('organType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="auto">Auto-detect</option>
            <option value="heart">Heart</option>
            <option value="brain">Brain</option>
            <option value="liver">Liver</option>
            <option value="kidney">Kidney</option>
            <option value="lung">Lung</option>
            <option value="bone">Bone</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Quality Sliders */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Surface Smoothing: {(parameters.smoothing * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={parameters.smoothing}
              onChange={(e) => handleParameterChange('smoothing', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Sharp edges</span>
              <span>Smooth surface</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detail Level: {(parameters.detail * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={parameters.detail}
              onChange={(e) => handleParameterChange('detail', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low detail</span>
              <span>High detail</span>
            </div>
          </div>
        </div>

        {/* Enhancement Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Image Enhancement</label>
            <input
              type="checkbox"
              checked={parameters.enhancement}
              onChange={(e) => handleParameterChange('enhancement', e.target.checked)}
              className="rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Edge Detection</label>
            <input
              type="checkbox"
              checked={parameters.edgeDetection}
              onChange={(e) => handleParameterChange('edgeDetection', e.target.checked)}
              className="rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Enable ROI Selector</label>
            <input
              type="checkbox"
              checked={parameters.roiEnabled}
              onChange={(e) => handleParameterChange('roiEnabled', e.target.checked)}
              className="rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
          </button>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Noise Reduction: {(parameters.noiseReduction * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={parameters.noiseReduction}
                onChange={(e) => handleParameterChange('noiseReduction', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Estimated Processing Time */}
      <div className="p-6 pt-0">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Estimated processing time: ~{getEstimatedTime()} seconds
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Time may vary based on image complexity and system performance
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6 pt-0">
        <div className="space-y-2">
          <button
            onClick={handleStartProcessing}
            disabled={disabled || isValidating}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 ${
              disabled || isValidating
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Validating Parameters...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start 3D Reconstruction</span>
              </>
            )}
          </button>

          <div className="flex space-x-2">
            <button
              onClick={() => onSaveConfiguration && onSaveConfiguration(parameters)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg"
              type="button"
            >
              Save Configuration
            </button>
            <button
              onClick={() => onBackToUpload && onBackToUpload()}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg"
              type="button"
            >
              Back to Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
