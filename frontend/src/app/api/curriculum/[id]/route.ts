import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const curriculumId = resolvedParams.id
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Create Supabase client with the user's token
    const supabase = createClient(
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

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the curriculum
    const { data: curriculum, error: curriculumError } = await supabase
      .from('curricula')
      .select('*')
      .eq('id', curriculumId)
      .eq('user_id', user.id) // Ensure user can only access their own curricula
      .single()

    if (curriculumError) {
      console.error('Error fetching curriculum:', curriculumError)
      if (curriculumError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch curriculum' }, { status: 500 })
    }

    return NextResponse.json(curriculum)
  } catch (error) {
    console.error('Error in curriculum API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
