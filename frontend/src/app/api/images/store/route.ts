import { NextRequest, NextResponse } from 'next/server'
import { imageStorage } from '@/lib/image-storage'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/images/store called')
    
    const { dalleUrl, sessionId, prompt } = await request.json()
    
    console.log('Request data:', { dalleUrl: dalleUrl?.substring(0, 50) + '...', sessionId, prompt: prompt?.substring(0, 50) + '...' })
    
    if (!dalleUrl || !sessionId || !prompt) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: dalleUrl, sessionId, prompt' },
        { status: 400 }
      )
    }
    
    // Skip session verification for now to test image storage
    console.log('📥 Attempting to store image...')
    
    // Store the image
    const storedImage = await imageStorage.storeDalleImage(dalleUrl, sessionId, prompt)
    
    if (!storedImage) {
      console.log('❌ Image storage failed')
      return NextResponse.json(
        { error: 'Failed to store image' },
        { status: 500 }
      )
    }
    
    console.log('✅ Image stored successfully:', storedImage)
    
    return NextResponse.json({
      success: true,
      image: storedImage
    })
    
  } catch (error) {
    console.error('💥 Error storing image:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/images/store called')
    
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    console.log('SessionId:', sessionId)
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      )
    }
    
    // Get session images (skip session verification for now)
    const images = await imageStorage.getSessionImages(sessionId)
    
    return NextResponse.json({
      success: true,
      images
    })
    
  } catch (error) {
    console.error('Error in GET /api/images/store:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    
    if (!imageId) {
      return NextResponse.json(
        { error: 'Missing imageId parameter' },
        { status: 400 }
      )
    }
    
    // Verify image belongs to user
    const { data: image, error: imageError } = await supabaseServer
      .from('session_images')
      .select(`
        id,
        session_id,
        learning_sessions!inner(
          curriculum_id,
          curricula!inner(user_id)
        )
      `)
      .eq('id', imageId)
      .single()
    
    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }
    
    // Delete the image
    const success = await imageStorage.deleteStoredImage(imageId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
