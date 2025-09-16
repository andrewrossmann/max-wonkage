import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aiCurriculumGenerator, CurriculumGenerationRequest } from '@/lib/ai'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Progress tracking for session generation
interface ProgressEvent {
  stage: 'validating' | 'fetching' | 'generating_structure' | 'generating_essay' | 'saving' | 'complete' | 'error'
  progress: number
  message: string
  data?: any
}

async function generateSessionWithProgress(
  controller: ReadableStreamDefaultController,
  curriculumId: string,
  sessionNumber: number,
  userId: string,
  request: NextRequest
) {
  const encoder = new TextEncoder()
  
  function sendProgress(event: ProgressEvent) {
    const data = `data: ${JSON.stringify(event)}\n\n`
    controller.enqueue(encoder.encode(data))
  }

  try {
    // Stage 1: Validation (5%)
    sendProgress({
      stage: 'validating',
      progress: 5,
      message: 'Initializing session generation...'
    })

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header')
    }

    // Extract the token and validate the user
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Verify the userId matches the authenticated user
    if (user.id !== userId) {
      throw new Error('User ID mismatch')
    }

    // Stage 2: Fetching data (10%)
    sendProgress({
      stage: 'fetching',
      progress: 10,
      message: 'Fetching curriculum data...'
    })

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

    // Get the curriculum data
    const { data: curriculum, error: curriculumError } = await userSupabase
      .from('curricula')
      .select('*')
      .eq('id', curriculumId)
      .eq('user_id', user.id)
      .single()

    if (curriculumError || !curriculum) {
      throw new Error('Curriculum not found')
    }

    // Check if session already exists
    const { data: existingSession } = await userSupabase
      .from('learning_sessions')
      .select('*')
      .eq('curriculum_id', curriculumId)
      .eq('session_number', sessionNumber)
      .single()

    if (existingSession) {
      throw new Error('Session already exists')
    }

    // Get session data from curriculum
    const rawSessionData = curriculum.curriculum_data?.session_list?.find((s: any) => 
      (s.session_number || 0) === sessionNumber || 
      curriculum.curriculum_data.session_list.indexOf(s) === sessionNumber - 1
    )

    if (!rawSessionData) {
      throw new Error('Session data not found in curriculum')
    }

    // Transform session data to match the expected structure
    const sessionData = {
      session_number: sessionNumber,
      title: rawSessionData.title || `Session ${sessionNumber} - ${curriculum.subject}`,
      description: rawSessionData.description || '',
      learning_objectives: rawSessionData.learning_objectives || [],
      content_density: rawSessionData.content_density || 'moderate',
      session_type: rawSessionData.session_type || 'overview'
    }

    // Create user profile for AI generation
    const userProfile: CurriculumGenerationRequest['userProfile'] = {
      name: user.user_metadata?.first_name || 'User',
      background: curriculum.personal_background.background,
      currentRole: 'Professional',
      skillLevel: curriculum.skill_level,
      subject: curriculum.subject,
      goals: curriculum.goals,
      timeAvailability: curriculum.time_availability,
      personalBackground: curriculum.personal_background
    }

    // Stage 3: Generating session structure (20%)
    sendProgress({
      stage: 'generating_structure',
      progress: 20,
      message: 'Generating session structure and metadata...'
    })

    // Generate the session using AI with progress tracking
    const generatedSession = await generateSessionWithAITracking(sessionData, userProfile, (progress, message, stage) => {
      // Map AI progress to overall progress (20-80%)
      const overallProgress = 20 + (progress * 0.6)
      sendProgress({
        stage: stage || 'generating_structure',
        progress: Math.round(overallProgress),
        message: message
      })
    })

    // Stage 4: Saving to database (85%)
    sendProgress({
      stage: 'saving',
      progress: 85,
      message: 'Saving session to database...'
    })

    const { data: newSession, error: insertError } = await userSupabase
      .from('learning_sessions')
      .insert({
        curriculum_id: curriculumId,
        session_number: sessionNumber,
        title: generatedSession.title,
        description: generatedSession.description,
        content: generatedSession,
        duration_minutes: curriculum.time_availability.sessionLength,
        content_density: generatedSession.content_density,
        session_type: generatedSession.session_type,
        ai_essay: generatedSession.ai_essay,
        estimated_reading_time: generatedSession.estimated_reading_time,
        resources: {
          recommended_readings: generatedSession.recommended_readings,
          case_studies: generatedSession.case_studies,
          video_resources: generatedSession.video_resources
        },
        discussion_prompts: generatedSession.discussion_prompts,
        generation_metadata: {
          generated_at: new Date().toISOString(),
          ai_model: 'gpt-4'
        }
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to save session: ${insertError.message}`)
    }

    // Stage 5: Complete (100%)
    sendProgress({
      stage: 'complete',
      progress: 100,
      message: 'Session generated successfully!',
      data: newSession
    })

    controller.close()

  } catch (error) {
    sendProgress({
      stage: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    })
    controller.close()
  }
}

// Modified AI generation with progress tracking
async function generateSessionWithAITracking(
  sessionData: any,
  userProfile: CurriculumGenerationRequest['userProfile'],
  onProgress: (progress: number, message: string, stage?: string) => void
) {
  return await aiCurriculumGenerator.generateSession(sessionData, userProfile, onProgress)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { curriculumId, sessionNumber, userId, useSSE = false } = body

    if (!curriculumId || !sessionNumber || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: curriculumId, sessionNumber, and userId' },
        { status: 400 }
      )
    }

    // If SSE is requested, return a streaming response
    if (useSSE) {
      return new Response(
        new ReadableStream({
          start(controller) {
            generateSessionWithProgress(controller, curriculumId, sessionNumber, userId, request)
          }
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
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

    // Get the curriculum data
    const { data: curriculum, error: curriculumError } = await userSupabase
      .from('curricula')
      .select('*')
      .eq('id', curriculumId)
      .eq('user_id', user.id)
      .single()

    if (curriculumError || !curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found' },
        { status: 404 }
      )
    }

    // Check if session already exists
    const { data: existingSession } = await userSupabase
      .from('learning_sessions')
      .select('*')
      .eq('curriculum_id', curriculumId)
      .eq('session_number', sessionNumber)
      .single()

    if (existingSession) {
      return NextResponse.json(
        { error: 'Session already exists' },
        { status: 409 }
      )
    }

    // Get session data from curriculum
    const rawSessionData = curriculum.curriculum_data?.session_list?.find((s: any) => 
      (s.session_number || 0) === sessionNumber || 
      curriculum.curriculum_data.session_list.indexOf(s) === sessionNumber - 1
    )

    console.log('Raw session data found:', rawSessionData)
    console.log('Curriculum data structure:', curriculum.curriculum_data)

    if (!rawSessionData) {
      return NextResponse.json(
        { error: 'Session data not found in curriculum' },
        { status: 404 }
      )
    }

    // Transform session data to match the expected structure
    const sessionData = {
      session_number: sessionNumber,
      title: rawSessionData.title || `Session ${sessionNumber} - ${curriculum.subject}`,
      description: rawSessionData.description || '',
      learning_objectives: rawSessionData.learning_objectives || [],
      content_density: rawSessionData.content_density || 'moderate',
      session_type: rawSessionData.session_type || 'overview'
    }

    console.log('Transformed session data:', sessionData)

    // Create user profile for AI generation
    const userProfile: CurriculumGenerationRequest['userProfile'] = {
      name: user.user_metadata?.first_name || 'User',
      background: curriculum.personal_background.background,
      currentRole: 'Professional',
      skillLevel: curriculum.skill_level,
      subject: curriculum.subject,
      goals: curriculum.goals,
      timeAvailability: curriculum.time_availability,
      personalBackground: curriculum.personal_background
    }

    // Generate the session using AI
    console.log(`Generating session ${sessionNumber} for curriculum ${curriculumId}`)
    console.log('User profile:', userProfile)
    console.log('Session data:', sessionData)
    
    let generatedSession
    try {
      console.log('Starting AI session generation...')
      generatedSession = await aiCurriculumGenerator.generateSession(sessionData, userProfile)
      console.log('Session generation completed successfully')
      console.log('Generated session keys:', Object.keys(generatedSession))
    } catch (aiError) {
      console.error('AI generation error details:', {
        message: aiError instanceof Error ? aiError.message : 'Unknown error',
        stack: aiError instanceof Error ? aiError.stack : undefined,
        name: aiError instanceof Error ? aiError.name : undefined
      })
      return NextResponse.json(
        { error: `AI generation failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Save the generated session to database
    console.log('Saving session to database...')
    console.log('Generated session data:', generatedSession)
    
    const { data: newSession, error: insertError } = await userSupabase
      .from('learning_sessions')
      .insert({
        curriculum_id: curriculumId,
        session_number: sessionNumber,
        title: generatedSession.title,
        description: generatedSession.description,
        content: generatedSession,
        duration_minutes: curriculum.time_availability.sessionLength,
        content_density: generatedSession.content_density,
        session_type: generatedSession.session_type,
        ai_essay: generatedSession.ai_essay,
        estimated_reading_time: generatedSession.estimated_reading_time,
        resources: {
          recommended_readings: generatedSession.recommended_readings,
          case_studies: generatedSession.case_studies,
          video_resources: generatedSession.video_resources
        },
        discussion_prompts: generatedSession.discussion_prompts,
        generation_metadata: {
          generated_at: new Date().toISOString(),
          ai_model: 'gpt-4'
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting session:', insertError)
      return NextResponse.json(
        { error: `Failed to save session: ${insertError.message}` },
        { status: 500 }
      )
    }

    console.log('Session saved successfully:', newSession)

    return NextResponse.json({
      success: true,
      session: newSession
    })

  } catch (error) {
    console.error('Error generating session:', error)
    
    // Handle specific timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Session generation timed out. Please try again with a shorter session or try again later.' },
        { status: 408 }
      )
    }
    
    // Handle OpenAI API errors
    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again in a few minutes.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate session. Please try again.' },
      { status: 500 }
    )
  }
}
