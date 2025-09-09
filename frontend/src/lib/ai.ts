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
    
    const prompt = `You are an expert curriculum designer specializing in creating highly personalized learning experiences for professionals across all industries and experience levels.

USER PROFILE:
- Name: ${userProfile.name || 'User'}
- Background: ${personalBackground.background}
- Current Role: ${userProfile.currentRole || 'Professional'}
- Experience Level: ${userProfile.skillLevel}
- Subject Interest: ${userProfile.subject}
- Learning Goals: ${userProfile.goals}
- Personal Interests: ${personalBackground.interests}
- Relevant Experience: ${personalBackground.experiences}
- Aspirations: ${personalBackground.goals}
- Time Availability: ${totalHours.toFixed(1)} hours total
- Session Preferences: ${timeAvailability.sessionLength} minutes per session
- Total Sessions: ${totalSessions} sessions
- Preferred Intensity: ${contentDensity}

ADAPTIVE TASK:
Create a personalized ${userProfile.subject} curriculum that perfectly fits the user's constraints and goals.

CALCULATION LOGIC:
- Total Sessions: ${totalSessions} sessions
- Content Density: ${contentDensity} (based on ${timeAvailability.sessionLength}-minute sessions)
- Progression Speed: Adjusted for ${userProfile.skillLevel} level with ${totalHours.toFixed(1)} total hours

REQUIREMENTS:
1. Each session must follow this format but adapt content density:
   - Session Overview (learning objectives)
   - Recommended Readings (scale: 2-3 for short sessions, 5-7 for long sessions)
   - Case Studies/Examples (scale: 1-2 for short sessions, 3-5 for long sessions)
   - Video Resources (scale: 0-1 for short sessions, 2-3 for long sessions)
   - Discussion Prompts (scale: 2-3 for short sessions, 5-7 for long sessions)
   - AI Essay (scale word count based on session length: ${timeAvailability.sessionLength} × 15-20 words per minute)

2. Content must be:
   - Relevant to ${userProfile.subject} and user's background
   - Appropriate for ${userProfile.skillLevel} level
   - Practical and applicable to user's role
   - Engaging for the user's industry/role

3. Progression must be:
   - Logical learning sequence
   - Building complexity appropriately
   - Connected to learning goals
   - Respecting time constraints

4. Adapt to curriculum type:
   - Crash Course (3-5 sessions): Focus on essentials, practical applications
   - Standard Course (6-15 sessions): Balanced theory and practice
   - Comprehensive Course (16-30 sessions): Deep theoretical foundation + extensive practice
   - Mastery Course (30+ sessions): Expert-level content with advanced applications

OUTPUT FORMAT:
Return a JSON object with:
- curriculum_overview (title, description, total_sessions, total_estimated_hours, curriculum_type, learning_outcomes, content_density_profile)
- session_list (array of session objects with appropriate density)

Each session object should have:
- session_number, title, description, learning_objectives, overview
- recommended_readings (array with title, description, optional url)
- case_studies (array with title, description, example)
- video_resources (array with title, description, optional url, optional duration)
- discussion_prompts (array of strings)
- ai_essay (scaled to session length)
- estimated_reading_time (in minutes)
- content_density, session_type

Ensure the JSON is valid and complete.`

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
            content: 'You are an expert curriculum designer. Always respond with valid JSON that matches the exact format specified in the prompt.'
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
      const curriculum = JSON.parse(content) as GeneratedCurriculum
      
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
            content: 'You are an expert curriculum designer. Always respond with valid JSON that matches the exact format specified in the prompt.'
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

    curriculum.session_list?.forEach((session, index) => {
      if (!session.title) errors.push(`Session ${index + 1}: Missing title`)
      if (!session.overview) errors.push(`Session ${index + 1}: Missing overview`)
      if (!session.ai_essay) errors.push(`Session ${index + 1}: Missing AI essay`)
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
