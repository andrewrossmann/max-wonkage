import { supabase } from './supabase'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  created_at: string
  updated_at: string
}

export interface TimeAvailability {
  totalDays: number
  sessionsPerWeek: number
  sessionLength: number
}

export interface PersonalBackground {
  background: string
  interests: string
  experiences: string
  goals: string
}

export interface Curriculum {
  id: string
  user_id: string
  title: string
  subject: string
  skill_level: string
  goals?: string
  personal_background: PersonalBackground
  time_availability: TimeAvailability
  curriculum_data?: any
  status: 'active' | 'completed' | 'paused'
  progress: any
  created_at: string
  updated_at: string
}

export interface LearningSession {
  id: string
  curriculum_id: string
  session_number: number
  title: string
  description?: string
  content?: any
  duration_minutes?: number
  completed: boolean
  completed_at?: string
  created_at: string
}

// User Profile Functions
export async function getUserProfile(userId: string, email?: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    
    // If profile doesn't exist, create it
    if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
      console.log('Profile not found, creating new profile for user:', userId)
      return await createUserProfile(userId, email)
    }
    return null
  }

  return data
}

export async function createUserProfile(userId: string, email?: string): Promise<UserProfile | null> {
  console.log('Creating user profile for:', userId, 'with email:', email)
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([{ id: userId, email }])
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return null
  }

  console.log('Successfully created user profile:', data)
  return data
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    return null
  }

  return data
}

// Curriculum Functions
export async function getUserCurricula(userId: string, email?: string): Promise<Curriculum[]> {
  // First ensure user profile exists
  await getUserProfile(userId, email)
  
  const { data, error } = await supabase
    .from('curricula')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching curricula:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return []
  }

  return data || []
}

export async function createCurriculum(curriculum: Omit<Curriculum, 'id' | 'created_at' | 'updated_at'>): Promise<Curriculum | null> {
  const { data, error } = await supabase
    .from('curricula')
    .insert([curriculum])
    .select()
    .single()

  if (error) {
    console.error('Error creating curriculum:', error)
    return null
  }

  return data
}

export async function updateCurriculum(curriculumId: string, updates: Partial<Curriculum>): Promise<Curriculum | null> {
  const { data, error } = await supabase
    .from('curricula')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', curriculumId)
    .select()
    .single()

  if (error) {
    console.error('Error updating curriculum:', error)
    return null
  }

  return data
}

// Learning Session Functions
export async function getCurriculumSessions(curriculumId: string): Promise<LearningSession[]> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('curriculum_id', curriculumId)
    .order('session_number', { ascending: true })

  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }

  return data || []
}

export async function createLearningSessions(sessions: Omit<LearningSession, 'id' | 'created_at'>[]): Promise<LearningSession[]> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .insert(sessions)
    .select()

  if (error) {
    console.error('Error creating sessions:', error)
    return []
  }

  return data || []
}

export async function updateSession(sessionId: string, updates: Partial<LearningSession>): Promise<LearningSession | null> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating session:', error)
    return null
  }

  return data
}
