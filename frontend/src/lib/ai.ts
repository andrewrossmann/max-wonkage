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
    url?: string | null
    duration?: string
    search_terms?: string
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
  // Generate image using DALL-E 3
  async generateImageForEssay(prompt: string): Promise<string | null> {
    try {
      console.log('Generating image with DALL-E 3:', prompt);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      });
      
      const imageUrl = response.data?.[0]?.url;
      console.log('DALL-E image generated successfully:', imageUrl);
      return imageUrl || null;
    } catch (error) {
      console.error('DALL-E generation failed:', error);
      return null;
    }
  }

  // Extract image prompts from essay content
  extractImagePrompts(essayContent: string): string[] {
    const imagePromptRegex = /\[IMAGE_PROMPT:\s*"([^"]+)"\]/g;
    const prompts: string[] = [];
    let match;
    
    while ((match = imagePromptRegex.exec(essayContent)) !== null) {
      prompts.push(match[1]);
    }
    
    console.log('Extracted image prompts:', prompts);
    return prompts;
  }

  // Replace image prompts with actual generated images
  async processEssayImages(essayContent: string): Promise<string> {
    const imagePrompts = this.extractImagePrompts(essayContent);
    let processedContent = essayContent;
    
    for (let i = 0; i < imagePrompts.length; i++) {
      const prompt = imagePrompts[i];
      const imageUrl = await this.generateImageForEssay(prompt);
      
      if (imageUrl) {
        // Replace the prompt with actual markdown image
        const promptPattern = `[IMAGE_PROMPT: "${prompt}"]`;
        const imageMarkdown = `![${prompt}](${imageUrl})`;
        processedContent = processedContent.replace(promptPattern, imageMarkdown);
        console.log(`Replaced image prompt ${i + 1} with generated image`);
      } else {
        // Remove the prompt if image generation failed
        const promptPattern = `[IMAGE_PROMPT: "${prompt}"]`;
        processedContent = processedContent.replace(promptPattern, '');
        console.log(`Removed failed image prompt ${i + 1}`);
      }
    }
    
    return processedContent;
  }

  async generateSmartPrompt(request: CurriculumGenerationRequest): Promise<string> {
    try {
      const { userProfile } = request
      const { timeAvailability, personalBackground } = userProfile
      
      // Calculate total available sessions
      const totalSessions = timeAvailability.totalWeeks * timeAvailability.sessionsPerWeek
      const totalHours = (totalSessions * timeAvailability.sessionLength) / 60
      
      // Determine curriculum type based on session count
      let curriculumType = 'standard'
      if (totalSessions === 1) curriculumType = 'crash_course'
      else if (totalSessions <= 5) curriculumType = 'crash_course'
      else if (totalSessions <= 15) curriculumType = 'standard'
      else if (totalSessions <= 30) curriculumType = 'comprehensive'
      else curriculumType = 'mastery'
      
      // Determine content density based on session length
      let contentDensity = 'moderate'
      if (timeAvailability.sessionLength <= 30) contentDensity = 'light'
      else if (timeAvailability.sessionLength >= 75) contentDensity = 'intensive'

      // Use user's preferred session structure from personalBackground.goals, or default if empty
      const sessionStructure = personalBackground.goals.trim() || `1) Written Essay
2) Case studies/examples
3) Optional video resources
4) References for further study
5) Discussion questions`

      const prompt = `You are an expert curriculum designer. Create a comprehensive, detailed prompt that will be used to generate a personalized ${userProfile.subject} curriculum.

USER PROFILE:
- Name: ${userProfile.name || 'User'}
- Skill Level: ${userProfile.skillLevel}
- Subject: ${userProfile.subject}
- Learning Goals: ${userProfile.goals}
- Session Structure Preference: ${sessionStructure}

PERSONAL BACKGROUND:
- Background: ${personalBackground.background}
- Interests: ${personalBackground.interests}
- Relevant Experience: ${personalBackground.experiences}
- Preferred Learning Style: ${personalBackground.goals}

TIME AVAILABILITY:
- Total Weeks: ${timeAvailability.totalWeeks} weeks
- Sessions per Week: ${timeAvailability.sessionsPerWeek}
- Session Length: ${timeAvailability.sessionLength} minutes
- Total Sessions: ${totalSessions}
- Total Hours: ${totalHours.toFixed(1)} hours

CURRICULUM SPECIFICATIONS:
- Type: ${curriculumType} curriculum
- Content Density: ${contentDensity}
- Single Session: ${totalSessions === 1 ? 'Yes - focus on essential concepts only' : 'No'}

Create a detailed, well-structured prompt that:
1. Clearly defines the learning objectives based on the user's goals and skill level
2. Specifies the curriculum structure and pacing appropriate for their time availability${totalSessions === 1 ? `
3. For this single-session course, focus on the most essential concepts and practical applications
4. Make it comprehensive but concise - cover the core material efficiently` : `
3. Incorporates their personal background and interests to make it relevant
4. Sets clear expectations for session content and progression`}
5. Includes specific instructions for the AI to follow when generating the curriculum

The prompt should be comprehensive yet concise, and ready to be used directly with an AI curriculum generation system.`

      // Add timeout to prevent long waits - longer timeout for production
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please try again')), 60000) // 60 second timeout for production
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
    
    // Use default session structure if goals field is empty
    const sessionStructure = userProfile.goals.trim() || `1) Written Essay
2) Case studies/examples
3) Optional video resources
4) References for further study
5) Discussion questions`

    const prompt = `Create a simple ${userProfile.subject} syllabus for ${userProfile.skillLevel} learners.

BASIC INFO:
- Subject: ${userProfile.subject}
- Level: ${userProfile.skillLevel}
- Goals: ${userProfile.goals}
- Session Structure: ${sessionStructure}
- Sessions: ${totalSessions} sessions, ${timeAvailability.sessionLength} minutes each
- Total Time: ${totalHours.toFixed(1)} hours

REQUIREMENTS:
- Create exactly ${totalSessions} sessions
- Each session needs: session_number, title, description (1-2 sentences)
- Keep descriptions brief and practical
- Make sessions build logically${totalSessions === 1 ? `
- This is a single-session course - focus on essential concepts only
- Make it comprehensive but concise for the time available` : ''}

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

  private async generateSessionStructurePrompt(sessionData: Partial<SessionData>, userProfile: CurriculumGenerationRequest['userProfile']): Promise<string> {
    const prompt = `You are creating Session ${sessionData.session_number} of a ${userProfile.subject} curriculum for a ${userProfile.skillLevel} level learner.

IMPORTANT: This session must be UNIQUE and focus specifically on the session's learning objectives. Generate the session structure with detailed metadata, readings, case studies, and resources.

SESSION CONTEXT:
- Title: ${sessionData.title}
- Duration: ${userProfile.timeAvailability.sessionLength} minutes
- Learning Objectives: ${sessionData.learning_objectives?.join(', ')}
- Content Density: ${sessionData.content_density}
- Session Type: ${sessionData.session_type}

USER BACKGROUND:
- Experience: ${userProfile.personalBackground.background}
- Interests: ${userProfile.personalBackground.interests}
- Learning Goals: ${userProfile.goals}
- Preferred Learning Style: ${userProfile.personalBackground.goals}

ADAPTIVE REQUIREMENTS:
1. Create session materials that scale with available time:
   - Overview (proportional to session length)
   - Recommended Readings (scale: 2-3 for short, 5-7 for long)
   - Case Studies/Examples (scale: 1-2 for short, 3-5 for long)
   - Video Resources (scale: 0-1 for short, 2-3 for long)
   - Discussion Prompts (scale: 2-3 for short, 5-7 for long)

2. Content density guidelines:
   - Light (15-30 min): Focus on key concepts, minimal examples
   - Moderate (45-60 min): Balanced theory and practice
   - Intensive (75+ min): Deep dive with extensive examples and analysis

3. VIDEO RESOURCES GUIDELINES:
   - DO NOT include specific URLs for videos as they often become outdated or unavailable
   - Instead, provide descriptive titles and detailed descriptions that help users find current content
   - Include search suggestions in the description (e.g., "Search for: 'machine learning basics TED talk'")
   - Focus on well-known platforms like YouTube, TED, Coursera, or Khan Academy
   - Include estimated duration when possible
   - Make titles specific enough to help with searches
   - IMPORTANT: Include platform hints in the description (e.g., "TED talk about..." or "YouTube video on...") to help the system show the correct search link

OUTPUT FORMAT:
Return a JSON object with the following exact structure:
{
  "session_number": ${sessionData.session_number},
  "title": "Session title",
  "description": "Brief session description",
  "learning_objectives": ["objective1", "objective2"],
  "overview": "Detailed session overview explaining what will be covered",
  "recommended_readings": [
    {
      "title": "Reading title",
      "description": "Reading description",
      "url": "https://www.amazon.com/s?k=book+title+author"
    }
  ],
  "case_studies": [
    {
      "title": "Case study title",
      "description": "Case study description",
      "example": "Detailed example"
    }
  ],
  "video_resources": [
    {
      "title": "Video title",
      "description": "Video description with search suggestions (e.g., 'Search for: specific terms on YouTube/TED')",
      "url": null,
      "duration": "optional_duration",
      "search_terms": "specific search terms to help find current content"
    }
  ],
  "discussion_prompts": ["prompt1", "prompt2"],
  "estimated_reading_time": ${userProfile.timeAvailability.sessionLength},
  "content_density": "${sessionData.content_density}",
  "session_type": "${sessionData.session_type}"
}

Make sure to include ALL required fields with appropriate content.`

    return prompt
  }

  private async generateEssayPrompt(sessionData: Partial<SessionData>, userProfile: CurriculumGenerationRequest['userProfile'], session: SessionData): Promise<string> {
    const prompt = `You are writing a comprehensive educational essay for Session ${sessionData.session_number} of a ${userProfile.subject} curriculum.

CRITICAL REQUIREMENT: Write a comprehensive, detailed essay of 3,000 - 4,000 words that serves as the complete learning material for this session. This is NOT a summary, overview, or outline - it is the COMPLETE ESSAY CONTENT that users will read for 45 minutes.

SESSION DETAILS:
- Title: ${session.title}
- Learning Objectives: ${session.learning_objectives?.join(', ')}
- Overview: ${session.overview}
- Case Studies: ${JSON.stringify(session.case_studies, null, 2)}

USER BACKGROUND:
- Experience: ${userProfile.personalBackground.background}
- Interests: ${userProfile.personalBackground.interests}
- Learning Goals: ${userProfile.goals}
- Preferred Learning Style: ${userProfile.personalBackground.goals}

ESSAY REQUIREMENTS:
Write a comprehensive, detailed essay of 3,000 - 4,000 words that covers:

IMPORTANT: Do NOT include reading references, book recommendations, or external resource lists in your essay content. These are handled separately in the session structure. Focus on creating comprehensive educational content that stands alone.

CRITICAL: Do NOT include "Alt text:" labels or descriptions in your essay content. When including images, use only the markdown syntax: ![brief description](image-url). Do not write "Alt text: [description]" as part of your essay text.

1. INTRODUCTION: Define key terms and concepts specific to this session's topic
2. DEEP DIVE: Explain the main concepts with detailed examples and analogies
3. PRACTICAL APPLICATIONS: Show how these concepts apply in real-world scenarios
4. CASE STUDY ANALYSIS: Deeply analyze the provided case studies with specific examples
5. STEP-BY-STEP GUIDES: Provide actionable frameworks or methodologies
6. COMMON PITFALLS: Explain what to avoid and why
7. NEXT STEPS: Connect to future learning and practical implementation

VISUAL ENHANCEMENT REQUIREMENTS:
To make the essay more engaging and easier to read, include rich visual elements throughout the text:

- **Images**: Include 1-2 relevant, high-quality images that illustrate key concepts, processes, or examples. Instead of using actual image URLs, use this special format: [IMAGE_PROMPT: "detailed description of the ideal image for this concept"]. Place these image prompts at natural break points in the content where images would enhance understanding. The prompts should be specific and descriptive, focusing on what visual would best illustrate the concept being discussed. Examples: [IMAGE_PROMPT: "A modern neural network diagram showing interconnected nodes and data flow"], [IMAGE_PROMPT: "A healthcare professional using AI technology to analyze medical data"]. DO NOT include actual image URLs or "Alt text:" labels in your essay content.
- **Tables**: Use well-formatted markdown tables to organize data, comparisons, and structured information
- **Code Examples**: Include relevant code snippets, formulas, and technical examples in \`\`\`code blocks
- **Visual Separators**: Use horizontal rules (---) and blockquotes to break up sections and highlight important information
- **Emojis and Icons**: Use relevant emojis (🚀, 💡, ⚠️, ✅, 📊, 🔧, etc.) to highlight key points and make content more engaging
- **Callout Boxes**: Use blockquotes with > symbols to create visual callouts for important tips, warnings, and key insights
- **Lists and Bullets**: Use numbered lists, bullet points, and nested lists to organize information clearly
- **Headers and Subheaders**: Use proper markdown headers (# ## ###) to create clear content hierarchy
- **Mermaid Diagrams**: Use Mermaid diagrams SPARINGLY - only for complex processes that truly benefit from visual representation (maximum 1 per essay)

Guidelines for visual elements:
- Include 1-2 relevant images that enhance understanding of key concepts. Use the special format [IMAGE_PROMPT: "detailed description"] instead of actual image URLs. The prompts should describe exactly what visual would best illustrate the concept being discussed.

IMAGE PROMPT GUIDELINES:
- Use the format: [IMAGE_PROMPT: "detailed description of the ideal image"]
- Be specific and descriptive about what the image should show
- Focus on educational value and relevance to the content
- Place prompts at natural break points where images would enhance understanding
- Examples: [IMAGE_PROMPT: "A flowchart showing the AI decision-making process"], [IMAGE_PROMPT: "A modern office with people collaborating using AI tools"]
- DO NOT include actual image URLs or "Alt text:" labels in your essay content
- Include 2-3 well-designed tables for data organization and comparisons
- Add 3-5 relevant code examples or technical snippets
- Use emojis strategically to make content more engaging and scannable
- Create visual callouts for important insights, tips, and warnings
- Use Mermaid diagrams only when absolutely necessary for complex workflows (maximum 1 per essay)
- Ensure all visual elements directly support the learning objectives
- **IMPORTANT**: Do NOT include any ASCII art, text-based diagrams, charts, or layouts using characters like |, -, +, *, or other symbols to create visual representations

IMAGE PLACEMENT STRATEGY:
- Place the first image after the introduction section to illustrate the main concept
- Place the second image (if used) in the middle of the essay to break up text and illustrate a key process or example
- Always include descriptive alt text that explains what the image shows and how it relates to the content
- Use images to break up long sections of text and improve readability

EDUCATIONAL IMAGE SOURCES (in order of preference):
1. **Source Material Images**: Use images from the actual sources you reference (papers, books, official documentation)
2. **Wikipedia/Wikimedia Commons**: High-quality, well-documented images with proper licensing
   - WORKING EXAMPLES:
     - Neural networks: https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Neural_network.svg/800px-Neural_network.svg.png
     - AI concepts: https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Artificial_neural_network.svg/800px-Artificial_neural_network.svg.png
     - Technology: https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Computer_science.svg/800px-Computer_science.svg.png
   - IMPORTANT: Use the full upload.wikimedia.org URLs, not wikipedia.org page URLs
3. **Educational Institutions**: University websites, research labs, academic departments
4. **Government/Public Domain**: Official government websites, public domain resources
5. **Open Educational Resources**: MIT OpenCourseWare, Khan Academy, educational platforms
6. **Professional Organizations**: IEEE, ACM, professional society websites
7. **Avoid**: Stock photo sites, generic photography, copyrighted commercial images

IMPORTANT: Always use complete, working URLs. Test that the image URL is accessible and returns an actual image file (jpg, png, svg, etc.). Do not use placeholder URLs or broken links. For Wikipedia images, use the direct upload.wikimedia.org URLs, not the wikipedia.org page URLs.

Each section must be fully developed with multiple paragraphs. This is the main content users will study for 45 minutes - make it comprehensive, educational, visually engaging, and directly relevant to the user's background and goals.

Write the actual essay content, not a summary or outline.`

    return prompt
  }

  private async generateSessionPrompt(sessionData: Partial<SessionData>, userProfile: CurriculumGenerationRequest['userProfile']): Promise<string> {
    const prompt = `You are creating Session ${sessionData.session_number} of a ${userProfile.subject} curriculum for a ${userProfile.skillLevel} level learner.

CRITICAL REQUIREMENT: The AI essay MUST be 3,000-4,000 words of comprehensive, detailed content. This is NOT a summary, overview, or outline - it is the COMPLETE ESSAY CONTENT that users will read for 45 minutes. Write the actual full essay with detailed explanations, examples, step-by-step processes, and practical guidance. DO NOT write "In this essay, we will..." - write the actual essay content.

IMPORTANT: This session must be UNIQUE and focus specifically on the session's learning objectives. The AI essay should be the CORE LEARNING MATERIAL that users study - not generic content, but detailed, specific content about the session's particular topics.

ESSAY REQUIREMENTS:
- Write a complete, detailed essay of 3000-4000 words
- Include multiple paragraphs with detailed explanations
- Provide specific examples and case studies
- Include step-by-step processes and methodologies
- Address the user's specific background and goals
- Make it educational and comprehensive
- This is the main learning material for a 45-minute session

SPECIFIC INSTRUCTIONS FOR THE AI ESSAY:
1. Start with a comprehensive introduction that defines key terms and concepts
2. Provide detailed explanations of the main concepts with multiple examples
3. Include step-by-step processes and methodologies
4. Analyze the case studies provided in detail
5. Discuss practical applications and real-world scenarios
6. Address common challenges and solutions
7. Provide actionable next steps and future learning opportunities
8. Each section must be fully developed with multiple paragraphs
9. The essay must be 3000-4000 words total
10. This is the main learning material for a 45-minute session

VISUAL ENHANCEMENT REQUIREMENTS:
To make the essay more engaging and easier to read, include rich visual elements throughout the text:

- **Images**: Include 1-2 relevant, high-quality images that illustrate key concepts, processes, or examples. Instead of using actual image URLs, use this special format: [IMAGE_PROMPT: "detailed description of the ideal image for this concept"]. Place these image prompts at natural break points in the content where images would enhance understanding. The prompts should be specific and descriptive, focusing on what visual would best illustrate the concept being discussed. Examples: [IMAGE_PROMPT: "A modern neural network diagram showing interconnected nodes and data flow"], [IMAGE_PROMPT: "A healthcare professional using AI technology to analyze medical data"]. DO NOT include actual image URLs or "Alt text:" labels in your essay content.
- **Tables**: Use well-formatted markdown tables to organize data, comparisons, and structured information
- **Code Examples**: Include relevant code snippets, formulas, and technical examples in \`\`\`code blocks
- **Visual Separators**: Use horizontal rules (---) and blockquotes to break up sections and highlight important information
- **Emojis and Icons**: Use relevant emojis (🚀, 💡, ⚠️, ✅, 📊, 🔧, etc.) to highlight key points and make content more engaging
- **Callout Boxes**: Use blockquotes with > symbols to create visual callouts for important tips, warnings, and key insights
- **Lists and Bullets**: Use numbered lists, bullet points, and nested lists to organize information clearly
- **Headers and Subheaders**: Use proper markdown headers (# ## ###) to create clear content hierarchy
- **Mermaid Diagrams**: Use Mermaid diagrams SPARINGLY - only for complex processes that truly benefit from visual representation (maximum 1 per essay)

Guidelines for visual elements:
- Include 1-2 relevant images that enhance understanding of key concepts. Use the special format [IMAGE_PROMPT: "detailed description"] instead of actual image URLs. The prompts should describe exactly what visual would best illustrate the concept being discussed.

IMAGE PROMPT GUIDELINES:
- Use the format: [IMAGE_PROMPT: "detailed description of the ideal image"]
- Be specific and descriptive about what the image should show
- Focus on educational value and relevance to the content
- Place prompts at natural break points where images would enhance understanding
- Examples: [IMAGE_PROMPT: "A flowchart showing the AI decision-making process"], [IMAGE_PROMPT: "A modern office with people collaborating using AI tools"]
- DO NOT include actual image URLs or "Alt text:" labels in your essay content
- Include 2-3 well-designed tables for data organization and comparisons
- Add 3-5 relevant code examples or technical snippets
- Use emojis strategically to make content more engaging and scannable
- Create visual callouts for important insights, tips, and warnings
- Use Mermaid diagrams only when absolutely necessary for complex workflows (maximum 1 per essay)
- Ensure all visual elements directly support the learning objectives
- **IMPORTANT**: Do NOT include any ASCII art, text-based diagrams, charts, or layouts using characters like |, -, +, *, or other symbols to create visual representations

IMAGE PLACEMENT STRATEGY:
- Place the first image after the introduction section to illustrate the main concept
- Place the second image (if used) in the middle of the essay to break up text and illustrate a key process or example
- Always include descriptive alt text that explains what the image shows and how it relates to the content
- Use images to break up long sections of text and improve readability

EDUCATIONAL IMAGE SOURCES (in order of preference):
1. **Source Material Images**: Use images from the actual sources you reference (papers, books, official documentation)
2. **Wikipedia/Wikimedia Commons**: High-quality, well-documented images with proper licensing
   - WORKING EXAMPLES:
     - Neural networks: https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Neural_network.svg/800px-Neural_network.svg.png
     - AI concepts: https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Artificial_neural_network.svg/800px-Artificial_neural_network.svg.png
     - Technology: https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Computer_science.svg/800px-Computer_science.svg.png
   - IMPORTANT: Use the full upload.wikimedia.org URLs, not wikipedia.org page URLs
3. **Educational Institutions**: University websites, research labs, academic departments
4. **Government/Public Domain**: Official government websites, public domain resources
5. **Open Educational Resources**: MIT OpenCourseWare, Khan Academy, educational platforms
6. **Professional Organizations**: IEEE, ACM, professional society websites
7. **Avoid**: Stock photo sites, generic photography, copyrighted commercial images

IMPORTANT: Always use complete, working URLs. Test that the image URL is accessible and returns an actual image file (jpg, png, svg, etc.). Do not use placeholder URLs or broken links. For Wikipedia images, use the direct upload.wikimedia.org URLs, not the wikipedia.org page URLs.

SESSION CONTEXT:
- Title: ${sessionData.title}
- Duration: ${userProfile.timeAvailability.sessionLength} minutes
- Learning Objectives: ${sessionData.learning_objectives?.join(', ')}
- Content Density: ${sessionData.content_density}
- Session Type: ${sessionData.session_type}

USER BACKGROUND:
- Experience: ${userProfile.personalBackground.background}
- Interests: ${userProfile.personalBackground.interests}
- Learning Goals: ${userProfile.goals}
- Preferred Learning Style: ${userProfile.personalBackground.goals}

ADAPTIVE REQUIREMENTS:
1. Create session materials that scale with available time:
   - Overview (proportional to session length)
   - Recommended Readings (scale: 2-3 for short, 5-7 for long)
   - Case Studies/Examples (scale: 1-2 for short, 3-5 for long)
   - Video Resources (scale: 0-1 for short, 2-3 for long)
   - Discussion Prompts (scale: 2-3 for short, 5-7 for long)
   - AI Essay (scale: ${userProfile.timeAvailability.sessionLength} × 15-20 words per minute = ${userProfile.timeAvailability.sessionLength * 15}-${userProfile.timeAvailability.sessionLength * 20} words minimum)

2. The AI essay must be the CORE LEARNING MATERIAL for this specific session:
   - Be comprehensive and detailed (3000-4000 words minimum)
   - Focus SPECIFICALLY on this session's unique topics and learning objectives
   - Be written for ${userProfile.skillLevel} level with appropriate depth
   - Take appropriate time to read based on session length
   - Be practical and applicable to the user's specific context and background
   - Include detailed explanations, step-by-step guides, and frameworks
   - Deeply analyze the case studies with specific examples and insights
   - Match the content density level with appropriate depth
   - Provide actionable insights, methodologies, and implementation strategies
   - Connect theory to practical applications relevant to the user's specific goals
   - Be UNIQUE to this session - not generic content that could apply to any session
   - Serve as the primary study material that users will reference and learn from
   - Include visual enhancements (diagrams, icons, tables, visual separators) to make content more engaging and easier to read

3. Content density guidelines:
   - Light (15-30 min): Focus on key concepts, minimal examples
   - Moderate (45-60 min): Balanced theory and practice
   - Intensive (75+ min): Deep dive with extensive examples and analysis

4. RECOMMENDED READINGS GUIDELINES:
   - ALWAYS include working URLs for recommended readings
   - For books: Use Amazon URLs (amazon.com) with the book's ASIN or ISBN
   - For academic papers: Use direct links to the paper (arXiv, PubMed, IEEE, ACM, etc.)
   - For articles: Use direct links to the source (news sites, blogs, official documentation)
   - For online resources: Use direct links to the resource (Wikipedia, official docs, etc.)
   - URLs should be complete and functional (start with https://)
   - Include search terms in the description to help users find the resource if the URL fails
   
   AMAZON URL REQUIREMENTS:
   - Use the format: https://www.amazon.com/dp/[ASIN] or https://www.amazon.com/dp/[ISBN]
   - ONLY use ASINs/ISBNs for books that you are CERTAIN exist on Amazon
   - If unsure about the exact ASIN/ISBN, use the search format: https://www.amazon.com/s?k=[book+title+author]
   - For search URLs, replace spaces with + and use the exact book title and author
   - Examples of reliable Amazon URLs:
     - Direct ASIN: "https://www.amazon.com/dp/0134685997" (for "Hands-On Machine Learning" by Aurélien Géron)
     - Search URL: "https://www.amazon.com/s?k=hands+on+machine+learning+aurélien+géron"
     - Direct ISBN: "https://www.amazon.com/dp/9780134685997" (for books with known ISBNs)
   
   OTHER RESOURCE EXAMPLES:
     - Papers: "https://arxiv.org/abs/1706.03762" (for "Attention Is All You Need")
     - Articles: "https://en.wikipedia.org/wiki/Machine_learning" (for Wikipedia articles)
     - Documentation: "https://scikit-learn.org/stable/user_guide.html" (for official docs)

5. VIDEO RESOURCES GUIDELINES:
   - DO NOT include specific URLs for videos as they often become outdated or unavailable
   - Instead, provide descriptive titles and detailed descriptions that help users find current content
   - Include search suggestions in the description (e.g., "Search for: 'machine learning basics TED talk'")
   - Focus on well-known platforms like YouTube, TED, Coursera, or Khan Academy
   - Include estimated duration when possible
   - Make titles specific enough to help with searches
   - Add search_terms field with specific search terms to help users find current content
   - IMPORTANT: Include platform hints in the description (e.g., "TED talk about..." or "YouTube video on...") to help the system show the correct search link

OUTPUT FORMAT:
Return a JSON object with the following exact structure. CRITICAL: The ai_essay field must contain 3000-4000 words of comprehensive content - this is the main learning material for the session.

IMPORTANT FOR RECOMMENDED READINGS:
- ALWAYS include working URLs for every recommended reading
- Use real, functional URLs that users can click to access the resources
- For books, use Amazon URLs with the actual book's ASIN or ISBN
- For academic papers, use direct links to the paper source
- For articles, use direct links to the source website
- Do NOT use placeholder URLs like "optional_url" or "example.com"
- Test that URLs are complete and functional (start with https://)

AMAZON URL ACCURACY:
- ONLY use direct ASIN/ISBN URLs if you are 100% certain the book exists with that identifier
- When in doubt, use Amazon search URLs: https://www.amazon.com/s?k=[book+title+author]
- Search URLs are more reliable than guessing ASINs/ISBNs
- Include the author's name in search URLs for better accuracy
- Example: "https://www.amazon.com/s?k=machine+learning+andrew+ng" instead of guessing an ASIN

EXAMPLE OF WHAT NOT TO DO (too short):
"In this essay, we will explore supervised learning concepts and applications. We will discuss classification and regression techniques, examine case studies, and provide practical guidance."

EXAMPLE OF WHAT TO DO (comprehensive):
"Supervised learning represents one of the most fundamental approaches in machine learning, where algorithms learn to make predictions based on labeled training data. Unlike unsupervised learning, which seeks patterns in unlabeled data, supervised learning requires both input features and corresponding output labels to train models effectively. This approach mirrors how humans learn from examples - when we teach a child to recognize animals, we show them pictures and tell them 'this is a cat' or 'this is a dog.' The child learns the patterns and can then identify new animals they haven't seen before. In machine learning, this process is automated through algorithms that can process vast amounts of data and identify complex patterns that might be invisible to human observers..."

The essay should be written like the second example - full, detailed content, not an outline.

REMEMBER: The ai_essay field must contain a complete, detailed essay of 3000-4000 words. This is the main learning material for a 45-minute session. Write the actual essay content, not a summary or outline.

CRITICAL: The ai_essay field must be a comprehensive, detailed essay of 3000-4000 words. This is NOT a summary or overview - it is the complete learning material that users will study for 45 minutes. Write the actual essay content with detailed explanations, examples, and practical guidance.

{
  "session_number": ${sessionData.session_number},
  "title": "Session title",
  "description": "Brief session description",
  "learning_objectives": ["objective1", "objective2"],
  "overview": "Detailed session overview explaining what will be covered",
  "recommended_readings": [
    {
      "title": "Reading title",
      "description": "Reading description",
      "url": "https://www.amazon.com/s?k=book+title+author"
    }
  ],
  "case_studies": [
    {
      "title": "Case study title",
      "description": "Case study description",
      "example": "Detailed example"
    }
  ],
  "video_resources": [
    {
      "title": "Video title",
      "description": "Video description with search suggestions (e.g., 'Search for: specific terms on YouTube/TED')",
      "url": null,
      "duration": "optional_duration",
      "search_terms": "specific search terms to help find current content"
    }
  ],
  "discussion_prompts": ["prompt1", "prompt2"],
  "ai_essay": "Write a comprehensive, detailed essay of 800-1200 words that serves as the complete learning material for this session. This must be a full, detailed essay with multiple paragraphs covering: 1) Introduction to the topic with clear definitions, 2) Detailed explanation of key concepts with examples, 3) Step-by-step processes and methodologies, 4) Real-world applications and case study analysis, 5) Practical frameworks and implementation strategies, 6) Common challenges and solutions, 7) Actionable next steps and future learning. Each section must be fully developed with multiple paragraphs. This is the main content users will study for 45 minutes - make it comprehensive, educational, and directly relevant to the user's background and goals. IMPORTANT: This must be 800-1200 words of actual essay content, not a summary or outline.",
  "estimated_reading_time": ${userProfile.timeAvailability.sessionLength},
  "content_density": "${sessionData.content_density}",
  "session_type": "${sessionData.session_type}"
}

Make sure to include ALL required fields with appropriate content.`

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
            curriculum_type: 'standard',
            content_density_profile: 'moderate',
            learning_outcomes: parsedResponse.syllabus_overview?.learning_objectives || ['Master core concepts', 'Apply practical skills']
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
            learning_outcomes: ['Master key concepts', 'Apply practical skills'],
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
            learning_outcomes: ['Master key concepts', 'Apply practical skills'],
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

  async generateSession(sessionData: Partial<SessionData>, userProfile: CurriculumGenerationRequest['userProfile'], onProgress?: (progress: number, message: string, stage?: string) => void): Promise<SessionData> {
    const startTime = Date.now()
    const estimatedTotalTime = 45000 // 45 seconds estimated total time
    
    try {
      console.log(`Generating session ${sessionData.session_number} for curriculum ${userProfile.subject}`)
      console.log('Session data received:', sessionData)
      console.log('User profile received:', userProfile)
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured')
      }
      console.log('OpenAI API key is available')
      
      // Progress: 5% - Initializing
      onProgress?.(5, 'Initializing session generation...', 'validating')
      
      // Note: Progress is now managed manually through specific stage calls
      
      // Progress: 10% - Preparing session structure
      onProgress?.(10, 'Preparing session structure...', 'generating_structure')
      
      // First, generate the basic session structure
      console.log('Generating session structure prompt...')
      const sessionPrompt = await this.generateSessionStructurePrompt(sessionData, userProfile)
      
      console.log('Session structure prompt length:', sessionPrompt.length)
      console.log('Session structure prompt preview:', sessionPrompt.substring(0, 200) + '...')
      
      // Progress: 20% - Prompt ready (milestone)
      onProgress?.(20, 'Session structure prompt prepared...', 'generating_structure')
      
      console.log('Calling OpenAI for session structure generation...')
      
      // Add timeout for session structure generation
      const structureTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session structure generation timeout')), 30000) // 30 second timeout
      })
      
      const sessionResponsePromise = openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert curriculum designer. Generate comprehensive learning session structures with detailed metadata, readings, case studies, and resources. Return valid JSON only.'
          },
          {
            role: 'user',
            content: sessionPrompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.7,
      })
      
      const sessionResponse = await Promise.race([sessionResponsePromise, structureTimeoutPromise]) as any
      
      console.log('Session structure generation completed')

      const sessionContent = sessionResponse.choices[0]?.message?.content
      if (!sessionContent) {
        throw new Error('No session content generated by AI')
      }

      // Progress: 40% - Structure complete (milestone)
      onProgress?.(40, 'Session structure generated successfully...', 'generating_structure')

      // Parse the JSON response
      console.log('Parsing session structure JSON...')
      let session: SessionData
      try {
        session = JSON.parse(sessionContent) as SessionData
        console.log('Session structure JSON parsed successfully')
      } catch (parseError) {
        console.error('Failed to parse session structure JSON:', parseError)
        console.error('Raw session content:', sessionContent)
        throw new Error(`Failed to parse session structure: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`)
      }
      
      console.log('AI generated session structure:', JSON.stringify(session, null, 2))
      
      // Progress: 50% - Preparing essay generation (milestone)
      onProgress?.(50, 'Preparing comprehensive essay generation...', 'generating_essay')
      
      // Now generate the comprehensive essay separately
      console.log('Generating essay prompt...')
      const essayPrompt = await this.generateEssayPrompt(sessionData, userProfile, session)
      
      console.log('Essay prompt length:', essayPrompt.length)
      console.log('Essay prompt preview:', essayPrompt.substring(0, 200) + '...')
      
      // Progress: 60% - Essay prompt ready (milestone)
      onProgress?.(60, 'Essay generation prompt prepared...', 'generating_essay')
      
      console.log('Calling OpenAI for essay generation with max_tokens: 16384...')
      
      // Add timeout for essay generation (longer since it's more complex)
      const essayTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Essay generation timeout')), 90000) // 90 second timeout
      })
      
      const essayResponsePromise = openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content writer. Write comprehensive, detailed essays that serve as the main learning material for educational sessions. Your essays should be 3,000-4,000 words of detailed, educational content with examples, explanations, and practical guidance.'
          },
          {
            role: 'user',
            content: essayPrompt
          }
        ],
        max_tokens: 16384,
        temperature: 0.7,
      })
      
      const essayResponse = await Promise.race([essayResponsePromise, essayTimeoutPromise]) as any
      
      console.log('Essay generation completed')

      const essayContent = essayResponse.choices[0]?.message?.content
      if (!essayContent) {
        throw new Error('No essay content generated by AI')
      }

      // Progress: 80% - Essay complete (milestone)
      onProgress?.(80, 'Essay content generated successfully...', 'generating_essay')

      // Progress: 85% - Processing images (milestone)
      onProgress?.(85, 'Generating custom images for essay...', 'generating_images')

      // Process images in the essay content
      console.log('Processing images in essay content...')
      const processedEssay = await this.processEssayImages(essayContent.trim())
      session.ai_essay = processedEssay
      
      // Check essay word count
      const wordCount = session.ai_essay.split(' ').length
      if (wordCount < 2000) {
        console.warn(`AI essay is too short (${wordCount} words), expected 3000-4000 words`)
      } else {
        console.log(`AI essay word count: ${wordCount} words`)
      }
      
      // Progress: 90% - Processing complete (milestone)
      onProgress?.(90, 'Processing and validating essay content...', 'generating_images')
      
      // Validate the response - be more lenient and provide defaults
      if (!session.title) {
        console.error('Missing title, using fallback')
        session.title = sessionData.title || `Session ${sessionData.session_number}`
      }
      
      if (!session.overview) {
        console.error('Missing overview, using description as fallback')
        session.overview = session.description || 'Session overview will be provided during the session.'
      }
      
      // Ensure arrays are present
      if (!session.learning_objectives) session.learning_objectives = []
      if (!session.recommended_readings) session.recommended_readings = []
      if (!session.case_studies) session.case_studies = []
      if (!session.video_resources) session.video_resources = []
      if (!session.discussion_prompts) session.discussion_prompts = []
      
      // Set defaults for other required fields
      if (!session.estimated_reading_time) session.estimated_reading_time = userProfile.timeAvailability.sessionLength
      if (!session.content_density) session.content_density = sessionData.content_density || 'moderate'
      if (!session.session_type) session.session_type = sessionData.session_type || 'overview'
      
      // Progress is now managed manually
      
      // Progress: 95% - Almost complete (milestone)
      onProgress?.(95, 'Session data finalized...', 'saving')
      
      // Progress: 100% - Complete (milestone)
      onProgress?.(100, 'Session with custom images completed!', 'complete')
      
      console.log('Session generation completed')
      return session
    } catch (error) {
      console.error('Error generating session:', error)
      
      // Handle specific timeout errors
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Session generation timed out. Please try again with a shorter session or try again later.')
      }
      
      // Handle OpenAI API errors
      if (error instanceof Error && error.message.includes('API')) {
        throw new Error('AI service temporarily unavailable. Please try again in a few minutes.')
      }
      
      // Handle other specific errors
      if (error instanceof Error) {
        throw new Error(`Session generation failed: ${error.message}`)
      }
      
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

Reading Time: This essay is approximately ${Math.ceil(session.ai_essay.split(/\s+/).length / 30)} minutes to read carefully.`

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
