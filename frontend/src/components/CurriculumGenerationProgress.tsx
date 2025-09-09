'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface GenerationProgressProps {
  isGenerating: boolean
  progress: number
  stage: 'analyzing' | 'calculating' | 'generating' | 'structuring' | 'finalizing'
  curriculumType?: string
  sessionCount?: number
  error?: string
  onRetry?: () => void
}

const stageInfo = {
  analyzing: {
    title: 'Analyzing Your Profile',
    description: 'Understanding your background, goals, and learning preferences...',
    icon: '🔍',
    duration: 2000
  },
  calculating: {
    title: 'Calculating Optimal Structure',
    description: 'Determining session count, content density, and learning progression...',
    icon: '📊',
    duration: 1500
  },
  generating: {
    title: 'Generating Curriculum Content',
    description: 'Creating personalized learning materials and session outlines...',
    icon: '🤖',
    duration: 3000
  },
  structuring: {
    title: 'Structuring Sessions',
    description: 'Organizing content into digestible learning sessions...',
    icon: '📚',
    duration: 2000
  },
  finalizing: {
    title: 'Finalizing Your Curriculum',
    description: 'Adding final touches and preparing for review...',
    icon: '✨',
    duration: 1000
  }
}

export default function CurriculumGenerationProgress({
  isGenerating,
  progress,
  stage,
  curriculumType,
  sessionCount,
  error,
  onRetry
}: GenerationProgressProps) {
  const [currentStage, setCurrentStage] = useState<typeof stage>('analyzing')
  const [stageProgress, setStageProgress] = useState(0)

  // Simulate stage progression
  useEffect(() => {
    if (!isGenerating) return

    const stages: (typeof stage)[] = ['analyzing', 'calculating', 'generating', 'structuring', 'finalizing']
    let currentStageIndex = 0

    const progressInterval = setInterval(() => {
      setStageProgress(prev => {
        const newProgress = prev + 2
        if (newProgress >= 100) {
          if (currentStageIndex < stages.length - 1) {
            currentStageIndex++
            setCurrentStage(stages[currentStageIndex])
            return 0
          } else {
            clearInterval(progressInterval)
            return 100
          }
        }
        return newProgress
      })
    }, 50)

    return () => clearInterval(progressInterval)
  }, [isGenerating])

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Generation Failed</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  if (!isGenerating) {
    return null
  }

  const currentStageInfo = stageInfo[currentStage]

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto p-8"
      >
        {/* Main Progress Circle */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-yellow-500"
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 251.2' }}
              animate={{ strokeDasharray: `${(stageProgress / 100) * 251.2} 251.2` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-1">{currentStageInfo.icon}</div>
              <div className="text-sm font-semibold text-gray-700">
                {Math.round(stageProgress)}%
              </div>
            </div>
          </div>
        </div>

        {/* Stage Information */}
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {currentStageInfo.title}
          </h3>
          <p className="text-gray-600 mb-4">
            {currentStageInfo.description}
          </p>
        </motion.div>

        {/* Curriculum Preview */}
        {(curriculumType || sessionCount) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-50 rounded-lg p-4 mt-6"
          >
            <div className="text-sm text-gray-600 mb-2">Your curriculum preview:</div>
            <div className="flex items-center justify-center space-x-4 text-sm">
              {curriculumType && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium capitalize">
                    {curriculumType.replace('_', ' ')}
                  </span>
                </div>
              )}
              {sessionCount && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Sessions:</span>
                  <span className="font-medium">{sessionCount}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Loading Animation */}
        <div className="flex items-center justify-center space-x-1 mt-6">
          <motion.div
            className="w-2 h-2 bg-yellow-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-yellow-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-yellow-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>

        {/* Estimated Time */}
        <div className="text-xs text-gray-500 mt-4">
          This usually takes 30-60 seconds
        </div>
      </motion.div>
    </div>
  )
}
