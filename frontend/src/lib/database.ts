import { supabase } from './supabase'

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  full_name?: string
  created_at: string
  updated_at: string
}

export interface TimeAvailability {
  totalWeeks: number
  sessionsPerWeek: number
  sessionLength: number
  // Legacy support for totalDays (if it exists in older records)
  totalDays?: number
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
  syllabus_data?: any
  generation_prompt?: string
  generation_metadata?: any
  customization_notes?: string
  approval_status?: 'pending' | 'approved' | 'rejected'
  approved_at?: string
  curriculum_type?: string
  total_estimated_hours?: number
  session_count?: number
  average_session_length?: number
  status: 'active' | 'completed' | 'paused' | 'rejected'
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
  session_format?: any
  ai_essay?: string
  estimated_reading_time?: number
  resources?: any
  discussion_prompts?: string[]
  generation_metadata?: any
  content_density?: string
  session_type?: string
  duration_minutes?: number
  completed: boolean
  completed_at?: string
  created_at: string
}

// User Profile Functions
export async function getUserProfile(userId: string, email?: string, firstName?: string): Promise<UserProfile | null> {
  console.log('Fetching user profile for userId:', userId)
  
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
      return await createUserProfile(userId, email, firstName)
    }
    return null
  }

  console.log('Successfully fetched user profile:', data)
  return data
}

export async function createUserProfile(userId: string, email?: string, firstName?: string): Promise<UserProfile | null> {
  console.log('Creating user profile for:', userId, 'with email:', email, 'and first name:', firstName)
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([{ id: userId, email, first_name: firstName }])
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
    
    // If profile already exists (409 conflict), try to fetch it instead
    if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
      console.log('Profile already exists, fetching instead')
      return await getUserProfile(userId, email, firstName)
    }
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
export async function getUserCurricula(userId: string, email?: string, firstName?: string): Promise<Curriculum[]> {
  // First ensure user profile exists
  await getUserProfile(userId, email, firstName)
  
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

export async function archiveCurriculum(curriculumId: string): Promise<Curriculum | null> {
  const { data, error } = await supabase
    .from('curricula')
    .update({ 
      status: 'paused',
      updated_at: new Date().toISOString() 
    })
    .eq('id', curriculumId)
    .select()
    .single()

  if (error) {
    console.error('Error archiving curriculum:', error)
    return null
  }

  return data
}

export async function deleteCurriculum(curriculumId: string): Promise<boolean> {
  const { error } = await supabase
    .from('curricula')
    .delete()
    .eq('id', curriculumId)

  if (error) {
    console.error('Error deleting curriculum:', error)
    return false
  }

  return true
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

export async function markSessionComplete(sessionId: string): Promise<LearningSession | null> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .update({ 
      completed: true,
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error marking session complete:', error)
    return null
  }

  return data
}

export async function markSessionIncomplete(sessionId: string): Promise<LearningSession | null> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .update({ 
      completed: false,
      completed_at: null
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error marking session incomplete:', error)
    return null
  }

  return data
}
