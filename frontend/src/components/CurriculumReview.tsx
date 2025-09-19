'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
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
  RotateCcw,
  Download
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
  const router = useRouter()
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

  const handleReviseSyllabus = () => {
    // Navigate to onboarding page with edit mode and curriculum ID
    router.push(`/onboarding?edit=${curriculum.id}`)
  }

  const downloadSession = async (sessionId: string, sessionTitle: string, sessionNumber: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No active session')
      }

      const response = await fetch(`/api/curriculum/session/${sessionId}/download`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download session')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Session_${sessionNumber}_${sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading session:', error)
      alert('Failed to download session file')
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Syllabus</h1>
        <p className="text-gray-600 mb-4">Please review the generated syllabus and make any adjustments before approving</p>
        
        {/* Small convenience buttons */}
        <div className="flex justify-center space-x-3">
          <button
            onClick={handleReviseSyllabus}
            disabled={isProcessing}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Revise</span>
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve</span>
          </button>
        </div>
      </div>

      {/* Syllabus Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {curriculumData?.curriculum_overview?.title || curriculum.title}
            </h2>
            <p className="text-gray-600 text-lg">
              {sessionList.length} Sessions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Total Duration</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatDuration((curriculumData?.curriculum_overview?.total_estimated_hours || 0) * 60)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Sessions</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {sessionList.length}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Type</span>
              </div>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getCurriculumTypeColor(curriculum.curriculum_type || 'standard')}`}>
                {(curriculum.curriculum_type || 'standard').replace('_', ' ')}
              </div>
            </div>
          </div>

          {curriculumData?.curriculum_overview?.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Description</h3>
              <p className="text-gray-700 leading-relaxed">{curriculumData.curriculum_overview.description}</p>
            </div>
          )}

          {curriculumData?.curriculum_overview?.learning_outcomes && curriculumData.curriculum_overview.learning_outcomes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Outcomes</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {curriculumData.curriculum_overview.learning_outcomes.map((outcome: string, index: number) => (
                  <li key={index} className="leading-relaxed">{outcome}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>

      {/* Syllabus Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Sessions</h2>
            <p className="text-gray-600">A comprehensive breakdown of your learning journey</p>
          </div>

          <div className="space-y-6">
            {sessionList.map((session: any, index: number) => (
              <div key={index} className="border-l-4 border-yellow-400 pl-6 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg font-bold text-gray-900">Session {session.session_number || index + 1}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.content_density === 'light' ? 'bg-blue-100 text-blue-800' :
                        session.content_density === 'moderate' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {session.content_density || 'moderate'}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {session.title || `Session ${index + 1}`}
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      {session.description || session.overview || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(curriculum.time_availability?.sessionLength || curriculum.time_availability?.session_length || 60)}</span>
                        </div>
                        {session.estimated_reading_time > 0 && (
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{session.estimated_reading_time} min read</span>
                          </div>
                        )}
                        {session.recommended_readings?.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>{session.recommended_readings.length} readings</span>
                          </div>
                        )}
                      </div>
                      {session.id && (
                        <button
                          onClick={() => downloadSession(session.id, session.title, session.session_number || index + 1)}
                          className="flex items-center space-x-2 px-3 py-2 bg-yellow-500 text-black text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Session</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
              onClick={handleReviseSyllabus}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Edit3 className="w-5 h-5" />
              <span>Revise Syllabus</span>
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
                  <span>Approve</span>
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
