'use client'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import CurriculumGenerationProgress from '@/components/CurriculumGenerationProgress'
import CurriculumReview from '@/components/CurriculumReview'
import Logo from '@/components/Logo'
import { Loader2 } from 'lucide-react'

export default function CurriculumReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const [curriculum, setCurriculum] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStage, setGenerationStage] = useState<'analyzing' | 'calculating' | 'generating' | 'structuring' | 'finalizing'>('analyzing')
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const { user, session } = useAuth()
  const router = useRouter()
  const isLoadingRef = useRef(false)

  // Unwrap the params Promise
  const resolvedParams = use(params)

  const loadCurriculum = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('Already loading curriculum, skipping...')
      return
    }
    
    if (!user?.id) {
      console.log('No user ID available, skipping curriculum load')
      return
    }
    
    console.log('Loading curriculum with ID:', resolvedParams.id, 'for user:', user.id)
    isLoadingRef.current = true
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('curricula')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading curriculum:', error)
        setError('Failed to load curriculum')
        isLoadingRef.current = false
        setLoading(false)
        return
      }

      if (!data) {
        console.log('No curriculum data found')
        setError('Curriculum not found')
        isLoadingRef.current = false
        setLoading(false)
        return
      }

      console.log('Curriculum loaded successfully:', data.title)

      // Load generated sessions if they exist
      const { data: sessions, error: sessionsError } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('curriculum_id', resolvedParams.id)
        .order('session_number')

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError)
      } else if (sessions && sessions.length > 0) {
        console.log('Loaded sessions:', sessions.length)
        // Add sessions to curriculum data
        data.curriculum_data = {
          ...data.curriculum_data,
          session_list: sessions.map(session => ({
            ...session.content,
            id: session.id,
            session_number: session.session_number,
            title: session.title,
            description: session.description,
            estimated_reading_time: session.estimated_reading_time,
            recommended_readings: session.resources?.recommended_readings || [],
            case_studies: session.resources?.case_studies || [],
            video_resources: session.resources?.video_resources || [],
            discussion_prompts: session.discussion_prompts || [],
            ai_essay: session.ai_essay,
            content_density: session.content_density,
            session_type: session.session_type
          }))
        }
      }

      setCurriculum(data)
      setHasLoaded(true)

      // If curriculum is pending approval, show generation progress
      if (data.approval_status === 'pending') {
        setIsGenerating(true)
        simulateGenerationProgress()
      }
    } catch (err) {
      console.error('Error loading curriculum:', err)
      setError('Failed to load curriculum')
    } finally {
      isLoadingRef.current = false
      setLoading(false)
    }
  }, [resolvedParams.id, user?.id])

  useEffect(() => {
    console.log('CurriculumReviewPage useEffect - user:', !!user, 'user.id:', user?.id, 'resolvedParams.id:', resolvedParams.id, 'hasLoaded:', hasLoaded)
    if (!user) {
      console.log('No user, redirecting to login')
      router.push('/login')
      return
    }
    if (!resolvedParams.id) {
      console.log('No curriculum ID, skipping load')
      return
    }
    if (hasLoaded) {
      console.log('Curriculum already loaded, skipping')
      return
    }
    loadCurriculum()
  }, [user?.id, resolvedParams.id]) // Remove hasLoaded from dependencies to prevent loop

  const simulateGenerationProgress = () => {
    const stages: typeof generationStage[] = ['analyzing', 'calculating', 'generating', 'structuring', 'finalizing']
    let currentStageIndex = 0
    let progress = 0

    const interval = setInterval(() => {
      progress += 2
      setGenerationProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
        setIsGenerating(false)
        setGenerationStage('finalizing')
        // Don't reload curriculum - it's already loaded
      } else if (progress % 20 === 0 && currentStageIndex < stages.length - 1) {
        currentStageIndex++
        setGenerationStage(stages[currentStageIndex])
      }
    }, 100)
  }

  const handleApprove = async (customizations?: any) => {
    try {
      setError(null)

      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/curriculum/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          curriculumId: resolvedParams.id,
          customizations,
          userId: user?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve curriculum')
      }

      const result = await response.json()
      console.log('Curriculum approved:', result)

      // Redirect to dashboard after successful approval
      router.push('/dashboard')
    } catch (err) {
      console.error('Error approving curriculum:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve curriculum')
    }
  }

  const handleReject = async (reason: string) => {
    try {
      // Update curriculum status to rejected
      const { error } = await supabase
        .from('curricula')
        .update({
          approval_status: 'rejected',
          customization_notes: reason,
          status: 'rejected'
        })
        .eq('id', resolvedParams.id)

      if (error) {
        throw new Error('Failed to reject curriculum')
      }

      // Redirect back to onboarding
      router.push('/onboarding')
    } catch (err) {
      console.error('Error rejecting curriculum:', err)
      setError(err instanceof Error ? err.message : 'Failed to reject curriculum')
    }
  }

  const handleCustomize = (changes: any) => {
    // Handle customizations (could be implemented later)
    console.log('Customizations:', changes)
  }

  const handleRetry = () => {
    setError(null)
    loadCurriculum()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Logo showText={true} size={48} />
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading curriculum...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Curriculum Not Found</h3>
          <p className="text-gray-600">The requested curriculum could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div onClick={() => router.push('/')} className="cursor-pointer">
              <Logo showText={true} size={32} />
            </div>
            <div className="text-sm text-gray-600">
              Syllabus Review
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {isGenerating ? (
          <CurriculumGenerationProgress
            isGenerating={isGenerating}
            progress={generationProgress}
            stage={generationStage}
            curriculumType={curriculum.curriculum_type}
            sessionCount={curriculum.session_count}
            error={error}
            onRetry={handleRetry}
            isFromPrompt={true}
          />
        ) : (
          <CurriculumReview
            curriculum={curriculum}
            onApprove={handleApprove}
            onReject={handleReject}
            onCustomize={handleCustomize}
            isProcessing={false}
          />
        )}
      </main>
    </div>
  )
}
