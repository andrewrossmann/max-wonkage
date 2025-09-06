# Curricoolio - Interactive SaaS Website Plan

## 🎯 Project Overview

**Curricoolio** is an AI-powered educational platform that creates personalized learning curricula optimized for users' available time and constraints. The platform transforms unexpected downtime into productive learning opportunities.

### Core Value Proposition
- **Personalized Learning**: AI-generated curricula tailored to time constraints, skill level, and interests
- **Opportunity Optimization**: Transform unexpected free time into productive learning
- **Flexible Structure**: Adaptable to any subject, duration, and commitment level

### Target Audience
People who like learning new things and find themselves with extra time they didn't expect (e.g., recovery periods, job transitions, sabbaticals).

### Key Problems Solved
1. Creates a very customized educational experience, optimized for individual user and time constraints
2. Something fun to do when unexpected free time becomes available
3. Makes it easier to level up

## 🏗️ Technical Architecture

### Frontend Stack
- **React/Next.js** - For interactive UI and server-side rendering
- **Tailwind CSS** - For responsive, modern design
- **Framer Motion** - For smooth animations and transitions
- **React Hook Form** - For complex form handling
- **Chart.js/Recharts** - For progress visualization

### Backend Stack
- **Node.js/Express** or **Python/FastAPI** - API development
- **PostgreSQL** - User data, curricula, progress tracking
- **Redis** - Session management and caching
- **OpenAI API** - AI curriculum generation
- **WebSocket** - Real-time progress updates

### Infrastructure
- **Vercel/Netlify** - Frontend hosting
- **Railway/Render** - Backend hosting
- **Supabase** - Database and auth (or custom auth)

### Additional Components for Expert Marketplace
- **Expert Management System**: Profiles, availability, rates, specialties
- **Booking System**: Calendar integration, session scheduling
- **Payment Processing**: Stripe/PayPal for commission handling
- **Video Integration**: Zoom/Google Meet API for session hosting
- **Rating/Review System**: Post-session feedback and ratings

## 🎨 Key Features & User Journey

### Phase 1: Curriculum Generation
1. **Onboarding Flow**
   - Welcome screen explaining the concept
   - Time availability input (days, session length, frequency)
   - Subject selection with search/autocomplete
   - Skill level assessment
   - Background/interest questionnaire
   - Goal setting

2. **AI Curriculum Generation**
   - Real-time syllabus creation with progress indicator
   - Detailed session breakdown with learning objectives
   - Resource recommendations (videos, articles, exercises)
   - Review and customization interface

### Phase 2: Learning Management
1. **User Dashboard**
   - Course overview with progress visualization
   - Upcoming sessions calendar
   - Achievement badges/milestones
   - Quick access to current session

2. **Session Interface**
   - Lesson materials display
   - Interactive checklists
   - Note-taking capabilities
   - Session completion tracking

3. **Progress Tracking**
   - Visual progress bars
   - Completion statistics
   - Time spent learning
   - Streak tracking

### Phase 3: Engagement Features
1. **Interactive Elements**
   - Periodic quizzes/assessments
   - AI chat for questions
   - Reflection prompts
   - Goal adjustment suggestions

2. **Social Features** (Future)
   - Share achievements
   - Community challenges
   - Peer learning groups

## 💰 Business Model

### Free Core Platform
- AI-generated curricula
- Progress tracking
- Basic learning management
- Session customization

### Premium Add-on: "Actual Intelligence"
- Live expert sessions with mentors, coaches, and subject matter experts
- Commission-based revenue model
- Expert marketplace with curated professionals
- Video conferencing integration

## 🎨 UI/UX Design Philosophy

### Design Principles
- **Clean & Minimal**: Focus on content, not distractions
- **Motivational**: Celebrate progress and achievements
- **Accessible**: Works well for users with varying abilities
- **Mobile-First**: Many users might be on tablets/phones

### Key Pages
1. **Landing Page** - Hero section with use cases, demo video
2. **Onboarding** - Multi-step form with progress indicator
3. **Dashboard** - Course overview, progress, next session
4. **Session View** - Lesson content, materials, completion
5. **Profile** - Settings, completed courses, achievements
6. **Expert Discovery** - Search and filter experts
7. **Expert Profile** - Detailed expert information and booking
8. **Booking Flow** - Session scheduling and payment
9. **Session Management** - Upcoming sessions and history

## 🚀 Development Phases

### Phase 1: Core Platform MVP (4-6 weeks)
- Basic onboarding flow
- AI curriculum generation
- Simple session tracking
- User authentication
- Basic dashboard

### Phase 2: Enhanced Learning Features (2-3 weeks)
- Progress visualization
- Note-taking
- Session customization
- Mobile optimization

### Phase 3: Expert Marketplace (4-5 weeks)
- Expert onboarding and profile creation
- Search and filtering system
- Booking calendar integration
- Payment processing setup
- Video session hosting

