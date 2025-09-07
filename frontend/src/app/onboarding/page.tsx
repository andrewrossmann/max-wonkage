'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/Logo'
import { createCurriculum } from '@/lib/database'
import { ChevronLeft, ChevronRight, Clock, BookOpen, Target, CheckCircle } from 'lucide-react'

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

  const steps = [
    { id: 1, title: 'Tell Us About You', icon: BookOpen },
    { id: 2, title: 'Time Availability', icon: Clock },
    { id: 3, title: 'Choose Subject', icon: BookOpen },
    { id: 4, title: 'Skill Level & Goals', icon: Target },
    { id: 5, title: 'Review & Confirm', icon: CheckCircle }
  ]

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
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

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-yellow-500 border-yellow-500 text-black' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            {currentStep === 1 && (
              <PersonalBackgroundStep 
                data={data.personalBackground}
                updateData={(updates) => updateData('personalBackground', updates)}
              />
            )}
            
            {currentStep === 2 && (
              <TimeAvailabilityStep 
                data={data.timeAvailability}
                updateData={(updates) => updateData('timeAvailability', updates)}
              />
            )}
            
            {currentStep === 3 && (
              <SubjectSelectionStep 
                data={data.subject}
                updateData={(updates) => updateData('subject', updates)}
              />
            )}
            
            {currentStep === 4 && (
              <SkillLevelStep 
                data={data.subject}
                updateData={(updates) => updateData('subject', updates)}
              />
            )}
            
            {currentStep === 5 && (
              <ReviewStep 
                data={data}
                onComplete={handleComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <motion.button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </motion.button>

          {currentStep < 5 ? (
            <motion.button
              onClick={nextStep}
              className="flex items-center px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleComplete}
              className="flex items-center px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Generate My Curriculum
              <ChevronRight className="w-5 h-5 ml-2" />
            </motion.button>
          )}
        </div>
      </main>
    </div>
  )
}

// Step Components
function PersonalBackgroundStep({ data, updateData }: { data: any, updateData: (updates: any) => void }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell Us About Yourself</h2>
      <p className="text-gray-600 mb-8">
        Help us understand your background, interests, and experiences so we can create the most personalized learning journey for you.
      </p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Background & Experience
          </label>
          <textarea
            value={data.background}
            onChange={(e) => updateData({ background: e.target.value })}
            placeholder="Tell us about your professional background, education, hobbies, and any relevant experiences..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Interests & Passions
          </label>
          <textarea
            value={data.interests}
            onChange={(e) => updateData({ interests: e.target.value })}
            placeholder="What topics, activities, or subjects genuinely excite you? What do you love learning about?"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relevant Experiences
          </label>
          <textarea
            value={data.experiences}
            onChange={(e) => updateData({ experiences: e.target.value })}
            placeholder="Any previous experience with the subject you want to learn? Projects you've worked on, courses you've taken, or skills you've developed?"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Goals & Aspirations
          </label>
          <textarea
            value={data.goals}
            onChange={(e) => updateData({ goals: e.target.value })}
            placeholder="What do you hope to achieve? Where do you see yourself in the future? What impact do you want to make?"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
          />
        </div>
      </div>
    </div>
  )
}

function TimeAvailabilityStep({ data, updateData }: { data: any, updateData: (updates: any) => void }) {
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
          />
        </div>
      </div>
    </div>
  )
}

function SubjectSelectionStep({ data, updateData }: { data: any, updateData: (updates: any) => void }) {
  const popularSubjects = [
    'Python Programming', 'Spanish', 'Creative Writing', 'AI/Machine Learning',
    'Web Development', 'Data Science', 'Digital Marketing', 'Photography',
    'Music Theory', 'Cooking', 'Fitness', 'Meditation'
  ]

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
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Popular Subjects
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {popularSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => updateData({ topic: subject })}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  data.topic === subject
                    ? 'bg-yellow-500 text-black border-yellow-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-500'
                }`}
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

function SkillLevelStep({ data, updateData }: { data: any, updateData: (updates: any) => void }) {
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
          />
        </div>
      </div>
    </div>
  )
}

function ReviewStep({ data, onComplete }: { data: OnboardingData, onComplete: () => void }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Preferences</h2>
      <p className="text-gray-600 mb-8">Everything looks good? Let's generate your personalized curriculum!</p>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About You</h3>
          <div className="space-y-3 text-sm">
            {data.personalBackground.background && (
              <div>
                <span className="text-gray-600 font-medium">Background:</span>
                <div className="mt-1 text-gray-800">{data.personalBackground.background}</div>
              </div>
            )}
            {data.personalBackground.interests && (
              <div>
                <span className="text-gray-600 font-medium">Interests:</span>
                <div className="mt-1 text-gray-800">{data.personalBackground.interests}</div>
              </div>
            )}
            {data.personalBackground.experiences && (
              <div>
                <span className="text-gray-600 font-medium">Relevant Experience:</span>
                <div className="mt-1 text-gray-800">{data.personalBackground.experiences}</div>
              </div>
            )}
            {data.personalBackground.goals && (
              <div>
                <span className="text-gray-600 font-medium">Goals & Aspirations:</span>
                <div className="mt-1 text-gray-800">{data.personalBackground.goals}</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Availability</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Days:</span>
              <div className="font-medium">{data.timeAvailability.totalDays} days</div>
            </div>
            <div>
              <span className="text-gray-600">Sessions/Week:</span>
              <div className="font-medium">{data.timeAvailability.sessionsPerWeek}</div>
            </div>
            <div>
              <span className="text-gray-600">Session Length:</span>
              <div className="font-medium">{data.timeAvailability.sessionLength} minutes</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Subject</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Topic:</span>
              <div className="font-medium">{data.subject.topic}</div>
            </div>
            <div>
              <span className="text-gray-600">Skill Level:</span>
              <div className="font-medium capitalize">{data.subject.skillLevel}</div>
            </div>
            {data.subject.goals && (
              <div>
                <span className="text-gray-600">Learning Goals:</span>
                <div className="font-medium">{data.subject.goals}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
