'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import { Curriculum, LearningSession, getCurriculumSessions } from '@/lib/database'
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
  const { user, session, loading, signOut } = useAuth()
  const router = useRouter()
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0)

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

  const handleStartSession = (sessionId: string) => {
    // For now, we'll just show the session content
    // In the future, this could open a modal or navigate to a dedicated session view
    console.log('Starting session:', sessionId)
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
    if (sessions.length === 0) return 0
    const completedSessions = sessions.filter(session => session.completed).length
    return Math.round((completedSessions / sessions.length) * 100)
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
              <Logo showText={true} size={32} />
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
                <div className="text-2xl font-bold text-yellow-600">{getProgressPercentage()}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>

            {/* Progress Bar with Session Circles */}
            <div className="relative mb-6">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              {/* Session Circles */}
              <div className="absolute top-1/2 left-0 right-0 flex justify-between transform -translate-y-1/2">
                {Array.from({ length: curriculum.time_availability.totalWeeks * curriculum.time_availability.sessionsPerWeek }, (_, index) => {
                  const sessionNumber = index + 1;
                  const isCompleted = sessions.find(s => s.session_number === sessionNumber)?.completed || false;
                  return (
                    <div
                      key={sessionNumber}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-yellow-500 border-yellow-500'
                          : 'bg-white border-gray-400'
                      }`}
                    />
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
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isCompleted
                              ? 'bg-green-500 border-green-500'
                              : isGenerated
                              ? 'bg-yellow-500 border-yellow-500'
                              : 'bg-white border-gray-400'
                          }`}>
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
                            <button
                              onClick={() => handleStartSession(existingSession!.id)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                                isCompleted
                                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  : 'bg-yellow-500 text-black hover:bg-yellow-600'
                              }`}
                            >
                              <Play className="w-3 h-3" />
                              <span>{isCompleted ? 'Review' : 'Start'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => console.log(`Generate session ${sessionNumber}`)}
                              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              Generate
                            </button>
                          )}
                        </div>
                      </div>
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
