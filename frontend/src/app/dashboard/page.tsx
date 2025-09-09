'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import { getUserProfile, createUserProfile, getUserCurricula, Curriculum } from '@/lib/database'
import { BookOpen, Clock, Target, TrendingUp, Play, MoreVertical, Edit, Archive, Trash2 } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [curricula, setCurricula] = useState<Curriculum[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null)
      }
    }

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

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

  const handleEditCurriculum = (curriculumId: string) => {
    // TODO: Implement edit functionality - could redirect to onboarding with pre-filled data
    console.log('Edit curriculum:', curriculumId)
    setOpenDropdown(null)
  }

  const handleArchiveCurriculum = async (curriculumId: string) => {
    // TODO: Implement archive functionality
    console.log('Archive curriculum:', curriculumId)
    setOpenDropdown(null)
  }

  const handleDeleteCurriculum = async (curriculumId: string) => {
    if (confirm('Are you sure you want to delete this curriculum? This action cannot be undone.')) {
      // TODO: Implement delete functionality
      console.log('Delete curriculum:', curriculumId)
      setOpenDropdown(null)
    }
  }

  const toggleDropdown = (curriculumId: string) => {
    setOpenDropdown(openDropdown === curriculumId ? null : curriculumId)
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
              {curricula.length === 0 
                ? `Hello, ${userProfile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there'}! 👋`
                : `Welcome back, ${userProfile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there'}! 👋`
              }
            </h1>
            <p className="text-xl text-gray-600">
              {curricula.length === 0 
                ? "Ready to start your learning journey?"
                : "Ready to continue your learning journey?"
              }
            </p>
          </div>

          {dataLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your data...</p>
            </div>
          ) : curricula.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">Your Learning Curricula</h2>
                <motion.button
                  onClick={() => router.push('/onboarding')}
                  className="px-4 py-2 border-2 border-yellow-500 text-yellow-600 rounded-lg font-medium hover:bg-yellow-50 transition-colors flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Create Another</span>
                </motion.button>
              </div>
              
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
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          curriculum.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : curriculum.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {curriculum.status}
                        </span>
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdown(curriculum.id)}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                          {openDropdown === curriculum.id && (
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                              <button
                                onClick={() => handleEditCurriculum(curriculum.id)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleArchiveCurriculum(curriculum.id)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <Archive className="w-3 h-3" />
                                <span>Archive</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCurriculum(curriculum.id)}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
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
