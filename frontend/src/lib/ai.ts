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
      totalDays: number
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
  private async generateCurriculumPrompt(request: CurriculumGenerationRequest): Promise<string> {
    const { userProfile } = request
    const { timeAvailability, personalBackground } = userProfile
    
    // Calculate total available hours
    const totalWeeks = timeAvailability.totalDays / 7
    const totalSessions = Math.floor(totalWeeks * timeAvailability.sessionsPerWeek)
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
    
    const prompt = `Create a personalized ${userProfile.subject} curriculum.

USER: ${userProfile.name || 'User'} - ${userProfile.skillLevel} level
GOALS: ${userProfile.goals}
BACKGROUND: ${personalBackground.background}
SESSIONS: ${totalSessions} sessions of ${timeAvailability.sessionLength} minutes each
TYPE: ${curriculumType} curriculum

RESPOND WITH ONLY VALID JSON - NO OTHER TEXT:

{
  "curriculum_overview": {
    "title": "Curriculum Title",
    "description": "Description",
    "total_sessions": ${totalSessions},
    "total_estimated_hours": ${totalHours.toFixed(1)},
    "curriculum_type": "${curriculumType}",
    "content_density_profile": "${contentDensity}",
    "learning_objectives": ["objective1", "objective2"],
    "prerequisites": ["prerequisite1"],
    "target_audience": "Target audience",
    "key_topics": ["topic1", "topic2"]
  },
  "session_list": [
    {
      "session_number": 1,
      "title": "Session Title",
      "description": "Session description",
      "learning_objectives": ["objective1"],
      "key_concepts": ["concept1"],
      "activities": ["activity1"],
      "resources": ["resource1"],
      "estimated_duration": ${timeAvailability.sessionLength},
      "difficulty_level": "beginner",
      "session_type": "overview"
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
      const prompt = await this.generateCurriculumPrompt(request)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
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
        temperature: 0.7,
        max_tokens: 4000,
      })

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

      // Parse the JSON response directly
      const curriculum = JSON.parse(jsonContent) as GeneratedCurriculum
      
      // Validate the response
      if (!curriculum.curriculum_overview || !curriculum.session_list) {
        throw new Error('Invalid curriculum structure generated')
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
        model: 'gpt-3.5-turbo',
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
        temperature: 0.7,
        max_tokens: 4000,
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
