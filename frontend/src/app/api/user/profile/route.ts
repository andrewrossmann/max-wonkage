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
    console.log('Profile API: Received token:', token ? 'present' : 'missing')
    console.log('Profile API: Token length:', token?.length)
    console.log('Profile API: Token preview:', token?.substring(0, 50) + '...')
    
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

    console.log('Fetching user profile for userId:', user.id)
    
    // Fetch user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
        console.log('Profile not found, creating new profile for user:', user.id)
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{ 
            id: user.id, 
            email: user.email,
            first_name: user.user_metadata?.first_name 
          }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating user profile:', createError)
          return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
        }

        return NextResponse.json(newProfile)
      }
      
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    console.log('Successfully fetched user profile:', data)
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in profile API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
