'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/Logo'
import { createCurriculum, getUserCurricula, Curriculum, updateCurriculum } from '@/lib/database'
import { ChevronLeft, ChevronRight, Clock, BookOpen, Target, CheckCircle, Mic, MicOff, Send, Loader2, User, Edit3 } from 'lucide-react'

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: ((event: any) => void) | null
}

interface OnboardingData {
  personalBackground: {
    background: string
    interests: string
    experiences: string
    goals: string
  }
  timeAvailability: {
    totalWeeks: number
    sessionsPerWeek: number
    sessionLength: number
  }
  subject: {
    topic: string
    skillLevel: string
    goals: string
    interests: string[]
  }
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    personalBackground: {
      background: '',
      interests: '',
      experiences: '',
      goals: ''
    },
    timeAvailability: {
      totalWeeks: 4,
      sessionsPerWeek: 5,
      sessionLength: 60
    },
    subject: {
      topic: '',
      skillLevel: 'beginner',
      goals: '',
      interests: []
    }
  })
  
  const { user, session } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null)
  const [loadingCurriculum, setLoadingCurriculum] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  // Voice input state
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentField, setCurrentField] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const finalTranscriptRef = useRef<string>('')
  const currentFieldRef = useRef<string | null>(null)
  const existingContentRef = useRef<string>('')
  const updateGoalsRef = useRef<((goals: string) => void) | null>(null)
  
  // Curriculum generation state
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Prompt generation state
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [originalPrompt, setOriginalPrompt] = useState<string>('')
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [showPromptStep, setShowPromptStep] = useState(false)
  const [hasPromptBeenEdited, setHasPromptBeenEdited] = useState(false)
  
  // Test data state
  const [useTestData, setUseTestData] = useState(false)
  
  // Test data for quick testing
  const testData: OnboardingData = {
    personalBackground: {
      background: 'I am a 64 year old MBA with 20 years of experience building and managing a health and wellness spa. I recently became Chairman of the Board of local museums in the San Francisco Bay Area.',
      interests: 'I love travel, politics, history, and laughting at my own really bad puns.',
      experiences: 'I like building teams and bringing people together. I have no interest in learning to code, but I would like to be able to apply AI strategically in my non-profit work. I have used chatGPT but that is as far as I have gotten.',
      goals: ''
    },
    timeAvailability: {
      totalWeeks: 4,
      sessionsPerWeek: 2,
      sessionLength: 45
    },
    subject: {
      topic: 'AI/Machine Learning',
      skillLevel: 'beginner',
      goals: '',
      interests: ['technology', 'non-profit', 'museums', 'travel', 'politics', 'history', 'puns']
    }
  }

  const steps = [
    { id: 1, title: 'Choose Subject', icon: BookOpen },
    { id: 2, title: 'Tell Us About You', icon: User },
    { id: 3, title: 'Time Availability', icon: Clock },
    { id: 4, title: 'Skill Level & Goals', icon: Target },
    { id: 5, title: 'Review & Confirm', icon: CheckCircle },
    { id: 6, title: 'Customize Prompt', icon: Edit3 }
  ]

  // Check for edit mode and load curriculum data
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId && user && !isRedirecting) {
      setIsEditMode(true)
      loadCurriculumForEdit(editId)
    }
  }, [searchParams, user, isRedirecting])

  // Load curriculum data for editing
  const loadCurriculumForEdit = async (curriculumId: string) => {
    if (!user) return
    
    setLoadingCurriculum(true)
    try {
      const curricula = await getUserCurricula(user.id, user.email, user.user_metadata?.first_name)
      const curriculum = curricula.find(c => c.id === curriculumId)
      
      if (curriculum) {
        setEditingCurriculum(curriculum)
        // Pre-fill the form with existing data
        setData({
          personalBackground: curriculum.personal_background,
          timeAvailability: curriculum.time_availability,
          subject: {
            topic: curriculum.subject,
            skillLevel: curriculum.skill_level,
            goals: curriculum.goals || '',
            interests: [] // This would need to be stored separately or extracted from goals
          }
        })
        
        // Load the custom prompt if it exists
        if ((curriculum as any).generation_prompt) {
          const prompt = (curriculum as any).generation_prompt
          setCustomPrompt(prompt)
          setOriginalPrompt(prompt) // Store the original prompt
          setHasPromptBeenEdited(false) // Reset edit tracking
        }
        
        // Always go to step 6 (prompt review) when revising syllabus
        setShowPromptStep(true)
        setCurrentStep(6)
      } else {
        console.error('Curriculum not found')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error loading curriculum:', error)
      router.push('/dashboard')
    } finally {
      setLoadingCurriculum(false)
    }
  }

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event) => {
          console.log('Speech recognition result:', event)
          let interimTranscript = ''
          let newFinalTranscript = ''
          
          // Process results starting from the resultIndex (for continuous mode)
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            console.log('Transcript:', transcript, 'isFinal:', event.results[i].isFinal)
            if (event.results[i].isFinal) {
              newFinalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          // Update the field with existing content + accumulated final + new final + interim
          const activeField = currentFieldRef.current
          console.log('Current field:', activeField, 'Available fields:', Object.keys(data.personalBackground))
          if (activeField && activeField in data.personalBackground && activeField !== 'goals') {
            // Use the captured existing content + accumulated final + new final + interim
            const existingContent = existingContentRef.current
            const accumulatedFinal = finalTranscriptRef.current
            const fullTranscript = existingContent + 
              (existingContent && (accumulatedFinal || newFinalTranscript) ? ' ' : '') + 
              accumulatedFinal + 
              (accumulatedFinal && newFinalTranscript ? ' ' : '') + 
              newFinalTranscript + 
              interimTranscript
            console.log('Updating field with:', fullTranscript)
            updateData('personalBackground', { [activeField]: fullTranscript })
            
            // Update the accumulated final transcript
            if (newFinalTranscript) {
              finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + newFinalTranscript
            }
          } else if (activeField === 'goals') {
            // Handle goals field - could be in personalBackground (step 2) or subject (step 4)
            const existingContent = existingContentRef.current
            const accumulatedFinal = finalTranscriptRef.current
            const fullTranscript = existingContent + 
              (existingContent && (accumulatedFinal || newFinalTranscript) ? ' ' : '') + 
              accumulatedFinal + 
              (accumulatedFinal && newFinalTranscript ? ' ' : '') + 
              newFinalTranscript + 
              interimTranscript
            console.log('Updating goals field with:', fullTranscript)
            console.log('updateGoalsRef.current exists:', !!updateGoalsRef.current)
            // Use the updateGoalsRef function to update the goals field (for step 4)
            if (updateGoalsRef.current) {
              console.log('Calling updateGoalsRef.current with:', fullTranscript)
              updateGoalsRef.current(fullTranscript)
            } else {
              // For step 2, update personalBackground.goals
              console.log('updateGoalsRef.current is null, updating personalBackground.goals')
              setData(prev => ({
                ...prev,
                personalBackground: { ...prev.personalBackground, goals: fullTranscript }
              }))
            }
            
            // Update the accumulated final transcript
            if (newFinalTranscript) {
              finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + newFinalTranscript
            }
          } else {
            console.log('Field not found or not in personalBackground')
          }
        }

        recognitionRef.current.onerror = (event) => {
          console.log('Speech recognition error:', event.error)
          setIsListening(false)
          setIsProcessing(false)
        }

        recognitionRef.current.onend = () => {
          // Ensure final transcript is saved when recognition ends (timeout or manual stop)
          const activeField = currentFieldRef.current
          if (activeField && activeField in data.personalBackground && activeField !== 'goals') {
            const existingContent = existingContentRef.current
            const accumulatedFinal = finalTranscriptRef.current
            
            // Only update if we have new content
            if (accumulatedFinal) {
              const fullTranscript = existingContent + (existingContent ? ' ' : '') + accumulatedFinal
              console.log('Final update on end:', fullTranscript)
              updateData('personalBackground', { [activeField]: fullTranscript })
            }
          } else if (activeField === 'goals') {
            const existingContent = existingContentRef.current
            const accumulatedFinal = finalTranscriptRef.current
            
            // Only update if we have new content
            if (accumulatedFinal) {
              const fullTranscript = existingContent + (existingContent ? ' ' : '') + accumulatedFinal
              console.log('Final update on end for goals:', fullTranscript)
              console.log('updateGoalsRef.current exists (onend):', !!updateGoalsRef.current)
              if (updateGoalsRef.current) {
                console.log('Calling updateGoalsRef.current (onend) with:', fullTranscript)
                updateGoalsRef.current(fullTranscript)
              } else {
                // For step 2, update personalBackground.goals
                console.log('updateGoalsRef.current is null (onend), updating personalBackground.goals')
                setData(prev => ({
                  ...prev,
                  personalBackground: { ...prev.personalBackground, goals: fullTranscript }
                }))
              }
            }
          }
          setIsListening(false)
          setIsProcessing(false)
          // Clear the timeout when recognition ends
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }
      }
    }
  }, [])

  // Set the updateGoalsRef when on step 4
  useEffect(() => {
    if (currentStep === 4) {
      updateGoalsRef.current = (goals: string) => updateData('subject', { goals })
    }
  }, [currentStep])

  const startVoiceInput = (field: string) => {
    console.log('Starting voice input for field:', field)
    if (recognitionRef.current && !isListening) {
      setCurrentField(field)
      currentFieldRef.current = field // Store in ref as well
      setIsListening(true)
      setIsProcessing(true)
      
      // Capture existing content for this field
      if (field === 'goals') {
        // For goals field, check if we're in step 2 (personalBackground) or step 4 (subject)
        if (currentStep === 2) {
          existingContentRef.current = data.personalBackground.goals || ''
        } else {
          existingContentRef.current = data.subject.goals || ''
        }
      } else {
        existingContentRef.current = (data.personalBackground as any)[field] || ''
      }
      finalTranscriptRef.current = '' // Reset for new session
      
      console.log('Starting speech recognition with existing content:', existingContentRef.current)
      recognitionRef.current.start()
      
      // Set a longer timeout (120 seconds) to allow for longer pauses
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          console.log('Timeout reached, stopping recognition')
          recognitionRef.current.stop()
        }
      }, 120000) // 120 seconds (2 minutes)
    } else {
      console.log('Cannot start voice input:', { hasRecognition: !!recognitionRef.current, isListening })
    }
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setIsProcessing(false)
    }
    // Clear the timeout when manually stopping
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateSmartPrompt = async () => {
    if (!user || !session) {
      console.error('User or session not available')
      return
    }

    try {
      setIsGeneratingPrompt(true)
      
      const userProfile = {
        name: user.user_metadata?.first_name || 'User',
        background: data.personalBackground.background,
        currentRole: 'Professional',
        skillLevel: data.subject.skillLevel,
        subject: data.subject.topic,
        goals: data.subject.goals,
        timeAvailability: data.timeAvailability,
        personalBackground: data.personalBackground
      }

      const response = await fetch('/api/curriculum/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userProfile,
          userId: user.id
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate prompt')
      }

      const result = await response.json()
      setCustomPrompt(result.prompt)
      setShowPromptStep(true)
      setCurrentStep(6)
      
      // If in edit mode, we're done - user can now edit the prompt
      if (isEditMode) {
        return
      }
    } catch (error) {
      console.error('Error generating prompt:', error)
      alert(`Error generating prompt: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const handleComplete = async () => {
    console.log('handleComplete called', { user: !!user, session: !!session, userEmail: user?.email })
    if (!user || !session) {
      console.log('Missing user or session:', { user: !!user, session: !!session })
      return
    }
    
    try {
      if (isEditMode && editingCurriculum) {
        // Check if the prompt has been edited
        if (!hasPromptBeenEdited) {
          // No edits made, just redirect back to the original curriculum
          console.log('No prompt edits detected, redirecting to original curriculum')
          router.push(`/curriculum/review/${editingCurriculum.id}`)
          return
        }

        // Prompt has been edited, generate a new curriculum
        console.log('Prompt has been edited, generating new curriculum')
        setIsGenerating(true)
        const userProfile = {
          name: user.user_metadata?.first_name || 'User',
          background: data.personalBackground.background,
          currentRole: 'Professional',
          skillLevel: data.subject.skillLevel,
          subject: data.subject.topic,
          goals: data.subject.goals,
          timeAvailability: data.timeAvailability,
          personalBackground: data.personalBackground
        }

        // Call AI generation API to create new curriculum
        console.log('Making API call with token:', session.access_token ? 'present' : 'missing')
        const response = await fetch('/api/curriculum/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userProfile,
            userId: user.id,
            customPrompt: customPrompt || undefined
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate curriculum')
        }

        const result = await response.json()
        console.log('AI curriculum generated:', result)
        
        // Reset loading state
        setIsGenerating(false)
        
        // Redirect to curriculum review page
        router.push(`/curriculum/review/${result.curriculum.id}`)
      } else {
        // Generate AI curriculum
        setIsGenerating(true)
        const userProfile = {
          name: user.user_metadata?.first_name || 'User',
          background: data.personalBackground.background,
          currentRole: 'Professional',
          skillLevel: data.subject.skillLevel,
          subject: data.subject.topic,
          goals: data.subject.goals,
          timeAvailability: data.timeAvailability,
          personalBackground: data.personalBackground
        }

        // Call AI generation API
        console.log('Making API call with token:', session.access_token ? 'present' : 'missing')
        const response = await fetch('/api/curriculum/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userProfile,
            userId: user.id,
            customPrompt: customPrompt || undefined
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate curriculum')
        }

        const result = await response.json()
        console.log('AI curriculum generated:', result)
        
        // Reset loading state
        setIsGenerating(false)
        
        // Redirect to curriculum review page
        router.push(`/curriculum/review/${result.curriculum.id}`)
      }
    } catch (error) {
      console.error('Error generating curriculum:', error)
      setIsGenerating(false)
      // TODO: Show error message to user
    }
  }

  const updateData = (section: keyof OnboardingData, updates: any) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }

  const handlePromptChange = (newPrompt: string) => {
    setCustomPrompt(newPrompt)
    // Check if the prompt has been edited from the original
    if (isEditMode && originalPrompt) {
      setHasPromptBeenEdited(newPrompt !== originalPrompt)
    }
  }

  const handleReturnToOriginal = () => {
    if (isEditMode && editingCurriculum) {
      // Set redirecting flag to prevent loading curriculum again
      setIsRedirecting(true)
      // Direct redirect without any loading state
      router.push(`/curriculum/review/${editingCurriculum.id}`)
    }
  }

  const toggleTestData = () => {
    if (useTestData) {
      // Clear test data
      setData({
        personalBackground: {
          background: '',
          interests: '',
          experiences: '',
          goals: ''
        },
        timeAvailability: {
          totalWeeks: 4,
          sessionsPerWeek: 5,
          sessionLength: 60
        },
        subject: {
          topic: '',
          skillLevel: 'beginner',
          goals: '',
          interests: []
        }
      })
    } else {
      // Load test data
      setData(testData)
    }
    setUseTestData(!useTestData)
  }

  // Show loading state when loading curriculum for editing
  if (loadingCurriculum) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Logo showText={true} size={48} />
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading curriculum data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ChatGPT-style Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div onClick={() => router.push('/')} className="cursor-pointer">
              <Logo showText={true} size={32} />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {isEditMode ? 'Edit Curriculum' : `Step ${currentStep} of 6`}
              </div>
              {/* Test Data Toggle - Only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={toggleTestData}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    useTestData 
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300' 
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {useTestData ? 'Test Data ON' : 'Load Test Data'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Progress Bar */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-3">
            <div className="flex items-center space-x-2">
              {/* Backward arrow */}
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous step"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Step indicators */}
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    disabled={step.id > currentStep + 1}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                      currentStep >= step.id 
                        ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
                        : step.id === currentStep + 1
                        ? 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    title={`Go to step ${step.id}: ${step.title}`}
                  >
                    <step.icon className="w-4 h-4" />
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-yellow-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
              
              {/* Forward arrow or Complete button */}
              {currentStep < 6 ? (
                <button
                  onClick={nextStep}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  title="Next step"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                  title={isEditMode ? "Update My Curriculum" : "Generate My Curriculum"}
                >
                  {isEditMode ? 'Update' : 'Complete'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - ChatGPT Style */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[600px]"
          >
            {currentStep === 1 && (
              <SubjectSelectionStep 
                data={data.subject}
                updateData={(updates) => updateData('subject', updates)}
                onNext={nextStep}
              />
            )}
            
            {currentStep === 2 && (
              <PersonalBackgroundStep 
                data={data.personalBackground}
                updateData={(updates) => updateData('personalBackground', updates)}
                isListening={isListening}
                isProcessing={isProcessing}
                currentField={currentField}
                onStartVoiceInput={startVoiceInput}
                onStopVoiceInput={stopVoiceInput}
                onNext={() => setCurrentStep(3)}
              />
            )}
            
            {currentStep === 3 && (
              <TimeAvailabilityStep 
                data={data.timeAvailability}
                updateData={(updates) => updateData('timeAvailability', updates)}
                onNext={nextStep}
              />
            )}
            
            {currentStep === 4 && (
              <SkillLevelStep 
                data={data.subject}
                updateData={(updates) => updateData('subject', updates)}
                isListening={isListening}
                isProcessing={isProcessing}
                currentField={currentField}
                onStartVoiceInput={startVoiceInput}
                onStopVoiceInput={stopVoiceInput}
                onUpdateGoals={(goals) => updateData('subject', { goals })}
                onNext={() => setCurrentStep(5)}
              />
            )}
            
            {currentStep === 5 && (
              <ReviewStep 
                data={data}
                onComplete={handleComplete}
                onEditStep={setCurrentStep}
                onGeneratePrompt={generateSmartPrompt}
                isEditMode={isEditMode}
                isGenerating={isGenerating}
                isGeneratingPrompt={isGeneratingPrompt}
              />
            )}
            
            {currentStep === 6 && (
              <PromptReviewStep 
                prompt={customPrompt}
                onPromptChange={handlePromptChange}
                onComplete={handleComplete}
                onReturnToOriginal={handleReturnToOriginal}
                onBack={() => setCurrentStep(5)}
                isGenerating={isGenerating}
                isEditMode={isEditMode}
                hasPromptBeenEdited={hasPromptBeenEdited}
                originalPrompt={originalPrompt}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  )
}

// Step Components
function PersonalBackgroundStep({ 
  data, 
  updateData, 
  isListening, 
  isProcessing, 
  currentField, 
  onStartVoiceInput, 
  onStopVoiceInput,
  onNext
}: { 
  data: any
  updateData: (updates: any) => void
  isListening: boolean
  isProcessing: boolean
  currentField: string | null
  onStartVoiceInput: (field: string) => void
  onStopVoiceInput: () => void
  onNext: () => void
}) {
  const fields = [
    {
      id: 'background',
      label: 'Personal Background - Who are you?',
      placeholder: 'Share your professional background, education, hobbies, and any relevant experiences... The more information you provide, the better! The ai will train on whatever details you give.'
    },
    {
      id: 'interests',
      label: 'Interests and Passions',
      placeholder: 'What topics, activities, or subjects genuinely excite you? What do you love learning about?'
    },
    {
      id: 'experiences',
      label: 'Relevant Experience in this Subject',
      placeholder: 'Previous experience with subjects you want to learn? Projects, courses, or skills you\'ve developed?'
    },
    {
      id: 'goals',
      label: 'Preferred Way You Like to Learn',
      placeholder: 'How do you want your learning sessions to be structured? Default is:\n    • Session Summary\n    • Written Essay\n    • Case studies/examples\n    • Optional video resources\n    • References for further study\n    • Discussion questions'
    }
  ]

  const handleVoiceInput = (fieldId: string) => {
    if (isListening && currentField === fieldId) {
      onStopVoiceInput()
    } else {
      onStartVoiceInput(fieldId)
    }
  }

  // No special key handling needed - let Enter work normally in textareas

  const canProceed = fields.some(field => data[field.id] && data[field.id].trim())

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Terrific! New let's get to know you</h2>
      <p className="text-gray-600 mb-8">Tell us about yourself to create your personalized learning journey</p>
      
      <div className="space-y-6">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <div className="relative">
              <textarea
                value={data[field.id] || ''}
                onChange={(e) => updateData({ [field.id]: e.target.value })}
                placeholder={field.placeholder}
                rows={4}
                className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
              />
              <div className="absolute right-2 bottom-2 flex space-x-1">
                <button
                  onClick={() => handleVoiceInput(field.id)}
                  className={`p-2 rounded-full transition-colors ${
                    isListening && currentField === field.id
                      ? 'bg-red-500 text-white animate-pulse hover:bg-red-600' 
                      : isProcessing && currentField === field.id
                      ? 'bg-gray-300 text-gray-500 hover:bg-gray-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isListening && currentField === field.id ? 'Stop recording' : isProcessing && currentField === field.id ? 'Stop processing' : 'Start voice input'}
                >
                  {isProcessing && currentField === field.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isListening && currentField === field.id ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {isListening && currentField === field.id && (
              <p className="text-sm text-red-500 mt-2 flex items-center">
                <Mic className="w-4 h-4 mr-1 animate-pulse" />
                Listening... Speak now
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
        >
          <span>Continue</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function TimeAvailabilityStep({ data, updateData, onNext }: { data: any, updateData: (updates: any) => void, onNext: () => void }) {
  const handleNumberChange = (field: string, value: string) => {
    // Handle empty string or invalid input
    if (value === '' || isNaN(parseInt(value))) {
      updateData({ [field]: '' })
    } else {
      const numValue = parseInt(value)
      if (numValue > 0) {
        updateData({ [field]: numValue })
      }
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell Us About Your Time</h2>
      <p className="text-gray-600 mb-8">How much time do you have available for learning?</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total weeks available
          </label>
          <input
            type="number"
            value={data.totalWeeks || ''}
            onChange={(e) => handleNumberChange('totalWeeks', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            min="1"
            max="52"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && data.totalWeeks && data.sessionsPerWeek && data.sessionLength) {
                e.preventDefault()
                onNext()
              }
            }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sessions per week
          </label>
          <input
            type="number"
            value={data.sessionsPerWeek || ''}
            onChange={(e) => handleNumberChange('sessionsPerWeek', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            min="1"
            max="7"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && data.totalWeeks && data.sessionsPerWeek && data.sessionLength) {
                e.preventDefault()
                onNext()
              }
            }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session length (minutes)
          </label>
          <input
            type="number"
            value={data.sessionLength || ''}
            onChange={(e) => handleNumberChange('sessionLength', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            min="15"
            max="240"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && data.totalWeeks && data.sessionsPerWeek && data.sessionLength) {
                e.preventDefault()
                onNext()
              }
            }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={onNext}
          disabled={!data.totalWeeks || !data.sessionsPerWeek || !data.sessionLength}
          className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
        >
          <span>Continue</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function SubjectSelectionStep({ data, updateData, onNext }: { data: any, updateData: (updates: any) => void, onNext: () => void }) {
  const popularSubjects = [
    'Python Programming', 'Spanish', 'Creative Writing', 'AI/Machine Learning',
    'Web Development', 'Data Science', 'Digital Marketing', 'Photography',
    'Music Theory', 'Cooking', 'Fitness', 'Meditation'
  ]

  const handleDoubleClick = (subject: string) => {
    updateData({ topic: subject })
    // Brief delay before advancing to next step
    setTimeout(() => {
      onNext()
    }, 300)
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Subject</h2>
      <p className="text-gray-600 mb-8">What would you like to learn?</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject or Topic
          </label>
          <input
            type="text"
            value={data.topic}
            onChange={(e) => updateData({ topic: e.target.value })}
            placeholder="e.g., Python Programming, Spanish, Creative Writing..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && data.topic.trim()) {
                e.preventDefault()
                onNext()
              }
            }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Popular Subjects
          </label>
          <p className="text-sm text-gray-500 mb-4">Click to select, or double-click to select and continue</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {popularSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => updateData({ topic: subject })}
                onDoubleClick={() => handleDoubleClick(subject)}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  data.topic === subject
                    ? 'bg-yellow-500 text-black border-yellow-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-500'
                }`}
                title="Click to select, double-click to select and continue"
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkillLevelStep({ 
  data, 
  updateData, 
  isListening, 
  isProcessing, 
  currentField, 
  onStartVoiceInput, 
  onStopVoiceInput,
  onUpdateGoals,
  onNext 
}: { 
  data: any
  updateData: (updates: any) => void
  isListening: boolean
  isProcessing: boolean
  currentField: string | null
  onStartVoiceInput: (field: string) => void
  onStopVoiceInput: () => void
  onUpdateGoals: (goals: string) => void
  onNext: () => void
}) {
  const skillLevels = [
    { value: 'beginner', label: 'Beginner', description: 'Little to no experience' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience, want to improve' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced, want to master' }
  ]

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Skill Level & Goals</h2>
      <p className="text-gray-600 mb-8">Help us customize your learning experience</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Current Skill Level
          </label>
          <div className="space-y-3">
            {skillLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => updateData({ skillLevel: level.value })}
                className={`w-full p-4 text-left rounded-lg border transition-colors ${
                  data.skillLevel === level.value
                    ? 'bg-yellow-500 text-black border-yellow-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-500'
                }`}
              >
                <div className="font-medium">{level.label}</div>
                <div className="text-sm opacity-75">{level.description}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Goals
          </label>
          <div className="relative">
            <textarea
              value={data.goals}
              onChange={(e) => updateData({ goals: e.target.value })}
              placeholder="What do you want to achieve? (e.g., Build a web app, Have conversations in Spanish, Write a novel...)"
              rows={4}
              className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
            />
            <div className="absolute right-2 bottom-2 flex space-x-1">
              <button
                onClick={() => {
                  if (isListening && currentField === 'goals') {
                    onStopVoiceInput()
                  } else {
                    onStartVoiceInput('goals')
                  }
                }}
                className={`p-2 rounded-full transition-colors ${
                  isListening && currentField === 'goals'
                    ? 'bg-red-500 text-white animate-pulse hover:bg-red-600' 
                    : isProcessing && currentField === 'goals'
                    ? 'bg-gray-300 text-gray-500 hover:bg-gray-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isListening && currentField === 'goals' ? 'Stop recording' : isProcessing && currentField === 'goals' ? 'Stop processing' : 'Start voice input'}
              >
                {isProcessing && currentField === 'goals' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isListening && currentField === 'goals' ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          {isListening && currentField === 'goals' && (
            <p className="text-sm text-red-500 mt-2 flex items-center">
              <Mic className="w-4 h-4 mr-1 animate-pulse" />
              Listening... Speak now
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={onNext}
          disabled={!data.skillLevel}
          className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
        >
          <span>Review & Continue</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ReviewStep({ data, onComplete, onEditStep, onGeneratePrompt, isEditMode, isGenerating, isGeneratingPrompt }: { data: OnboardingData, onComplete: () => void, onEditStep: (step: number) => void, onGeneratePrompt: () => void, isEditMode: boolean, isGenerating: boolean, isGeneratingPrompt: boolean }) {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{[key: string]: string}>({})

  const handleEdit = (section: string, field: string, currentValue: string) => {
    setEditingSection(`${section}-${field}`)
    setEditValues({ ...editValues, [`${section}-${field}`]: currentValue })
  }

  const handleSaveEdit = (section: string, field: string) => {
    const key = `${section}-${field}`
    const newValue = editValues[key]
    if (newValue !== undefined) {
      // Update the data - this would need to be passed down from parent
      console.log(`Saving ${section}.${field}:`, newValue)
      setEditingSection(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
    setEditValues({})
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Responses</h2>
      <p className="text-gray-600 mb-8">Please review your answers below. You can edit any section before proceeding.</p>
      
      <div className="space-y-6">
        {/* About You Section */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">About You</h3>
            <button
              onClick={() => onEditStep(2)}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Edit Section
            </button>
          </div>
          <div className="space-y-4">
            {data.personalBackground.background && (
              <div>
                <span className="text-gray-600 font-medium text-sm">Background:</span>
                <div className="mt-1 text-gray-800 bg-gray-50 p-3 rounded border">
                  {data.personalBackground.background}
                </div>
              </div>
            )}
            {data.personalBackground.interests && (
              <div>
                <span className="text-gray-600 font-medium text-sm">Interests:</span>
                <div className="mt-1 text-gray-800 bg-gray-50 p-3 rounded border">
                  {data.personalBackground.interests}
                </div>
              </div>
            )}
            {data.personalBackground.experiences && (
              <div>
                <span className="text-gray-600 font-medium text-sm">Relevant Experience:</span>
                <div className="mt-1 text-gray-800 bg-gray-50 p-3 rounded border">
                  {data.personalBackground.experiences}
                </div>
              </div>
            )}
            {data.personalBackground.goals && (
              <div>
                <span className="text-gray-600 font-medium text-sm">Goals & Aspirations:</span>
                <div className="mt-1 text-gray-800 bg-gray-50 p-3 rounded border">
                  {data.personalBackground.goals}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Time Availability Section */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Time Availability</h3>
            <button
              onClick={() => onEditStep(3)}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Edit Section
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-gray-600">Total Weeks:</span>
              <div className="font-medium">{data.timeAvailability.totalWeeks} weeks</div>
            </div>
            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-gray-600">Sessions/Week:</span>
              <div className="font-medium">{data.timeAvailability.sessionsPerWeek}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-gray-600">Session Length:</span>
              <div className="font-medium">{data.timeAvailability.sessionLength} minutes</div>
            </div>
          </div>
        </div>
        
        {/* Learning Subject Section */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Learning Subject</h3>
            <button
              onClick={() => onEditStep(4)}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Edit Section
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-gray-600">Topic:</span>
              <div className="font-medium">{data.subject.topic}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-gray-600">Skill Level:</span>
              <div className="font-medium capitalize">{data.subject.skillLevel}</div>
            </div>
            {data.subject.goals && (
              <div className="bg-gray-50 p-3 rounded border">
                <span className="text-gray-600">Learning Goals:</span>
                <div className="font-medium">{data.subject.goals}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={() => onEditStep(4)}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          ← Back to Previous Step
        </button>
        {isEditMode ? (
          <button
            onClick={onGeneratePrompt}
            disabled={isGeneratingPrompt}
            className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isGeneratingPrompt ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Prompt...</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Update Custom AI Prompt →</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onGeneratePrompt}
            disabled={isGeneratingPrompt}
            className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isGeneratingPrompt ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Prompt...</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Customize AI Prompt →</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function PromptReviewStep({ prompt, onPromptChange, onComplete, onReturnToOriginal, onBack, isGenerating, isEditMode, hasPromptBeenEdited, originalPrompt }: { 
  prompt: string, 
  onPromptChange: (prompt: string) => void, 
  onComplete: () => void, 
  onReturnToOriginal: () => void,
  onBack: () => void, 
  isGenerating: boolean,
  isEditMode: boolean,
  hasPromptBeenEdited: boolean,
  originalPrompt: string
}) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Customize Your AI Prompt</h2>
      <p className="text-gray-600 mb-8">
        Review and edit the AI prompt that will be used to generate your curriculum. 
        You can modify it to better reflect your specific needs and preferences.
      </p>
      
      {/* Edit status indicator */}
      {isEditMode && (
        <div className={`mb-6 p-4 rounded-lg border ${
          hasPromptBeenEdited 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              hasPromptBeenEdited ? 'bg-blue-500' : 'bg-gray-400'
            }`}></div>
            <span className={`text-sm font-medium ${
              hasPromptBeenEdited ? 'text-blue-700' : 'text-gray-600'
            }`}>
              {hasPromptBeenEdited 
                ? 'Prompt has been modified - will generate new syllabus' 
                : 'No changes detected - will return to original syllabus'
              }
            </span>
          </div>
        </div>
      )}
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            AI Generation Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none font-mono text-sm"
            placeholder="Your AI prompt will appear here..."
          />
          <div className="mt-2 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              This prompt will be used by the AI to generate your personalized curriculum. 
              Feel free to modify it to better suit your needs.
            </p>
            {isEditMode && hasPromptBeenEdited && originalPrompt && (
              <button
                onClick={() => onPromptChange(originalPrompt)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset to Original
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          ← Back to Review
        </button>
        <button
          onClick={isEditMode && !hasPromptBeenEdited ? onReturnToOriginal : onComplete}
          disabled={isGenerating && !(isEditMode && !hasPromptBeenEdited)}
          className="px-8 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isGenerating && !(isEditMode && !hasPromptBeenEdited) ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
              <span>Generating Syllabus...</span>
            </>
          ) : (
            <>
              <span>
                {isEditMode 
                  ? (hasPromptBeenEdited ? 'Generate New Syllabus →' : 'Return to Original Syllabus →')
                  : 'Generate My Syllabus →'
                }
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
