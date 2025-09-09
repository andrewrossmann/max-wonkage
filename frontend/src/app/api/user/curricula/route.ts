import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    console.log('Curricula API: Received token:', token ? 'present' : 'missing')
    console.log('Curricula API: Token length:', token?.length)
    console.log('Curricula API: Token preview:', token?.substring(0, 50) + '...')
    
    // Create a Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      console.error('User verification failed:', userError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('Fetching curricula for userId:', user.id)
    
    // Fetch user curricula
    const { data, error } = await supabase
      .from('curricula')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching curricula:', error)
      return NextResponse.json({ error: 'Failed to fetch curricula' }, { status: 500 })
    }

    console.log('Successfully fetched curricula:', data?.length || 0, 'items')
    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Error in curricula API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