### Phase 4: Advanced Features (3-4 weeks)
- Interactive assessments
- AI chat integration
- Achievement system
- Advanced analytics
- Commission reporting dashboard

## 💡 Unique Interactive Elements

1. **Dynamic Curriculum Builder**
   - Real-time syllabus generation with live preview
   - Drag-and-drop session reordering
   - Difficulty adjustment sliders

2. **Smart Progress Tracking**
   - Adaptive pacing based on completion speed
   - Automatic session rescheduling
   - Learning pattern analysis

3. **Contextual Learning**
   - Time-of-day optimization
   - Energy level considerations
   - Break recommendations

## 🔧 Technical Implementation Details

### AI Integration
- Prompt engineering for curriculum generation
- Context management for user preferences
- Quality assurance for generated content
- Fallback options for API failures

### Data Management
- User profile storage
- Curriculum versioning
- Progress persistence
- Analytics collection

### Performance
- Lazy loading for course materials
- Caching for frequently accessed data
- Optimistic UI updates
- Offline capability for sessions

### Expert Marketplace Technical Considerations
- **Scalability**: Microservices architecture for expert marketplace
- **Real-time Updates**: WebSocket for availability changes
- **Caching Strategy**: Expert profiles, availability, rates
- **Load Balancing**: Handle video session traffic

### Security & Compliance
- **Expert Verification**: Background checks, credential verification
- **Payment Security**: PCI compliance for payment processing
- **Data Privacy**: GDPR compliance for international users
- **Session Recording**: Optional with consent

## 📊 Database Schema

### Core Tables
```sql
-- Users
users (
  id, email, password_hash, name,
  timezone, notification_preferences,
  created_at, updated_at
)

-- Curricula
curricula (
  id, user_id, title, subject,
  total_sessions, session_duration,
  skill_level, goals, background,
  status, created_at
)

-- Sessions
sessions (
  id, curriculum_id, session_number,
  title, objectives, materials,
  resources, completed_at, notes
)

-- Progress
user_progress (
  id, user_id, curriculum_id,
  sessions_completed, total_time_spent,
  current_streak, last_session_date
)
```

### Expert Marketplace Tables
```sql
-- Experts
experts (
  id, user_id, display_name, bio, credentials,
  hourly_rate_min, hourly_rate_max,
  timezone, languages, verification_status,
  approval_date, total_sessions, average_rating
)

-- Expert Specialties
expert_specialties (
  expert_id, subject, proficiency_level
)

-- Expert Availability
expert_availability (
  expert_id, day_of_week, time_slots, timezone
)

-- Bookings
bookings (
  id, user_id, expert_id, session_date,
  duration, status, payment_status,
  meeting_link, created_at
)

-- Session Feedback
session_feedback (
  booking_id, rating, review, user_notes,
  expert_notes, created_at
)

-- Commissions
commissions (
  booking_id, expert_earnings, platform_commission,
  payment_date, status
)
```

## 🔗 Integration Points

### Core Integrations
- **OpenAI API** - Curriculum generation
- **Authentication** - Supabase Auth or custom
- **Database** - PostgreSQL with Supabase or custom
- **File Storage** - AWS S3 or Supabase Storage

### Expert Marketplace Integrations
- **Calendar APIs**: Google Calendar, Outlook, Calendly
- **Video Platforms**: Zoom SDK, Google Meet API
- **Payment Systems**: Stripe Connect for marketplace payments
- **Communication**: Twilio for SMS, SendGrid for email

## 🎯 Success Metrics

### User Engagement
- Curriculum completion rates
- Session attendance
- Time spent learning
- User retention

### Business Metrics
- Expert session bookings
- Commission revenue
- Expert satisfaction ratings
- Platform growth rate

## 📝 Implementation Strategy

### Phase 1-2 Focus
Build solid foundation with expert features in mind:
- Design database schema to accommodate future expert features
- Create user profiles with expert session preferences
- Build modular components that can easily integrate expert features

### Phase 3 Expert Integration
- Expert onboarding and verification system
- Booking and payment infrastructure
- Video session management
- Commission tracking and reporting

### Key Technical Decisions
1. **Use Stripe Connect** for marketplace payments (handles commission splitting)
2. **Implement WebSocket** early for real-time features (availability, notifications)
3. **Design modular UI components** that can be reused for expert features
4. **Plan for international expansion** (timezone handling, currency support)

## 🚀 Getting Started

The project will begin with Phase 1: Core Platform MVP, focusing on:
1. Setting up the basic project structure
2. Creating the onboarding flow
3. Building the AI curriculum generation system
4. Designing the user dashboard

This approach ensures we build a solid foundation that can seamlessly integrate the expert marketplace when ready, while keeping the initial implementation focused and achievable.
