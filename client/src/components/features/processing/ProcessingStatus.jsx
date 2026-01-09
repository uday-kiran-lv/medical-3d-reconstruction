import { useEffect, useState } from 'react'
import { Cpu, CheckCircle, AlertCircle, Clock, Activity } from 'lucide-react'

const ProcessingStatus = ({ progress, isProcessing, message = '' }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  const processingSteps = [
    { id: 1, name: 'Image Preprocessing', description: 'Loading and normalizing image data' },
    { id: 2, name: 'Feature Analysis', description: 'Analyzing image features and structures' },
    { id: 3, name: 'Structure Detection', description: 'Detecting anatomical boundaries' },
    { id: 4, name: 'Mesh Generation', description: 'Generating 3D mesh vertices and faces' },
    { id: 5, name: 'Geometry Building', description: 'Building 3D geometry from mesh data' },
    { id: 6, name: 'Optimization', description: 'Applying smoothing and final optimizations' }
  ]

  useEffect(() => {
    // Update current step based on progress
    const stepIndex = Math.floor((progress / 100) * processingSteps.length)
    setCurrentStep(Math.min(stepIndex, processingSteps.length - 1))
  }, [progress])

  useEffect(() => {
    let interval
    if (isProcessing) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      setElapsedTime(0)
    }
    return () => clearInterval(interval)
  }, [isProcessing])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed'
    if (stepIndex === currentStep && isProcessing) return 'active'
    return 'pending'
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isProcessing 
                ? 'bg-blue-100 text-blue-600' 
                : progress === 100 
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {isProcessing ? (
                <Activity className="w-6 h-6 animate-pulse" />
              ) : progress === 100 ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <Cpu className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isProcessing 
                  ? 'Processing Image...' 
                  : progress === 100 
                  ? 'Processing Complete!' 
                  : 'Ready to Process'
                }
              </h3>
              <p className="text-sm text-gray-600">
                {message || (isProcessing 
                  ? `Step ${currentStep + 1} of ${processingSteps.length}` 
                  : progress === 100 
                  ? 'Your 3D reconstruction is ready'
                  : 'Configure parameters and start processing'
                )}
              </p>
            </div>
          </div>
          
          {isProcessing && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {Math.round(progress)}%
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(elapsedTime)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-6">
        <div className="relative">
          <div className="overflow-hidden h-3 mb-4 text-xs flex rounded bg-gray-200">
            <div 
              style={{ width: `${progress}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                isProcessing 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                  : progress === 100 
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gray-400'
              }`}
            />
          </div>
          
          {/* Progress percentage */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span className="font-medium">{Math.round(progress)}% Complete</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Processing Steps */}
      <div className="p-6 pt-0">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Processing Steps</h4>
        <div className="space-y-3">
          {processingSteps.map((step, index) => {
            const status = getStepStatus(index)
            return (
              <div key={step.id} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  status === 'completed' 
                    ? 'bg-green-100 text-green-600'
                    : status === 'active'
                    ? 'bg-blue-100 text-blue-600 animate-pulse'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : status === 'active' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${
                    status === 'completed' 
                      ? 'text-green-600'
                      : status === 'active'
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* System Information */}
      <div className="p-6 pt-0 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">System Information</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500">GPU Acceleration:</span>
            <span className="ml-2 text-green-600 font-medium">Enabled</span>
          </div>
          <div>
            <span className="text-gray-500">Memory Usage:</span>
            <span className="ml-2 text-gray-900 font-medium">2.1 GB / 8 GB</span>
          </div>
          <div>
            <span className="text-gray-500">Model Version:</span>
            <span className="ml-2 text-gray-900 font-medium">CNN-3D v2.1</span>
          </div>
          <div>
            <span className="text-gray-500">Estimated Time:</span>
            <span className="ml-2 text-gray-900 font-medium">
              {isProcessing ? `${Math.max(0, 60 - elapsedTime)}s remaining` : '~45s'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcessingStatus
