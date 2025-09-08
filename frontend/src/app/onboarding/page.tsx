'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/Logo'
import { createCurriculum } from '@/lib/database'
import { ChevronLeft, ChevronRight, Clock, BookOpen, Target, CheckCircle, Mic, MicOff, Send, Loader2, User } from 'lucide-react'

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
    totalDays: number
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
      totalDays: 30,
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
  
  const { user } = useAuth()
  const router = useRouter()
  
  // Voice input state
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentField, setCurrentField] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const finalTranscriptRef = useRef<string>('')
  const currentFieldRef = useRef<string | null>(null)
  const existingContentRef = useRef<string>('')

  const steps = [
    { id: 1, title: 'Choose Subject', icon: BookOpen },
    { id: 2, title: 'Tell Us About You', icon: User },
    { id: 3, title: 'Time Availability', icon: Clock },
    { id: 4, title: 'Skill Level & Goals', icon: Target },
    { id: 5, title: 'Review & Confirm', icon: CheckCircle }
  ]

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
          if (activeField && activeField in data.personalBackground) {
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
          if (activeField && activeField in data.personalBackground) {
            const existingContent = existingContentRef.current
            const accumulatedFinal = finalTranscriptRef.current
            
            // Only update if we have new content
            if (accumulatedFinal) {
              const fullTranscript = existingContent + (existingContent ? ' ' : '') + accumulatedFinal
              console.log('Final update on end:', fullTranscript)
              updateData('personalBackground', { [activeField]: fullTranscript })
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

  const startVoiceInput = (field: string) => {
    console.log('Starting voice input for field:', field)
    if (recognitionRef.current && !isListening) {
      setCurrentField(field)
      currentFieldRef.current = field // Store in ref as well
      setIsListening(true)
      setIsProcessing(true)
      
      // Capture existing content for this field
      existingContentRef.current = (data.personalBackground as any)[field] || ''
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
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    if (!user) return
    
    try {
      // Create curriculum from onboarding data
      const curriculum = await createCurriculum({
        user_id: user.id,
        title: `${data.subject.topic} Learning Journey`,
        subject: data.subject.topic,
        skill_level: data.subject.skillLevel,
        goals: data.subject.goals,
        personal_background: data.personalBackground,
        time_availability: data.timeAvailability,
        status: 'active',
        progress: {}
      })

      if (curriculum) {
        // TODO: Generate actual curriculum content with AI
        console.log('Curriculum created:', curriculum)
        router.push('/dashboard')
      } else {
        console.error('Failed to create curriculum')
      }
    } catch (error) {
      console.error('Error creating curriculum:', error)
    }
  }

  const updateData = (section: keyof OnboardingData, updates: any) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
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
            <div className="text-sm text-gray-600">
              Step {currentStep} of 5
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
              {currentStep < 5 ? (
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
                  title="Generate My Curriculum"
                >
                  Complete
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
                onNext={() => setCurrentStep(5)}
              />
            )}
            
            {currentStep === 5 && (
              <ReviewStep 
                data={data}
                onComplete={handleComplete}
                onEditStep={setCurrentStep}
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
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  const questions = [
    {
      id: 'background',
      title: 'Tell me about your background and experience',
      placeholder: 'Share your professional background, education, hobbies, and any relevant experiences... The more information you provide, the better! The ai will train on whatever details you give.',
      icon: '👤'
    },
    {
      id: 'interests',
      title: 'What are your interests and passions?',
      placeholder: 'What topics, activities, or subjects genuinely excite you? What do you love learning about?',
      icon: '❤️'
    },
    {
      id: 'experiences',
      title: 'Any relevant experiences to share?',
      placeholder: 'Previous experience with subjects you want to learn? Projects, courses, or skills you\'ve developed?',
      icon: '🎯'
    },
    {
      id: 'goals',
      title: 'What are your goals and aspirations?',
      placeholder: 'What do you hope to achieve? Where do you see yourself in the future? What impact do you want to make?',
      icon: '🚀'
    }
  ]

  const currentQ = questions[currentQuestion]
  const currentValue = data[currentQ.id] || ''

  // Scroll to bottom when content changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [currentQuestion, currentValue, data])

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      // Stop any active voice input when moving to next question
      if (isListening) {
        onStopVoiceInput()
      }
      
      setIsTyping(true)
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
        setIsTyping(false)
      }, 500)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      // Stop any active voice input when moving to previous question
      if (isListening) {
        onStopVoiceInput()
      }
      
      setIsTyping(true)
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1)
        setIsTyping(false)
      }, 500)
    }
  }

  const handleSubmit = () => {
    if (currentValue.trim()) {
      // Stop any active voice input when submitting
      if (isListening) {
        onStopVoiceInput()
      }
      
      updateData({ [currentQ.id]: currentValue })
      if (currentQuestion < questions.length - 1) {
        handleNext()
      } else {
        // Move to next step (Time Availability) when on the last question
        onNext()
      }
    }
  }

  const handleVoiceInput = () => {
    if (isListening) {
      onStopVoiceInput()
    } else {
      onStartVoiceInput(currentQ.id)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ChatGPT-style header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Terrific! New let's get to know you</h1>
        <p className="text-gray-600">I'll ask you a few questions to create your personalized learning journey</p>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentQuestion ? 'bg-yellow-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Chat-like interface */}
      <div ref={chatContainerRef} className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
        {/* Conversation History */}
        {questions.slice(0, currentQuestion).map((question, index) => {
          const questionData = data[question.id]
          if (!questionData) return null
          
          return (
            <div key={question.id} className="space-y-4">
              {/* AI Message */}
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-2xl p-4 max-w-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{question.icon}</span>
                      <h3 className="font-medium text-gray-900">{question.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">{question.placeholder}</p>
                  </div>
                </div>
              </div>

              {/* User Response */}
              <div className="flex items-start justify-end">
                <div className="flex-1 max-w-2xl">
                  <div className="bg-white border-2 border-yellow-500 text-gray-800 rounded-2xl p-4 ml-auto">
                    <p className="text-sm">{questionData}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Current AI Message */}
        <div className="flex items-start">
          <div className="flex-1">
            <div className="bg-gray-50 rounded-2xl p-4 max-w-2xl">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{currentQ.icon}</span>
                <h3 className="font-medium text-gray-900">{currentQ.title}</h3>
              </div>
              <p className="text-gray-600 text-sm">{currentQ.placeholder}</p>
            </div>
          </div>
        </div>

        {/* Current User Response */}
        {currentValue && (
          <div className="flex items-start justify-end">
            <div className="flex-1 max-w-2xl">
              <div className="bg-white border-2 border-yellow-500 text-gray-800 rounded-2xl p-4 ml-auto">
                <p className="text-sm">{currentValue}</p>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-start justify-end">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <textarea
                value={currentValue}
                onChange={(e) => updateData({ [currentQ.id]: e.target.value })}
                placeholder="Type your response here..."
                rows={3}
                className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none bg-white shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
              <div className="absolute right-2 bottom-2 flex space-x-1">
                <button
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-full transition-colors ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse hover:bg-red-600' 
                      : isProcessing
                      ? 'bg-gray-300 text-gray-500 hover:bg-gray-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isListening ? 'Stop recording' : isProcessing ? 'Stop processing' : 'Start voice input'}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!currentValue.trim()}
                  className="p-2 rounded-full bg-yellow-500 text-black hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            {isListening && (
              <p className="text-sm text-red-500 mt-2 flex items-center">
                <Mic className="w-4 h-4 mr-1 animate-pulse" />
                Listening... Speak now
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

function TimeAvailabilityStep({ data, updateData, onNext }: { data: any, updateData: (updates: any) => void, onNext: () => void }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell Us About Your Time</h2>
      <p className="text-gray-600 mb-8">How much time do you have available for learning?</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total days available
          </label>
          <input
            type="number"
            value={data.totalDays}
            onChange={(e) => updateData({ totalDays: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            min="1"
            max="365"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && data.totalDays && data.sessionsPerWeek && data.sessionLength) {
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
            value={data.sessionsPerWeek}
            onChange={(e) => updateData({ sessionsPerWeek: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            min="1"
            max="7"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && data.totalDays && data.sessionsPerWeek && data.sessionLength) {
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
            value={data.sessionLength}
            onChange={(e) => updateData({ sessionLength: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            min="15"
            max="240"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && data.totalDays && data.sessionsPerWeek && data.sessionLength) {
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
          disabled={!data.totalDays || !data.sessionsPerWeek || !data.sessionLength}
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

function SkillLevelStep({ data, updateData, onNext }: { data: any, updateData: (updates: any) => void, onNext: () => void }) {
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
          <textarea
            value={data.goals}
            onChange={(e) => updateData({ goals: e.target.value })}
            placeholder="What do you want to achieve? (e.g., Build a web app, Have conversations in Spanish, Write a novel...)"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && data.skillLevel && data.goals.trim()) {
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
          disabled={!data.skillLevel || !data.goals.trim()}
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

function ReviewStep({ data, onComplete, onEditStep }: { data: OnboardingData, onComplete: () => void, onEditStep: (step: number) => void }) {
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
              <span className="text-gray-600">Total Days:</span>
              <div className="font-medium">{data.timeAvailability.totalDays} days</div>
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
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Generate My Curriculum →
        </button>
      </div>
    </div>
  )
}
