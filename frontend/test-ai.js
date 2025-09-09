// Simple test script to verify OpenAI integration
// Run with: node test-ai.js

const OpenAI = require('openai')

// Test configuration
const testConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000
}

async function testOpenAIConnection() {
  console.log('🧪 Testing OpenAI API connection...')
  
  if (!testConfig.apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment variables')
    console.log('Please add your OpenAI API key to .env.local')
    process.exit(1)
  }

  try {
    const openai = new OpenAI({
      apiKey: testConfig.apiKey,
    })

    // Simple test request
    const response = await openai.chat.completions.create({
      model: testConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with a simple greeting.'
        },
        {
          role: 'user',
          content: 'Hello! Can you generate a simple test response?'
        }
      ],
      temperature: testConfig.temperature,
      max_tokens: testConfig.maxTokens,
    })

    const content = response.choices[0]?.message?.content
    if (content) {
      console.log('✅ OpenAI API connection successful!')
      console.log('📝 Test response:', content)
      console.log('🎉 AI curriculum generation should work!')
    } else {
      console.error('❌ No content received from OpenAI')
    }

  } catch (error) {
    console.error('❌ OpenAI API test failed:', error.message)
    
    if (error.message.includes('API key')) {
      console.log('💡 Check your OPENAI_API_KEY in .env.local')
    } else if (error.message.includes('quota')) {
      console.log('💡 Check your OpenAI account credits')
    } else if (error.message.includes('model')) {
      console.log('💡 Check if you have access to GPT-4')
    }
  }
}

// Test curriculum generation prompt
async function testCurriculumPrompt() {
  console.log('\n🧪 Testing curriculum generation prompt...')
  
  if (!testConfig.apiKey) {
    console.log('⏭️ Skipping prompt test (no API key)')
    return
  }

  try {
    const openai = new OpenAI({
      apiKey: testConfig.apiKey,
    })

    const testPrompt = `You are an expert curriculum designer. Create a simple 3-session curriculum for "Python Programming" for a beginner.

USER PROFILE:
- Subject: Python Programming
- Skill Level: beginner
- Time: 3 sessions of 60 minutes each
- Goals: Learn basic Python programming

Return a JSON object with:
- curriculum_overview (title, description, total_sessions, learning_outcomes)
- session_list (array of 3 sessions with title, description, learning_objectives)

Keep it simple and focused.`

    const response = await openai.chat.completions.create({
      model: testConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert curriculum designer. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: testPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (content) {
      try {
        const curriculum = JSON.parse(content)
        console.log('✅ Curriculum generation prompt test successful!')
        console.log('📚 Generated curriculum:', curriculum.curriculum_overview?.title)
        console.log('📖 Sessions:', curriculum.session_list?.length || 0)
        console.log('🎉 AI curriculum generation is working!')
      } catch (parseError) {
        console.log('⚠️ Response received but not valid JSON:')
        console.log(content.substring(0, 200) + '...')
      }
    }

  } catch (error) {
    console.error('❌ Curriculum prompt test failed:', error.message)
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Max Wonkage AI Integration Tests\n')
  
  await testOpenAIConnection()
  await testCurriculumPrompt()
  
  console.log('\n✨ Test complete!')
  console.log('\nNext steps:')
  console.log('1. Make sure all environment variables are set')
  console.log('2. Run the database migration')
  console.log('3. Start the dev server: npm run dev')
  console.log('4. Test the full flow at /onboarding')
}

runTests().catch(console.error)
