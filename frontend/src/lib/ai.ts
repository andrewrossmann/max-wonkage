import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CurriculumGenerationRequest {
  userProfile: {
    name?: string
    background: string
    currentRole?: string
    skillLevel: string
    subject: string
    goals: string
    timeAvailability: {
      totalWeeks: number
      sessionsPerWeek: number
      sessionLength: number
    }
    personalBackground: {
      background: string
      interests: string
      experiences: string
      goals: string
    }
  }
  customPrompt?: string
}

export interface SessionData {
  session_number: number
  title: string
  description: string
  learning_objectives: string[]
  overview: string
  recommended_readings: Array<{
    title: string
    description: string
    url?: string
  }>
  case_studies: Array<{
    title: string
    description: string
    example: string
  }>
  video_resources: Array<{
    title: string
    description: string
    url?: string
    duration?: string
  }>
  discussion_prompts: string[]
  ai_essay: string
  estimated_reading_time: number
  content_density: 'light' | 'moderate' | 'intensive'
  session_type: 'overview' | 'deep_dive' | 'practical' | 'review'
}

export interface GeneratedCurriculum {
  curriculum_overview: {
    title: string
    description: string
    total_sessions: number
    total_estimated_hours: number
    curriculum_type: 'crash_course' | 'standard' | 'comprehensive' | 'mastery'
    learning_outcomes: string[]
    content_density_profile: string
  }
  session_list: SessionData[]
}

export class AICurriculumGenerator {
  async generateSmartPrompt(request: CurriculumGenerationRequest): Promise<string> {
    try {
      const { userProfile } = request
      const { timeAvailability, personalBackground } = userProfile
      
      // Calculate total available sessions
      const totalSessions = timeAvailability.totalWeeks * timeAvailability.sessionsPerWeek
      const totalHours = (totalSessions * timeAvailability.sessionLength) / 60
      
      // Determine curriculum type based on session count
      let curriculumType = 'standard'
      if (totalSessions <= 5) curriculumType = 'crash_course'
      else if (totalSessions <= 15) curriculumType = 'standard'
      else if (totalSessions <= 30) curriculumType = 'comprehensive'
      else curriculumType = 'mastery'
      
      // Determine content density based on session length
      let contentDensity = 'moderate'
      if (timeAvailability.sessionLength <= 30) contentDensity = 'light'
      else if (timeAvailability.sessionLength >= 75) contentDensity = 'intensive'

      const prompt = `You are an expert curriculum designer. Create a comprehensive, detailed prompt that will be used to generate a personalized ${userProfile.subject} curriculum.

USER PROFILE:
- Name: ${userProfile.name || 'User'}
- Skill Level: ${userProfile.skillLevel}
- Subject: ${userProfile.subject}
- Learning Goals: ${userProfile.goals}

PERSONAL BACKGROUND:
- Background: ${personalBackground.background}
- Interests: ${personalBackground.interests}
- Relevant Experience: ${personalBackground.experiences}
- Goals & Aspirations: ${personalBackground.goals}

TIME AVAILABILITY:
- Total Weeks: ${timeAvailability.totalWeeks} weeks
- Sessions per Week: ${timeAvailability.sessionsPerWeek}
- Session Length: ${timeAvailability.sessionLength} minutes
- Total Sessions: ${totalSessions}
- Total Hours: ${totalHours.toFixed(1)} hours

CURRICULUM SPECIFICATIONS:
- Type: ${curriculumType} curriculum
- Content Density: ${contentDensity}

Create a detailed, well-structured prompt that:
1. Clearly defines the learning objectives based on the user's goals and skill level
2. Specifies the curriculum structure and pacing appropriate for their time availability
3. Incorporates their personal background and interests to make it relevant
4. Sets clear expectations for session content and progression
5. Includes specific instructions for the AI to follow when generating the curriculum

The prompt should be comprehensive yet concise, and ready to be used directly with an AI curriculum generation system.`

      // Add timeout to prevent long waits
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please try again')), 30000) // 30 second timeout
      })

