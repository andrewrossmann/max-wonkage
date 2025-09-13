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

    // Sessions will be generated when user continues their learning journey

    return NextResponse.json({
      success: true,
      curriculum: {
        ...curriculum,
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        status: 'active'
      },
      message: 'Curriculum approved successfully'
    })

  } catch (error) {
    console.error('Error in curriculum approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
