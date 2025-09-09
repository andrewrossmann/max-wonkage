import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aiCurriculumGenerator, CurriculumGenerationRequest } from '@/lib/ai'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userProfile, userId } = body

    if (!userProfile || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: userProfile and userId' },
        { status: 400 }
      )
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Extract the token and validate the user
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the userId matches the authenticated user
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      )
    }

    // Create a new Supabase client with the user's session token for RLS
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Test the user context
    const { data: { user: testUser }, error: testError } = await userSupabase.auth.getUser()
    console.log('User context test:', { testUser: testUser?.id, testError })

    // Generate curriculum using AI
    const curriculum = await aiCurriculumGenerator.generateCurriculum({
      userProfile
    })

    // Validate the generated curriculum
    const validation = aiCurriculumGenerator.validateCurriculum(curriculum)
    if (!validation.isValid) {
      console.error('Curriculum validation failed:', validation.errors)
      return NextResponse.json(
        { error: 'Generated curriculum is invalid', details: validation.errors },
        { status: 500 }
      )
    }

    // Calculate total estimated hours and curriculum type
    const totalHours = curriculum.curriculum_overview.total_estimated_hours
    const totalSessions = curriculum.curriculum_overview.total_sessions || curriculum.session_list.length
    
    // Determine curriculum type based on session count (same logic as AI generator)
    let curriculumType = 'standard'
    if (totalSessions <= 5) curriculumType = 'crash_course'
    else if (totalSessions <= 15) curriculumType = 'standard'
    else if (totalSessions <= 30) curriculumType = 'comprehensive'
    else curriculumType = 'mastery'

    // Create curriculum record in database using user-specific client for RLS
    console.log('Attempting to insert curriculum with userId:', userId)
    const { data: curriculumRecord, error: dbError } = await userSupabase
      .from('curricula')
      .insert({
        user_id: userId,
        title: curriculum.curriculum_overview.title,
        subject: userProfile.subject,
        skill_level: userProfile.skillLevel,
        goals: userProfile.goals,
        personal_background: userProfile.personalBackground,
        time_availability: userProfile.timeAvailability,
        curriculum_data: curriculum,
        syllabus_data: curriculum.curriculum_overview,
        generation_prompt: JSON.stringify({
          userProfile,
          timestamp: new Date().toISOString()
        }),
        generation_metadata: {
          model: 'gpt-4',
          generated_at: new Date().toISOString(),
          total_sessions: totalSessions,
          curriculum_type: curriculumType,
          content_density: curriculum.curriculum_overview.content_density_profile || 'moderate'
        },
        approval_status: 'pending',
        curriculum_type: curriculumType,
        total_estimated_hours: totalHours,
        session_count: totalSessions,
        average_session_length: userProfile.timeAvailability.sessionLength,
        status: 'pending_approval'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save curriculum to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      curriculum: curriculumRecord,
      generatedCurriculum: curriculum
    })

  } catch (error) {
    console.error('Error in curriculum generation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
