import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aiCurriculumGenerator, CurriculumGenerationRequest } from '@/lib/ai'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // You'll need to add this to your env
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

    // Validate user exists
    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    // Calculate total estimated hours
    const totalHours = curriculum.curriculum_overview.total_estimated_hours

    // Create curriculum record in database
    const { data: curriculumRecord, error: dbError } = await supabase
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
          total_sessions: curriculum.curriculum_overview.total_sessions,
          curriculum_type: curriculum.curriculum_overview.curriculum_type,
          content_density: curriculum.curriculum_overview.content_density_profile
        },
        approval_status: 'pending',
        curriculum_type: curriculum.curriculum_overview.curriculum_type,
        total_estimated_hours: totalHours,
        session_count: curriculum.curriculum_overview.total_sessions,
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
