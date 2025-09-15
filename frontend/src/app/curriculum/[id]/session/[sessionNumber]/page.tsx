'use client'

import { useState, useEffect, use } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LearningSession } from '@/lib/database'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  Target, 
  BookOpen, 
  Video, 
  MessageSquare, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface SessionViewProps {
  params: Promise<{
    id: string
    sessionNumber: string
  }>
}

export default function SessionView({ params }: SessionViewProps) {
  const resolvedParams = use(params)
  const { id: curriculumId, sessionNumber } = resolvedParams
  const router = useRouter()
  const [session, setSession] = useState<LearningSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInProgress, setIsInProgress] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'objectives', 'essay']))
  const [currentSection, setCurrentSection] = useState('overview')

  const sessionNum = parseInt(sessionNumber)

  useEffect(() => {
    fetchSession()
  }, [curriculumId, sessionNum])

  const fetchSession = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('curriculum_id', curriculumId)
        .eq('session_number', sessionNum)
        .single()

      if (sessionError) {
        throw new Error(`Failed to fetch session: ${sessionError.message}`)
      }

      if (!sessionData) {
        throw new Error('Session not found')
      }

      setSession(sessionData)
      setIsInProgress(sessionData.completed === false)
      setIsCompleted(sessionData.completed === true)
    } catch (err) {
      console.error('Error fetching session:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch session')
    } finally {
      setLoading(false)
    }
  }

  const markAsInProgress = async () => {
    if (!session) return

    try {
      const { error } = await supabase
        .from('learning_sessions')
        .update({ 
          completed: false,
          // Note: We don't set completed_at to null here as it might be useful to track when it was last started
        })
        .eq('id', session.id)

      if (error) {
        throw new Error(`Failed to mark session as in progress: ${error.message}`)
      }

      setIsInProgress(true)
      setIsCompleted(false)
    } catch (err) {
      console.error('Error marking session as in progress:', err)
      setError(err instanceof Error ? err.message : 'Failed to update session status')
    }
  }

  const markAsCompleted = async () => {
    if (!session) return

    try {
      const { error } = await supabase
        .from('learning_sessions')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id)

      if (error) {
        throw new Error(`Failed to mark session as completed: ${error.message}`)
      }

      setIsCompleted(true)
      setIsInProgress(false)
      
      // Redirect back to curriculum page after successful completion
      router.push(`/curriculum/${curriculumId}/learn`)
    } catch (err) {
      console.error('Error marking session as completed:', err)
      setError(err instanceof Error ? err.message : 'Failed to update session status')
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const scrollToSection = (section: string) => {
    setCurrentSection(section)
    const element = document.getElementById(section)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested session could not be found.'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const content = session.content || {}
  const estimatedTime = session.estimated_reading_time || content.estimated_reading_time || 45

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {estimatedTime} min
                  </span>
                  <span className="flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    Session {session.session_number}
                  </span>
                  {isCompleted && (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </span>
                  )}
                  {isInProgress && !isCompleted && (
                    <span className="flex items-center text-blue-600">
                      <Play className="w-4 h-4 mr-1" />
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {!isInProgress && !isCompleted && (
                <button
                  onClick={markAsInProgress}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </button>
              )}
              {isInProgress && !isCompleted && (
                <button
                  onClick={markAsCompleted}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 xl:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-3">Session Contents</h3>
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  { id: 'objectives', label: 'Learning Objectives', icon: Target },
                  { id: 'essay', label: 'AI Essay', icon: BookOpen },
                  { id: 'readings', label: 'Recommended Readings', icon: BookOpen },
                  { id: 'case-studies', label: 'Case Studies', icon: FileText },
                  { id: 'videos', label: 'Video Resources', icon: Video },
                  { id: 'discussion', label: 'Discussion Prompts', icon: MessageSquare },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center ${
                      currentSection === id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 xl:col-span-5">
            <div className="space-y-6">
              {/* Overview Section */}
              {content.overview && (
                <section id="overview" className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Overview
                    </h2>
                    <button
                      onClick={() => toggleSection('overview')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedSections.has('overview') ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {expandedSections.has('overview') && (
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">{content.overview}</p>
                    </div>
                  )}
                </section>
              )}

              {/* Learning Objectives Section */}
              {content.learning_objectives && content.learning_objectives.length > 0 && (
                <section id="objectives" className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-yellow-600" />
                      Learning Objectives
                    </h2>
                    <button
                      onClick={() => toggleSection('objectives')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedSections.has('objectives') ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {expandedSections.has('objectives') && (
                    <ul className="space-y-2">
                      {content.learning_objectives.map((objective: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-3">
                          <Target className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {/* AI Essay Section */}
              {content.ai_essay && (
                <section id="essay" className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                      {(() => {
                        const headers = ["Let's get started...", "Let's dive in...", "Consider this..."];
                        const randomHeader = headers[Math.floor(Math.random() * headers.length)];
                        return randomHeader;
                      })()}
                    </h2>
                    <button
                      onClick={() => toggleSection('essay')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedSections.has('essay') ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {expandedSections.has('essay') && (
                    <div className="prose max-w-none">
                      <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                        <MarkdownRenderer content={content.ai_essay} />
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Recommended Readings Section */}
              {content.recommended_readings && content.recommended_readings.length > 0 && (
                <section id="readings" className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                      Recommended Readings
                    </h2>
                    <button
                      onClick={() => toggleSection('readings')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedSections.has('readings') ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {expandedSections.has('readings') && (
                    <div className="space-y-4">
                      {content.recommended_readings.map((reading: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h3 className="font-semibold text-gray-900 mb-2">{reading.title}</h3>
                          {reading.description && (
                            <p className="text-gray-600 mb-3">{reading.description}</p>
                          )}
                          {reading.url && (
                            <a
                              href={reading.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Read More →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Case Studies Section */}
              {content.case_studies && content.case_studies.length > 0 && (
                <section id="case-studies" className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Case Studies
                    </h2>
                    <button
                      onClick={() => toggleSection('case-studies')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedSections.has('case-studies') ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {expandedSections.has('case-studies') && (
                    <div className="space-y-4">
                      {content.case_studies.map((caseStudy: any, idx: number) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                          <h3 className="font-semibold text-gray-900 mb-2">{caseStudy.title}</h3>
                          {caseStudy.description && (
                            <p className="text-gray-600 mb-3">{caseStudy.description}</p>
                          )}
                          {caseStudy.example && (
                            <div className="bg-white p-3 rounded border">
                              <h4 className="font-medium text-gray-900 mb-2">Example:</h4>
                              <p className="text-gray-700">{caseStudy.example}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Video Resources Section */}
              {content.video_resources && content.video_resources.length > 0 && (
                <section id="videos" className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Video className="w-5 h-5 mr-2 text-red-600" />
                      Video Resources
                    </h2>
                    <button
                      onClick={() => toggleSection('videos')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedSections.has('videos') ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {expandedSections.has('videos') && (
                    <div className="space-y-4">
                      {content.video_resources.map((video: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
                          {video.description && (
                            <p className="text-gray-600 mb-2">{video.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            {video.duration && (
                              <span className="text-sm text-gray-500">{video.duration}</span>
                            )}
                            {video.url && (
                              <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-red-600 hover:text-red-800 text-sm"
                              >
                                Watch Video →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Discussion Prompts Section */}
              {content.discussion_prompts && content.discussion_prompts.length > 0 && (
                <section id="discussion" className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
                      Discussion Prompts
                    </h2>
                    <button
                      onClick={() => toggleSection('discussion')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedSections.has('discussion') ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {expandedSections.has('discussion') && (
                    <div className="space-y-3">
                      {content.discussion_prompts.map((prompt: string, idx: number) => (
                        <div key={idx} className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                          <p className="text-gray-700">{prompt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
