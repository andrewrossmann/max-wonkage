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

    // Generate smart prompt using AI
    const smartPrompt = await aiCurriculumGenerator.generateSmartPrompt({
      userProfile
    })

    return NextResponse.json({
      success: true,
      prompt: smartPrompt
    })

  } catch (error) {
    console.error('Error generating smart prompt:', error)
    return NextResponse.json(
      { error: 'Failed to generate smart prompt. Please try again.' },
      { status: 500 }
    )
  }
}
