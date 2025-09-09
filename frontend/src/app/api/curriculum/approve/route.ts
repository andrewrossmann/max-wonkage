import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aiCurriculumGenerator } from '@/lib/ai'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { curriculumId, customizations, userId } = body

    if (!curriculumId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: curriculumId and userId' },
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

    // Get the curriculum
    const { data: curriculum, error: curriculumError } = await userSupabase
      .from('curricula')
      .select('*')
      .eq('id', curriculumId)
      .eq('user_id', userId)
      .single()

    if (curriculumError || !curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found' },
        { status: 404 }
      )
    }

    // Apply any customizations if provided
    let finalCurriculum = curriculum.curriculum_data
    if (customizations) {
      // Apply customizations to the curriculum
      finalCurriculum = {
        ...finalCurriculum,
        ...customizations
      }
    }

    // Update curriculum status to approved
    const { error: updateError } = await userSupabase
      .from('curricula')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        curriculum_data: finalCurriculum,
        customization_notes: customizations ? JSON.stringify(customizations) : null,
        status: 'active'
      })
      .eq('id', curriculumId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve curriculum' },
        { status: 500 }
      )
    }

    // Generate individual sessions
    const sessions = []
    const sessionList = finalCurriculum.session_list || []

    for (let i = 0; i < sessionList.length; i++) {
      const sessionData = sessionList[i]
      
      try {
        // Generate detailed session content
        const detailedSession = await aiCurriculumGenerator.generateSession(
          sessionData,
          {
            name: curriculum.personal_background?.background || 'User',
            background: curriculum.personal_background?.background || '',
            currentRole: 'Professional',
            skillLevel: curriculum.skill_level,
            subject: curriculum.subject,
            goals: curriculum.goals || '',
            timeAvailability: curriculum.time_availability,
            personalBackground: curriculum.personal_background
          }
        )

        // Calculate reading time for the AI essay
        const estimatedReadingTime = aiCurriculumGenerator.calculateReadingTime(detailedSession.ai_essay)

        // Create session record
        const { data: sessionRecord, error: sessionError } = await userSupabase
          .from('learning_sessions')
          .insert({
            curriculum_id: curriculumId,
            session_number: detailedSession.session_number,
            title: detailedSession.title,
            description: detailedSession.description,
            content: detailedSession,
            duration_minutes: curriculum.time_availability.session_length,
            session_format: detailedSession,
            ai_essay: detailedSession.ai_essay,
            estimated_reading_time: estimatedReadingTime,
            resources: {
              recommended_readings: detailedSession.recommended_readings,
              case_studies: detailedSession.case_studies,
              video_resources: detailedSession.video_resources
            },
            discussion_prompts: detailedSession.discussion_prompts,
            generation_metadata: {
              generated_at: new Date().toISOString(),
              model: 'gpt-4',
              content_density: detailedSession.content_density,
              session_type: detailedSession.session_type
            },
            content_density: detailedSession.content_density,
            session_type: detailedSession.session_type
          })
          .select()
          .single()

        if (sessionError) {
          console.error(`Error creating session ${i + 1}:`, sessionError)
          // Continue with other sessions even if one fails
          continue
        }

        sessions.push(sessionRecord)
      } catch (error) {
        console.error(`Error generating session ${i + 1}:`, error)
        // Continue with other sessions even if one fails
        continue
      }
    }

    return NextResponse.json({
      success: true,
      curriculum: {
        ...curriculum,
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        status: 'active'
      },
      sessions: sessions,
      message: `Successfully generated ${sessions.length} sessions`
    })

  } catch (error) {
    console.error('Error in curriculum approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