      const responsePromise = openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert curriculum designer and educational consultant with decades of experience in creating personalized learning experiences. Create comprehensive, detailed prompts for AI curriculum generation systems that are rich in context, specific in instructions, and designed to produce high-quality, personalized curricula. Focus on clarity, specificity, actionable instructions, and pedagogical best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      })

      const response = await Promise.race([responsePromise, timeoutPromise]) as any

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content generated by AI')
      }

      return content.trim()
    } catch (error) {
      console.error('Error generating smart prompt:', error)
      throw new Error('Failed to generate smart prompt. Please try again.')
    }
  }

  private async generateCurriculumPrompt(request: CurriculumGenerationRequest): Promise<string> {
    const { userProfile } = request
    const { timeAvailability, personalBackground } = userProfile
    
    // Calculate total available sessions
    const totalSessions = timeAvailability.totalWeeks * timeAvailability.sessionsPerWeek
    const totalHours = (totalSessions * timeAvailability.sessionLength) / 60
    
    const prompt = `Create a simple ${userProfile.subject} syllabus for ${userProfile.skillLevel} learners.

BASIC INFO:
- Subject: ${userProfile.subject}
- Level: ${userProfile.skillLevel}
- Goals: ${userProfile.goals}
- Sessions: ${totalSessions} sessions, ${timeAvailability.sessionLength} minutes each

REQUIREMENTS:
- Create exactly ${totalSessions} sessions
- Each session needs: session_number, title, description (1-2 sentences)
- Keep descriptions brief and practical
- Make sessions build logically

RESPOND WITH ONLY VALID JSON:
{
  "syllabus": [
    {
      "session_number": 1,
      "title": "Introduction to ${userProfile.subject}",
      "description": "Learn the basics and get started with ${userProfile.subject}."
    }
  ]
}`

    return prompt
  }

  private async generateSessionPrompt(sessionData: Partial<SessionData>, userProfile: CurriculumGenerationRequest['userProfile']): Promise<string> {
    const prompt = `You are creating Session ${sessionData.session_number} of a ${userProfile.subject} curriculum for a ${userProfile.skillLevel} level learner.

SESSION CONTEXT:
- Title: ${sessionData.title}
- Duration: ${userProfile.timeAvailability.sessionLength} minutes
- Learning Objectives: ${sessionData.learning_objectives?.join(', ')}
- Content Density: ${sessionData.content_density}
- Session Type: ${sessionData.session_type}

USER BACKGROUND:
- Experience: ${userProfile.personalBackground.background}
- Interests: ${userProfile.personalBackground.interests}
- Goals: ${userProfile.goals}

ADAPTIVE REQUIREMENTS:
1. Create session materials that scale with available time:
   - Overview (proportional to session length)
   - Recommended Readings (scale: 2-3 for short, 5-7 for long)
   - Case Studies/Examples (scale: 1-2 for short, 3-5 for long)
   - Video Resources (scale: 0-1 for short, 2-3 for long)
   - Discussion Prompts (scale: 2-3 for short, 5-7 for long)
   - AI Essay (scale: ${userProfile.timeAvailability.sessionLength} × 15-20 words per minute)

2. The AI essay must:
   - Synthesize information from recommended readings
   - Be written for ${userProfile.skillLevel} level
   - Take appropriate time to read based on session length
   - Be practical and applicable
   - Include real-world examples and case studies
   - Match the content density level

3. Content density guidelines:
   - Light (15-30 min): Focus on key concepts, minimal examples
   - Moderate (45-60 min): Balanced theory and practice
   - Intensive (75+ min): Deep dive with extensive examples and analysis

OUTPUT FORMAT:
Return a JSON object with all session components properly structured and scaled.`

    return prompt
  }

  async generateCurriculum(request: CurriculumGenerationRequest): Promise<GeneratedCurriculum> {
    try {
      console.log('🎯 Starting curriculum generation...')
      const prompt = request.customPrompt || await this.generateCurriculumPrompt(request)
      
      // Log prompt length for debugging
      console.log('📝 Prompt length:', prompt.length, 'characters')
      console.log('📊 Estimated tokens:', Math.ceil(prompt.length / 4), 'tokens')
      
      const systemMessage = request.customPrompt 
        ? `You are an expert educational consultant. Generate a syllabus based on the provided custom prompt. Create a high-level syllabus with session titles and brief descriptions - not detailed curriculum content.

REQUIREMENTS:
- Respond with ONLY valid JSON in the exact format specified
- Create the exact number of sessions specified in the prompt
- Each session needs: session_number, title, description (2-3 sentences)
- Focus on practical, real-world applications
- Make content relevant to the learner's background and goals
- Design progressive learning that builds knowledge systematically`
        : `You are an expert educational consultant. Generate a high-level syllabus with session titles and brief descriptions - not detailed curriculum content.

REQUIREMENTS:
- Respond with ONLY valid JSON in the exact format specified
- Create the exact number of sessions specified in the prompt
- Each session needs: session_number, title, description (2-3 sentences)
- Focus on practical, real-world applications
- Make content relevant to the learner's background and goals
- Design progressive learning that builds knowledge systematically`

      console.log('🤖 Calling OpenAI API...')
      const startTime = Date.now()

      // Add timeout to prevent long waits
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please try again')), 60000) // 1 minute for syllabus generation
      })

      const responsePromise = openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      })

      const response = await Promise.race([responsePromise, timeoutPromise]) as any
      
      const endTime = Date.now()
      console.log('⏱️ API call completed in:', (endTime - startTime) / 1000, 'seconds')

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content generated by AI')
      }

      // Simple cleaning - just extract JSON from the response
      let jsonContent = content.trim()
      
      // Remove any text before the first { and after the last }
      const firstBrace = jsonContent.indexOf('{')
      const lastBrace = jsonContent.lastIndexOf('}')
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1)
      }
      
      console.log('Extracted JSON content:', jsonContent.substring(0, 200) + '...')

      // Parse the JSON response
      let parsedResponse = JSON.parse(jsonContent)
      
      // Handle different response formats
      let curriculum: GeneratedCurriculum
      if (parsedResponse.curriculum_overview && parsedResponse.session_list) {
        // Standard format
        curriculum = parsedResponse as GeneratedCurriculum
      } else if (parsedResponse.syllabus_overview && parsedResponse.sessions) {
        // New syllabus format
        curriculum = {
          curriculum_overview: parsedResponse.syllabus_overview,
          session_list: parsedResponse.sessions
        }
      } else if (parsedResponse.syllabus && Array.isArray(parsedResponse.syllabus)) {
        // Alternative syllabus format
        const sessions = parsedResponse.syllabus
        curriculum = {
          curriculum_overview: {
            title: parsedResponse.syllabus_overview?.title || `${request.userProfile.subject} Syllabus`,
            description: parsedResponse.syllabus_overview?.description || `A structured ${request.userProfile.subject} learning journey`,
            total_sessions: sessions.length,
            total_estimated_hours: (sessions.length * request.userProfile.timeAvailability.sessionLength) / 60,
            curriculum_type: 'syllabus',
            content_density_profile: 'moderate',
            learning_objectives: parsedResponse.syllabus_overview?.learning_objectives || ['Master core concepts', 'Apply practical skills'],
            prerequisites: ['Basic understanding'],
            target_audience: parsedResponse.syllabus_overview?.target_audience || `${request.userProfile.skillLevel} level learners`,
            key_topics: sessions.map((s: any) => s.title || s.topic).filter(Boolean)
          },
          session_list: sessions.map((session: any, index: number) => ({
            session_number: session.session_number || index + 1,
            title: session.title || `Session ${index + 1}`,
            description: session.description || 'Learning session',
            learning_objectives: session.learning_objectives || ['Learn key concepts'],
            key_concepts: session.key_concepts || ['Core concepts'],
            activities: session.activities || ['Practice exercises'],
            resources: session.resources || ['Study materials'],
            estimated_duration: session.estimated_duration || request.userProfile.timeAvailability.sessionLength,
            difficulty_level: session.difficulty_level || request.userProfile.skillLevel,
            session_type: session.session_type || 'overview'
          }))
        }
      } else if (parsedResponse.sessions && Array.isArray(parsedResponse.sessions)) {
        // Format with sessions array
        const sessions = parsedResponse.sessions
        curriculum = {
          curriculum_overview: {
            title: `${request.userProfile.subject} Curriculum`,
            description: `A comprehensive ${request.userProfile.subject} learning program`,
            total_sessions: sessions.length,
            total_estimated_hours: (sessions.length * request.userProfile.timeAvailability.sessionLength) / 60,
            curriculum_type: 'standard',
            content_density_profile: 'moderate',
            learning_objectives: ['Master key concepts', 'Apply practical skills'],
            prerequisites: ['Basic understanding'],
            target_audience: `${request.userProfile.skillLevel} level learners`,
            key_topics: sessions.map((s: any) => s.title || s.topic).filter(Boolean)
          },
          session_list: sessions.map((session: any, index: number) => ({
            session_number: session.session_number || index + 1,
            title: session.title || `Session ${index + 1}`,
            description: session.description || 'Learning session',
            learning_objectives: session.learning_objectives || ['Learn key concepts'],
            key_concepts: session.key_concepts || ['Core concepts'],
            activities: session.activities || ['Practice exercises'],
            resources: session.resources || ['Study materials'],
            estimated_duration: session.estimated_duration || request.userProfile.timeAvailability.sessionLength,
            difficulty_level: session.difficulty_level || request.userProfile.skillLevel,
            session_type: session.session_type || 'overview'
          }))
        }
      } else if (parsedResponse.curriculum && Array.isArray(parsedResponse.curriculum)) {
        // Alternative format with curriculum array
        const sessions = parsedResponse.curriculum
        curriculum = {
          curriculum_overview: {
            title: `${request.userProfile.subject} Curriculum`,
            description: `A comprehensive ${request.userProfile.subject} learning program`,
            total_sessions: sessions.length,
            total_estimated_hours: (sessions.length * request.userProfile.timeAvailability.sessionLength) / 60,
            curriculum_type: 'standard',
            content_density_profile: 'moderate',
            learning_objectives: ['Master key concepts', 'Apply practical skills'],
            prerequisites: ['Basic understanding'],
            target_audience: `${request.userProfile.skillLevel} level learners`,
            key_topics: sessions.map((s: any) => s.title || s.topic).filter(Boolean)
          },
          session_list: sessions.map((session: any, index: number) => ({
            session_number: session.session_number || index + 1,
            title: session.title || `Session ${index + 1}`,
            description: session.description || 'Learning session',
            learning_objectives: session.learning_objectives || ['Learn key concepts'],
            key_concepts: session.key_concepts || ['Core concepts'],
            activities: session.activities || ['Practice exercises'],
            resources: session.resources || ['Study materials'],
            estimated_duration: session.estimated_duration || request.userProfile.timeAvailability.sessionLength,
            difficulty_level: session.difficulty_level || request.userProfile.skillLevel,
            session_type: session.session_type || 'overview'
          }))
        }
      } else {
        console.error('Unexpected response format:', parsedResponse)
        throw new Error('Invalid curriculum structure generated')
      }
      
      // Validate the response
      if (!curriculum.curriculum_overview || !curriculum.session_list) {
        throw new Error('Invalid curriculum structure generated')
      }

      // Check for session count mismatch (indicates truncation)
      const expectedSessions = curriculum.curriculum_overview.total_sessions
      const actualSessions = curriculum.session_list.length
      
      if (expectedSessions && expectedSessions !== actualSessions) {
        console.warn(`Session count mismatch: expected ${expectedSessions}, got ${actualSessions}. This may indicate token limit truncation.`)
        
        // Update the total_sessions to match the actual session list
        curriculum.curriculum_overview.total_sessions = actualSessions
      }

      return curriculum
    } catch (error) {
      console.error('Error generating curriculum:', error)
      throw new Error('Failed to generate curriculum. Please try again.')
    }
  }

  async generateSession(sessionData: Partial<SessionData>, userProfile: CurriculumGenerationRequest['userProfile']): Promise<SessionData> {
    try {
      const prompt = await this.generateSessionPrompt(sessionData, userProfile)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert curriculum designer. You MUST respond with ONLY valid JSON. Do not include any comments, explanations, or text outside the JSON object. The response must start with { and end with }.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content generated by AI')
      }

      // Parse the JSON response
      const session = JSON.parse(content) as SessionData
      
      // Validate the response
      if (!session.title || !session.overview || !session.ai_essay) {
        throw new Error('Invalid session structure generated')
      }

      return session
    } catch (error) {
      console.error('Error generating session:', error)
      throw new Error('Failed to generate session. Please try again.')
    }
  }

  calculateReadingTime(essay: string): number {
    // Estimate reading time based on 250 words per minute
    const wordCount = essay.split(/\s+/).length
    return Math.ceil(wordCount / 250)
  }

  generateSessionFile(session: SessionData): string {
    const format = `📄 Session ${session.session_number}: ${session.title}

Overview

${session.overview}

Recommended Readings

${session.recommended_readings.map(reading => 
  `${reading.title}${reading.description ? `\n${reading.description}` : ''}${reading.url ? `\nLink` : ''}`
).join('\n\n')}

Case Studies / Examples

${session.case_studies.map(study => 
  `${study.title} – ${study.description}${study.example ? `\n\n${study.example}` : ''}`
).join('\n\n')}

Videos

${session.video_resources.map(video => 
  `🎥 ${video.title}${video.description ? ` – ${video.description}` : ''}${video.duration ? ` (${video.duration})` : ''}${video.url ? `\nWatch` : ''}`
).join('\n\n')}

Discussion Prompts

${session.discussion_prompts.map(prompt => `• ${prompt}`).join('\n')}

AI essay summarizing recommended readings, long and detailed enough that it takes 15 - 20 minutes to read:

${session.ai_essay}

Reading Time: This essay is approximately ${Math.ceil(session.ai_essay.split(/\s+/).length / 250)} minutes to read carefully.`

    return format
  }

  validateCurriculum(curriculum: GeneratedCurriculum): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!curriculum.curriculum_overview) {
      errors.push('Missing curriculum overview')
    }

    if (!curriculum.session_list || curriculum.session_list.length === 0) {
      errors.push('Missing or empty session list')
    }

    // Validate curriculum overview
    if (curriculum.curriculum_overview) {
      if (!curriculum.curriculum_overview.title) errors.push('Missing curriculum title')
      if (!curriculum.curriculum_overview.description) errors.push('Missing curriculum description')
      if (!curriculum.curriculum_overview.total_sessions) errors.push('Missing total sessions')
    }

    // Validate sessions (simplified validation)
    curriculum.session_list?.forEach((session, index) => {
      if (!session.title) errors.push(`Session ${index + 1}: Missing title`)
      if (!session.description) errors.push(`Session ${index + 1}: Missing description`)
      if (!session.learning_objectives || session.learning_objectives.length === 0) {
        errors.push(`Session ${index + 1}: Missing learning objectives`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const aiCurriculumGenerator = new AICurriculumGenerator()
