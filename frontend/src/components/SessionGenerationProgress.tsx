'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Brain, FileText, Database, Zap, Search, BarChart3, Puzzle, PenTool, Palette, Save } from 'lucide-react'

interface SessionProgressProps {
  isGenerating: boolean
  progress: number
  stage: 'validating' | 'fetching' | 'generating_structure' | 'generating_essay' | 'generating_images' | 'saving' | 'complete' | 'error'
  message: string
  error?: string
  onRetry?: () => void
}

const stageInfo = {
  validating: {
    title: 'Validating Request',
    description: 'Checking parameters and permissions...',
    icon: <Search className="w-6 h-6" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  fetching: {
    title: 'Fetching Data',
    description: 'Retrieving curriculum information...',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  generating_structure: {
    title: 'Generating Structure',
    description: 'Creating session metadata and learning objectives...',
    icon: <Puzzle className="w-6 h-6" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  generating_essay: {
    title: 'Writing Content',
    description: 'Generating comprehensive learning materials...',
    icon: <PenTool className="w-6 h-6" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  generating_images: {
    title: 'Creating Images',
    description: 'Generating custom images for your content...',
    icon: <Palette className="w-6 h-6" />,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  saving: {
    title: 'Saving Session',
    description: 'Storing your new learning session...',
    icon: <Save className="w-6 h-6" />,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  complete: {
    title: 'Complete!',
    description: 'Your session is ready to learn!',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  error: {
    title: 'Error',
    description: 'Something went wrong during generation',
    icon: <AlertCircle className="w-6 h-6" />,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
}

export default function SessionGenerationProgress({
  isGenerating,
  progress,
  stage,
  message,
  error,
  onRetry
}: SessionProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  // Smooth progress animation with milestone respect
  useEffect(() => {
    if (isGenerating) {
      const timer = setTimeout(() => {
        setDisplayProgress(prev => {
          // Always move towards the target progress, but smoothly
          const diff = progress - prev
          if (diff > 0) {
            // If it's a big jump (milestone), move faster
            if (diff > 10) {
              return Math.min(prev + diff * 0.3, progress)
            }
            // If it's a small change, move gradually
            return Math.min(prev + Math.max(diff * 0.1, 0.5), progress)
          }
          return prev
        })
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setDisplayProgress(progress)
    }
  }, [progress, isGenerating])

  // Continuous smooth progress when generating
  useEffect(() => {
    if (isGenerating && displayProgress < 95) {
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          // Very gradual increase to simulate continuous progress
          return Math.min(prev + 0.2, 95) // Cap at 95% until actual completion
        })
      }, 300)
      return () => clearInterval(interval)
    }
  }, [isGenerating, displayProgress])

  const currentStageInfo = stageInfo[stage]

  return (
    <div className="min-h-[200px] md:min-h-[200px] min-h-[80px] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm mx-auto p-4 md:p-4 p-2"
      >
        {/* Main Progress Circle */}
        <div className="relative w-8 h-8 md:w-16 md:h-16 mx-auto mb-2 md:mb-4">
          <svg className="w-8 h-8 md:w-16 md:h-16 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="35"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="35"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className={stage === 'error' ? 'text-red-500' : 'text-yellow-500'}
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 219.8' }}
              animate={{ strokeDasharray: `${(displayProgress / 100) * 219.8} 219.8` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm md:text-lg mb-0.5">{currentStageInfo.icon}</div>
              <div className="text-xs md:text-xs font-semibold text-gray-700">
                {Math.round(displayProgress)}%
              </div>
            </div>
          </div>
        </div>

        {/* Stage Information */}
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`p-2 md:p-3 rounded-lg border-2 ${currentStageInfo.bgColor} ${currentStageInfo.borderColor} mb-2 md:mb-4`}
        >
          <h3 className={`text-sm md:text-base font-semibold ${currentStageInfo.color} mb-1`}>
            {currentStageInfo.title}
          </h3>
          <p className="text-xs text-gray-600">
            {message}
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-2 md:mb-4">
          <div className="w-full bg-gray-200 rounded-full h-1 md:h-1.5">
            <motion.div
              className={`h-1 md:h-1.5 rounded-full ${stage === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="font-medium">{Math.round(displayProgress)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Error State */}
        {stage === 'error' && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-3 h-3" />
              <span className="text-xs font-medium">Generation Failed</span>
            </div>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 px-3 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Try Again</span>
              </button>
            )}
          </motion.div>
        )}

        {/* Success State */}
        {stage === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg"
          >
            <div className="flex items-center justify-center space-x-2 text-emerald-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Session Ready!</span>
            </div>
          </motion.div>
        )}

        {/* Generation Steps Indicator */}
        {isGenerating && stage !== 'error' && (
          <div className="mt-4 hidden md:block">
            <div className="flex justify-center space-x-4">
              {[
                { key: 'validating', label: 'Validation', icon: <Search className="w-4 h-4" /> },
                { key: 'fetching', label: 'Data', icon: <BarChart3 className="w-4 h-4" /> },
                { key: 'generating_structure', label: 'Structure', icon: <Puzzle className="w-4 h-4" /> },
                { key: 'generating_essay', label: 'Content', icon: <PenTool className="w-4 h-4" /> },
                { key: 'generating_images', label: 'Images', icon: <Palette className="w-4 h-4" /> },
                { key: 'saving', label: 'Save', icon: <Save className="w-4 h-4" /> }
              ].map((step, index) => {
                const isActive = step.key === stage
                const isCompleted = ['validating', 'fetching', 'generating_structure', 'generating_essay', 'generating_images', 'saving'].indexOf(stage) > ['validating', 'fetching', 'generating_structure', 'generating_essay', 'generating_images', 'saving'].indexOf(step.key)
                
                return (
                  <div
                    key={step.key}
                    className={`flex flex-col items-center text-xs ${
                      isActive ? 'text-yellow-600 font-medium' : 
                      isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <span className="w-6 h-6 flex items-center justify-center text-sm">
                      {isCompleted ? '✓' : isActive ? '⟳' : step.icon}
                    </span>
                    <span className="text-xs">{step.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
