import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing DALL-E image generation...')
    
    // Test with a simple, safe prompt
    const testPrompt = "A simple diagram showing a lightbulb with a gear inside, representing AI and automation, clean minimalist style"
    
    console.log('🎨 Test prompt:', testPrompt)
    console.log('🔑 OpenAI API key available:', !!process.env.OPENAI_API_KEY)
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: testPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    })
    
    console.log('📥 DALL-E response:', response)
    
    if (response && response.data && response.data[0]) {
      const imageUrl = response.data[0].url
      console.log('✅ DALL-E test successful:', imageUrl)
      
      return NextResponse.json({
        success: true,
        message: 'DALL-E is working correctly',
        imageUrl: imageUrl,
        prompt: testPrompt
      })
    } else {
      console.error('❌ DALL-E test failed - invalid response')
      return NextResponse.json({
        success: false,
        message: 'DALL-E returned invalid response',
        response: response
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('💥 DALL-E test error:', error)
    
    let errorMessage = 'Unknown error'
    let errorType = 'unknown'
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      if (error.message.includes('rate_limit_exceeded')) {
        errorType = 'rate_limit'
      } else if (error.message.includes('content_policy_violation')) {
        errorType = 'content_policy'
      } else if (error.message.includes('insufficient_quota')) {
        errorType = 'quota'
      } else if (error.message.includes('billing')) {
        errorType = 'billing'
      } else if (error.message.includes('api_key')) {
        errorType = 'api_key'
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'DALL-E test failed',
      error: errorMessage,
      errorType: errorType,
      details: error instanceof Error ? {
        name: error.name,
        stack: error.stack
      } : null
    }, { status: 500 })
  }
}
