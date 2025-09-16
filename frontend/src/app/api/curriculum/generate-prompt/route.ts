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
    console.log('Starting smart prompt generation...')
    const body = await request.json()
    const { userProfile, userId } = body

    if (!userProfile || !userId) {
      console.error('Missing required fields:', { userProfile: !!userProfile, userId: !!userId })
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

    // Generate smart prompt using AI
    console.log('Calling AI to generate smart prompt...')
    const startTime = Date.now()
    
    const smartPrompt = await aiCurriculumGenerator.generateSmartPrompt({
      userProfile
    })
    
    const endTime = Date.now()
    console.log(`Smart prompt generated successfully in ${(endTime - startTime) / 1000} seconds`)

    return NextResponse.json({
      success: true,
      prompt: smartPrompt
    })

  } catch (error) {
    console.error('Error generating smart prompt:', error)
    
    // Handle specific timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timed out. Please try again with a shorter prompt or try again later.' },
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
      { error: 'Failed to generate smart prompt. Please try again.' },
      { status: 500 }
    )
  }
}
