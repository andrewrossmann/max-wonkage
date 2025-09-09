'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Clock, 
  BookOpen, 
  Target, 
  ChevronDown, 
  ChevronUp,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface CurriculumReviewProps {
  curriculum: any
  onApprove: (customizations?: any) => void
  onReject: (reason: string) => void
  onCustomize: (changes: any) => void
  isProcessing?: boolean
}

export default function CurriculumReview({
  curriculum,
  onApprove,
  onReject,
  onCustomize,
  isProcessing = false
}: CurriculumReviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
  const [customizations, setCustomizations] = useState<any>({})
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const curriculumData = curriculum.curriculum_data
  const sessionList = curriculumData?.session_list || []

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleCustomize = (field: string, value: any) => {
    const newCustomizations = {
      ...customizations,
      [field]: value
    }
    setCustomizations(newCustomizations)
    onCustomize(newCustomizations)
  }

  const handleApprove = () => {
    onApprove(Object.keys(customizations).length > 0 ? customizations : undefined)
  }

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getCurriculumTypeColor = (type: string) => {
    switch (type) {
      case 'crash_course': return 'bg-red-100 text-red-800'
      case 'standard': return 'bg-blue-100 text-blue-800'
      case 'comprehensive': return 'bg-green-100 text-green-800'
      case 'mastery': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Curriculum</h1>
        <p className="text-gray-600">Please review the generated curriculum and make any adjustments before approving</p>
      </div>

      {/* Curriculum Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6"
      >
        <div 
          className="p-6 cursor-pointer"
          onClick={() => toggleSection('overview')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 text-yellow-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Curriculum Overview</h2>
                <p className="text-gray-600">{curriculumData?.curriculum_overview?.title || curriculum.title}</p>
              </div>
            </div>
            {expandedSections.has('overview') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {expandedSections.has('overview') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Total Duration</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDuration((curriculumData?.curriculum_overview?.total_estimated_hours || 0) * 60)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Sessions</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {curriculumData?.curriculum_overview?.total_sessions || sessionList.length}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Type</span>
                  </div>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCurriculumTypeColor(curriculum.curriculum_type || 'standard')}`}>
                    {(curriculum.curriculum_type || 'standard').replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{curriculumData?.curriculum_overview?.description || 'No description available'}</p>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning Outcomes</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {(curriculumData?.curriculum_overview?.learning_outcomes || []).map((outcome: string, index: number) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Session List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6"
      >
        <div 
          className="p-6 cursor-pointer"
          onClick={() => toggleSection('sessions')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Play className="w-6 h-6 text-yellow-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Learning Sessions</h2>
                <p className="text-gray-600">{sessionList.length} sessions planned</p>
              </div>
            </div>
            {expandedSections.has('sessions') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {expandedSections.has('sessions') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 p-6"
            >
              <div className="space-y-4">
                {sessionList.map((session: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">Session {session.session_number || index + 1}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.content_density === 'light' ? 'bg-blue-100 text-blue-800' :
                            session.content_density === 'moderate' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {session.content_density || 'moderate'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{session.title || `Session ${index + 1}`}</h3>
                        <p className="text-sm text-gray-600 mb-2">{session.description || session.overview || 'No description available'}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>⏱️ {formatDuration(curriculum.time_availability?.session_length || 60)}</span>
                          <span>📖 {session.estimated_reading_time || 0} min read</span>
                          <span>📚 {session.recommended_readings?.length || 0} readings</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        {!showRejectForm ? (
          <>
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="w-5 h-5" />
              <span>Request Changes</span>
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-8 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Approve & Generate Sessions</span>
                </>
              )}
            </button>
          </>
        ) : (
          <div className="w-full max-w-md mx-auto">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">What would you like to change?</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Describe what you'd like to modify..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
              />
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || isProcessing}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
