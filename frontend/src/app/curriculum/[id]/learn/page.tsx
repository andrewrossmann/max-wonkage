'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import SessionGenerationProgress from '@/components/SessionGenerationProgress'
import { Curriculum, LearningSession, getCurriculumSessions, markSessionComplete, markSessionIncomplete } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { 
  BookOpen, 
  Clock, 
  Target, 
  CalendarDays, 
  Play, 
  CheckCircle, 
  Circle,
  ArrowLeft,
  Download,
  User,
  Brain
} from 'lucide-react'

export default function LearningPage({ params }: { params: Promise<{ id: string }> }) {
  console.log('=== LEARNING PAGE COMPONENT RENDERED ===')
  const { user, session, loading, signOut } = useAuth()
  const router = useRouter()
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0)
  const [generatingSessions, setGeneratingSessions] = useState<Set<number>>(new Set())
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())
  const [sessionProgress, setSessionProgress] = useState<{[key: number]: {
    progress: number
    stage: 'validating' | 'fetching' | 'generating_structure' | 'generating_essay' | 'saving' | 'complete' | 'error'
    message: string
    error?: string
  }}>({})

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadCurriculumData = async () => {
      if (!user || !session?.access_token) return
      
      try {
        const resolvedParams = await params
        const curriculumId = resolvedParams.id
        
        // Fetch curriculum details
        const curriculumResponse = await fetch(`/api/curriculum/${curriculumId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (curriculumResponse.ok) {
          const curriculumData = await curriculumResponse.json()
          setCurriculum(curriculumData)
        } else {
          setError('Failed to load curriculum')
          return
        }
        
        // Fetch sessions
        const sessionsData = await getCurriculumSessions(curriculumId)
        setSessions(sessionsData)
        
        // Find the first incomplete session
        const firstIncompleteIndex = sessionsData.findIndex(session => !session.completed)
        setCurrentSessionIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0)
        
      } catch (err) {
        console.error('Error loading curriculum data:', err)
        setError('Failed to load curriculum data')
      } finally {
        setDataLoading(false)
      }
    }

    if (user && session?.access_token) {
      loadCurriculumData()
    }
  }, [user, session, params])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handleStartSession = (sessionId: string, sessionNumber: number) => {
    // Navigate to the dedicated session view
    if (curriculum) {
      router.push(`/curriculum/${curriculum.id}/session/${sessionNumber}`)
    }
  }

  const handleDownloadSession = async (sessionId: string, sessionTitle: string, sessionNumber: number) => {
    try {
      const response = await fetch(`/api/curriculum/session/${sessionId}/download`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${sessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_session_${sessionNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError('Failed to download session')
      }
    } catch (err) {
      console.error('Error downloading session:', err)
      setError('Failed to download session')
    }
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getProgressPercentage = (): number => {
    if (!curriculum) return 0
    const totalSessions = curriculum.time_availability.totalWeeks * curriculum.time_availability.sessionsPerWeek
    const completedSessions = sessions.filter(session => session.completed).length
    return Math.round((completedSessions / totalSessions) * 100)
  }

  const handleGenerateSession = async (sessionNumber: number) => {
    console.log('=== GENERATE SESSION FUNCTION CALLED ===', { sessionNumber, user: !!user, session: !!session, curriculum: !!curriculum })
    
    if (!user || !session?.access_token || !curriculum) {
      console.log('Missing required data:', { user: !!user, session: !!session, curriculum: !!curriculum })
      return
    }

    try {
      console.log('Starting session generation...')
      // Add session to generating set and initialize progress
      setGeneratingSessions(prev => new Set(prev).add(sessionNumber))
      setSessionProgress(prev => ({
        ...prev,
        [sessionNumber]: {
          progress: 0,
          stage: 'validating',
          message: 'Starting generation...'
        }
      }))

      console.log('Making fetch request to API...')
      const response = await fetch('/api/curriculum/session/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          curriculumId: curriculum.id,
          sessionNumber,
          userId: user.id,
          useSSE: true
        })
      })

      console.log('Fetch response received:', { ok: response.ok, status: response.status, statusText: response.statusText })

      if (!response.ok) {
        throw new Error('Failed to start session generation')
      }

      // Handle Server-Sent Events
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body available')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            console.log('Received SSE line:', line)
            try {
              const jsonString = line.slice(6).trim()
              
              // Skip empty or malformed data
              if (!jsonString || jsonString === '') {
                console.log('Skipping empty SSE data')
                continue
              }
              
              // Try to fix common JSON issues
              let cleanJsonString = jsonString
              
              // Remove any trailing incomplete data
              if (cleanJsonString.endsWith(',')) {
                cleanJsonString = cleanJsonString.slice(0, -1)
              }
              
              // Try to find the end of valid JSON
              let validJson = cleanJsonString
              let braceCount = 0
              let inString = false
              let escapeNext = false
              
              for (let i = 0; i < cleanJsonString.length; i++) {
                const char = cleanJsonString[i]
                
                if (escapeNext) {
                  escapeNext = false
                  continue
                }
                
                if (char === '\\') {
                  escapeNext = true
                  continue
                }
                
                if (char === '"' && !escapeNext) {
                  inString = !inString
                }
                
                if (!inString) {
                  if (char === '{') braceCount++
                  if (char === '}') braceCount--
                  
                  if (braceCount === 0 && i > 0) {
                    validJson = cleanJsonString.substring(0, i + 1)
                    break
                  }
                }
              }
              
              const data = JSON.parse(validJson)
              console.log('Parsed SSE data:', data)
              
              // Update progress
              setSessionProgress(prev => ({
                ...prev,
                [sessionNumber]: {
                  progress: data.progress || 0,
                  stage: data.stage || 'unknown',
                  message: data.message || 'Processing...',
                  error: data.data?.error
                }
              }))

              // If complete, fetch full session data and add to list
              if (data.stage === 'complete') {
                console.log('Session generation complete!', { stage: data.stage, hasData: !!data.data, data: data.data })
                if (data.data) {
                  try {
                    // Parse the JSON string data
                    const sessionData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data
                    console.log('Parsed session data:', sessionData)
                    console.log('Fetching full session data for:', sessionData.id)
                    // Fetch the complete session data from database
                    fetchFullSessionData(sessionData.id, sessionNumber)
                  } catch (parseError) {
                    console.error('Error parsing session data:', parseError)
                    console.log('Raw data:', data.data)
                  }
                } else {
                  console.log('No session data in completion message')
                }
              }

              // If error, show error message
              if (data.stage === 'error') {
                setError(`Failed to generate session ${sessionNumber}: ${data.message}`)
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError)
              console.error('Problematic line:', line)
              
              // Send a fallback progress update
              setSessionProgress(prev => ({
                ...prev,
                [sessionNumber]: {
                  progress: prev[sessionNumber]?.progress || 0,
                  stage: 'error',
                  message: 'Progress update error',
                  error: 'Failed to parse progress data'
                }
              }))
            }
          }
        }
      }

    } catch (error) {
      console.error('Error generating session:', error)
      setError(`Failed to generate session ${sessionNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Update progress to show error
      setSessionProgress(prev => ({
        ...prev,
        [sessionNumber]: {
          progress: 0,
          stage: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    } finally {
      // Remove session from generating set
      setGeneratingSessions(prev => {
        const newSet = new Set(prev)
        newSet.delete(sessionNumber)
        return newSet
      })
      
      // Note: Removed fallback refresh - SSE completion should work properly now
    }
  }

  const fetchFullSessionData = async (sessionId: string, sessionNumber: number) => {
    try {
      console.log('Fetching full session data from database...')
      const { data: sessionData, error } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) {
        console.error('Error fetching session data:', error)
        return
      }

      if (sessionData) {
        console.log('Full session data fetched:', sessionData)
        // Map the session data to the expected format
        const mappedSession = {
          ...sessionData.content,
          id: sessionData.id,
          session_number: sessionData.session_number,
          title: sessionData.title,
          description: sessionData.description,
          estimated_reading_time: sessionData.estimated_reading_time,
          recommended_readings: sessionData.resources?.recommended_readings || [],
          case_studies: sessionData.resources?.case_studies || [],
          video_resources: sessionData.resources?.video_resources || [],
          discussion_prompts: sessionData.discussion_prompts || [],
          ai_essay: sessionData.ai_essay,
          content_density: sessionData.content_density,
          session_type: sessionData.session_type,
          completed: sessionData.completed || false
        }

        console.log('Adding full session to list:', mappedSession)
        setSessions(prev => [...prev, mappedSession])
        setExpandedSessions(prev => new Set(prev).add(sessionNumber))
      }
    } catch (error) {
      console.error('Error in fetchFullSessionData:', error)
    }
  }

  const toggleSessionExpansion = (sessionNumber: number) => {
    console.log('=== TOGGLE SESSION EXPANSION ===', { sessionNumber, currentExpanded: Array.from(expandedSessions) })
    setExpandedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionNumber)) {
        newSet.delete(sessionNumber)
        console.log('Removing session from expanded:', sessionNumber)
      } else {
        newSet.add(sessionNumber)
        console.log('Adding session to expanded:', sessionNumber)
      }
      console.log('New expanded sessions:', Array.from(newSet))
      return newSet
    })
  }

  const handleSessionCompletionToggle = async (sessionId: string, sessionNumber: number) => {
    if (!user || !session?.access_token) return

    try {
      const existingSession = sessions.find(s => s.id === sessionId)
      if (!existingSession) return

      let updatedSession: LearningSession | null = null
      
      if (existingSession.completed) {
        // Mark as incomplete
        updatedSession = await markSessionIncomplete(sessionId)
      } else {
        // Mark as complete
        updatedSession = await markSessionComplete(sessionId)
      }

      if (updatedSession) {
        // Update the sessions state
        setSessions(prev => 
          prev.map(session => 
            session.id === sessionId ? updatedSession! : session
          )
        )
      }
    } catch (error) {
      console.error('Error toggling session completion:', error)
      setError(`Failed to update session ${sessionNumber} completion status`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Logo showText={true} size={48} />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning journey...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Curriculum Not Found</h2>
          <p className="text-gray-600 mb-6">The curriculum you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div onClick={handleBackToDashboard} className="cursor-pointer">
                <Logo showText={true} size={32} />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                Welcome, {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there'}
              </span>
              <motion.button
                onClick={handleSignOut}
                className="px-4 py-2 text-yellow-600 border border-yellow-600 rounded-lg hover:bg-yellow-600 hover:text-black transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign Out
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 py-6 sm:px-0"
        >
          {/* Curriculum Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{curriculum.subject}</h1>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{getProgressPercentage()}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>

            {/* Progress Bar with Session Circles */}
            <div className="relative mb-6">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              {/* Session Circles */}
              <div className="absolute top-1/2 left-0 right-0 flex justify-between transform -translate-y-1/2">
                {/* Session 0 - Starting point */}
                <div className="w-6 h-6 rounded-full border-2 bg-green-500 border-green-500 shadow-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                
                {/* Progress Circles - Show completion based on number completed, not specific sessions */}
                {Array.from({ length: curriculum.time_availability.totalWeeks * curriculum.time_availability.sessionsPerWeek }, (_, index) => {
                  const totalSessions = curriculum.time_availability.totalWeeks * curriculum.time_availability.sessionsPerWeek;
                  const completedCount = sessions.filter(s => s.completed).length;
                  const isCompleted = index < completedCount;
                  const isLastCircle = index === totalSessions - 1;
                  const isFullyCompleted = completedCount === totalSessions;
                  
                  return (
                    <div
                      key={index}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 shadow-lg'
                          : 'bg-white border-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Curriculum Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Skill Level</div>
                  <div className="font-semibold text-gray-900">{curriculum.skill_level}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Session Length</div>
                  <div className="font-semibold text-gray-900">
                    {curriculum.time_availability.sessionLength} minutes
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CalendarDays className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                  <div className="font-semibold text-gray-900">
                    {curriculum.time_availability.totalWeeks * curriculum.time_availability.sessionsPerWeek}
                  </div>
                </div>
              </div>
            </div>

            {curriculum.goals && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Learning Goals</h3>
                <p className="text-gray-700">{curriculum.goals}</p>
              </div>
            )}
          </div>

          {/* Two-Column Layout: Syllabus + Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Syllabus Overview */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Course Syllabus</h2>
              
              {curriculum.curriculum_data ? (
                <div className="space-y-4">
                  {/* Curriculum Overview */}
                  {curriculum.curriculum_data.curriculum_overview && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">{curriculum.curriculum_data.curriculum_overview.title}</h3>
                      <p className="text-gray-700 text-sm mb-3">{curriculum.curriculum_data.curriculum_overview.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {curriculum.curriculum_data.curriculum_overview.total_sessions} sessions
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {curriculum.curriculum_data.curriculum_overview.total_estimated_hours}h total
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {curriculum.curriculum_data.curriculum_overview.curriculum_type}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Session List */}
                  {curriculum.curriculum_data.session_list ? (
                    <div className="space-y-3">
                      {curriculum.curriculum_data.session_list.map((session: any, index: number) => (
                        <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-600">Session {session.session_number || index + 1}</span>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm">{session.title}</h3>
                          {session.description && (
                            <p className="text-gray-600 text-xs mt-1">{session.description}</p>
                          )}
                          {session.learning_objectives && session.learning_objectives.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Learning Objectives:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {session.learning_objectives.slice(0, 2).map((objective: string, objIndex: number) => (
                                  <li key={objIndex} className="flex items-start space-x-1">
                                    <span className="text-yellow-500 mt-0.5">•</span>
                                    <span>{objective}</span>
                                  </li>
                                ))}
                                {session.learning_objectives.length > 2 && (
                                  <li className="text-gray-500 italic">+{session.learning_objectives.length - 2} more...</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-gray-600">Session list will appear here once generated</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-gray-600">Syllabus overview will appear here once generated</p>
                </div>
              )}
            </div>

            {/* Right Column: Individual Sessions */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Learning Sessions</h2>
                <div className="text-sm text-gray-600">
                  {sessions.filter(s => s.completed).length} of {curriculum.time_availability.totalWeeks * curriculum.time_availability.sessionsPerWeek} completed
                </div>
              </div>

              <div className="space-y-4">
                {Array.from({ length: curriculum.time_availability.totalWeeks * curriculum.time_availability.sessionsPerWeek }, (_, index) => {
                  const sessionNumber = index + 1;
                  const existingSession = sessions.find(s => s.session_number === sessionNumber);
                  const isCompleted = existingSession?.completed || false;
                  const isGenerated = !!existingSession;
                  const isGenerating = generatingSessions.has(sessionNumber);
                  const isExpanded = expandedSessions.has(sessionNumber);
                  
                  // Get session title from syllabus data
                  const syllabusSession = curriculum.curriculum_data?.session_list?.find((s: any) => 
                    (s.session_number || 0) === sessionNumber || 
                    curriculum.curriculum_data.session_list.indexOf(s) === index
                  );
                  const sessionTitle = syllabusSession?.title || `Session ${sessionNumber} - ${curriculum.subject}`;
                  const sessionDescription = syllabusSession?.description;

                  return (
                    <motion.div
                      key={sessionNumber}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-green-50 border-green-200' 
                          : isGenerated
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Session Circle */}
                        <div className="flex-shrink-0">
                          <div 
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              isCompleted
                                ? 'bg-green-500 border-green-500 cursor-pointer hover:bg-green-600'
                                : isGenerated
                                ? 'bg-yellow-500 border-yellow-500 cursor-pointer hover:bg-yellow-600'
                                : 'bg-white border-gray-400 cursor-not-allowed'
                            }`}
                            onClick={() => isGenerated && existingSession && handleSessionCompletionToggle(existingSession.id, sessionNumber)}
                            title={isGenerated ? (isCompleted ? 'Click to mark as incomplete' : 'Click to mark as complete') : 'Generate session first'}
                          >
                            {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                            {!isCompleted && isGenerated && <Circle className="w-4 h-4 text-white" />}
                          </div>
                        </div>

                        {/* Session Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-600">Session {sessionNumber}</span>
                            {isCompleted && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Completed
                              </span>
                            )}
                            {!isCompleted && isGenerated && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Ready
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {sessionTitle}
                          </h3>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          {isGenerated ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleSessionExpansion(sessionNumber)}
                                className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                              >
                                {isExpanded ? 'Hide' : 'View'} Preview
                              </button>
                              <button
                                onClick={() => handleStartSession(existingSession!.id, sessionNumber)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                                  isCompleted
                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    : 'bg-yellow-500 text-black hover:bg-yellow-600'
                                }`}
                              >
                                <Play className="w-3 h-3" />
                                <span>{isCompleted ? 'Review' : 'Start'}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="w-full">
                              {isGenerating ? (
                                <div className="mb-4">
                                  <SessionGenerationProgress
                                    isGenerating={isGenerating}
                                    progress={sessionProgress[sessionNumber]?.progress || 0}
                                    stage={sessionProgress[sessionNumber]?.stage || 'validating'}
                                    message={sessionProgress[sessionNumber]?.message || 'Starting generation...'}
                                    error={sessionProgress[sessionNumber]?.error}
                                    onRetry={() => handleGenerateSession(sessionNumber)}
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleGenerateSession(sessionNumber)}
                                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center space-x-1"
                                >
                                  <Brain className="w-3 h-3" />
                                  <span>Generate</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Session Content */}
                      {isGenerated && isExpanded && existingSession && (
                        console.log('Rendering expanded content for session:', sessionNumber, 'Session data:', existingSession) || true
                      ) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <div className="space-y-4">
                            {/* Session Overview */}
                            {(existingSession.content?.overview || existingSession.overview) && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Overview</h4>
                                <p className="text-sm text-gray-700">{existingSession.content?.overview || existingSession.overview}</p>
                              </div>
                            )}

                            {/* Learning Objectives */}
                            {((existingSession.content?.learning_objectives && existingSession.content.learning_objectives.length > 0) || 
                              (existingSession.learning_objectives && existingSession.learning_objectives.length > 0)) && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Learning Objectives</h4>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  {(existingSession.content?.learning_objectives || existingSession.learning_objectives || []).map((objective: string, idx: number) => (
                                    <li key={idx} className="flex items-start space-x-2">
                                      <Target className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                                      <span>{objective}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* AI Essay Preview */}
                            {(existingSession.content?.ai_essay || existingSession.ai_essay) && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
                                  {(() => {
                                    const headers = ["Let's get started...", "Let's dive in...", "Consider this..."];
                                    const randomHeader = headers[Math.floor(Math.random() * headers.length)];
                                    return randomHeader;
                                  })()}
                                </h4>
                                <div className="text-sm p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-l-4 border-purple-400 max-h-40 overflow-y-auto shadow-sm">
                                  <MarkdownRenderer 
                                    content={(existingSession.content?.ai_essay || existingSession.ai_essay || '').substring(0, 500) + ((existingSession.content?.ai_essay || existingSession.ai_essay || '').length > 500 ? '...' : '')} 
                                    className="prose-sm"
                                  />
                                </div>
                                <div className="text-xs text-gray-500 mt-2 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Estimated reading time: {existingSession.estimated_reading_time || existingSession.content?.estimated_reading_time || 15} minutes
                                </div>
                              </div>
                            )}


                            {/* Discussion Prompts */}
                            {existingSession.content?.discussion_prompts && existingSession.content.discussion_prompts.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Discussion Prompts</h4>
                                <ul className="text-sm text-gray-700 space-y-2">
                                  {existingSession.content.discussion_prompts.map((prompt: string, idx: number) => (
                                    <li key={idx} className="p-2 bg-green-50 rounded">
                                      {prompt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
