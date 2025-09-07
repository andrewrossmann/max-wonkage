'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import { getUserProfile, createUserProfile, getUserCurricula, Curriculum } from '@/lib/database'
import { BookOpen, Clock, Target, TrendingUp, Play } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [curricula, setCurricula] = useState<Curriculum[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [showEmailConfirmed, setShowEmailConfirmed] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      // Check if user just confirmed their email
      if (user.email_confirmed_at) {
        const confirmedAt = new Date(user.email_confirmed_at)
        const now = new Date()
        const timeDiff = now.getTime() - confirmedAt.getTime()
        
        // If email was confirmed within the last 5 minutes, show success message
        if (timeDiff < 5 * 60 * 1000) {
          setShowEmailConfirmed(true)
          // Remove the message after 10 seconds
          setTimeout(() => {
            setShowEmailConfirmed(false)
          }, 10000)
        }
      }
      
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    
    try {
      // Get first name from user metadata
      const firstName = user.user_metadata?.first_name
      
      // Ensure user profile exists first
      const profile = await getUserProfile(user.id, user.email, firstName)
      if (profile) {
        setUserProfile(profile)
      } else {
        // If profile creation failed, try with email and first name
        const newProfile = await createUserProfile(user.id, user.email, firstName)
        if (newProfile) {
          setUserProfile(newProfile)
        }
      }
      
      // Then fetch curricula
      const userCurricula = await getUserCurricula(user.id, user.email, firstName)
      setCurricula(userCurricula)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Logo showText={true} size={32} />
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                Welcome, {userProfile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there'}
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

      {/* Email Confirmed Success Banner */}
      {showEmailConfirmed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 mx-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  <strong>Email confirmed!</strong> Your account is now fully verified. Welcome to CurriCoolio!
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEmailConfirmed(false)}
              className="ml-4 text-green-400 hover:text-green-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 py-6 sm:px-0"
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {userProfile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there'}! 👋
            </h1>
            <p className="text-xl text-gray-600">
              Ready to continue your learning journey?
            </p>
          </div>

          {dataLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your data...</p>
            </div>
          ) : curricula.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Your Learning Curricula</h2>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {curricula.map((curriculum) => (
                  <motion.div
                    key={curriculum.id}
                    className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{curriculum.title}</h3>
                          <p className="text-sm text-gray-600">{curriculum.subject}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        curriculum.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : curriculum.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {curriculum.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {curriculum.time_availability.sessionsPerWeek} sessions/week, {curriculum.time_availability.sessionLength}min each
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Target className="w-4 h-4 mr-2" />
                        {curriculum.skill_level} level
                      </div>
                    </div>
                    
                    {curriculum.goals && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {curriculum.goals}
                      </p>
                    )}
                    
                    <motion.button
                      className="w-full px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play className="w-4 h-4" />
                      <span>Continue Learning</span>
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-gray-600 mb-6">
                You haven't created any learning curricula yet. Let's get started with your first personalized learning journey!
              </p>
              
              <motion.button
                onClick={() => router.push('/onboarding')}
                className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Your First Curriculum
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
