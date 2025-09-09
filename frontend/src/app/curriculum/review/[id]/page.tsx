'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'
import CurriculumGenerationProgress from '@/components/CurriculumGenerationProgress'
import CurriculumReview from '@/components/CurriculumReview'
import Logo from '@/components/Logo'
import { Loader2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CurriculumReviewPage({ params }: { params: { id: string } }) {
  const [curriculum, setCurriculum] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStage, setGenerationStage] = useState<'analyzing' | 'calculating' | 'generating' | 'structuring' | 'finalizing'>('analyzing')
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadCurriculum()
  }, [user, params.id])

  const loadCurriculum = async () => {
    try {
      const { data, error } = await supabase
        .from('curricula')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user?.id)
        .single()

      if (error) {
        console.error('Error loading curriculum:', error)
        setError('Failed to load curriculum')
        return
      }

      if (!data) {
        setError('Curriculum not found')
        return
      }

      setCurriculum(data)

      // If curriculum is pending approval, show generation progress
      if (data.approval_status === 'pending') {
        setIsGenerating(true)
        simulateGenerationProgress()
      }
    } catch (err) {
      console.error('Error loading curriculum:', err)
      setError('Failed to load curriculum')
    } finally {
      setLoading(false)
    }
  }

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
        // Reload curriculum to get updated data
        setTimeout(() => {
          loadCurriculum()
        }, 1000)
      } else if (progress % 20 === 0 && currentStageIndex < stages.length - 1) {
        currentStageIndex++
        setGenerationStage(stages[currentStageIndex])
      }
    }, 100)
  }

  const handleApprove = async (customizations?: any) => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/curriculum/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          curriculumId: params.id,
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

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Error approving curriculum:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve curriculum')
      setIsGenerating(false)
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
        .eq('id', params.id)

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
              Curriculum Review
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
          />
        ) : (
          <CurriculumReview
            curriculum={curriculum}
            onApprove={handleApprove}
            onReject={handleReject}
            onCustomize={handleCustomize}
            isProcessing={isGenerating}
          />
        )}
      </main>
    </div>
  )
}
