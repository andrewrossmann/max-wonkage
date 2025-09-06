# Database Schema

## 📊 Core Tables

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Curricula Table
```sql
CREATE TABLE curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  total_sessions INTEGER NOT NULL,
  session_duration INTEGER NOT NULL, -- in minutes
  skill_level VARCHAR(50) NOT NULL, -- beginner, intermediate, advanced
  goals TEXT,
  background TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, paused, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID REFERENCES curricula(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  objectives TEXT[],
  materials TEXT,
  resources JSONB DEFAULT '[]',
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Progress Table
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  curriculum_id UUID REFERENCES curricula(id) ON DELETE CASCADE,
  sessions_completed INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- in minutes
  current_streak INTEGER DEFAULT 0,
  last_session_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, curriculum_id)
);
```

### User Notes Table
```sql
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🏪 Expert Marketplace Tables

### Experts Table
```sql
CREATE TABLE experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  bio TEXT,
  credentials TEXT,
  hourly_rate_min DECIMAL(10,2) NOT NULL,
  hourly_rate_max DECIMAL(10,2) NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  languages TEXT[] DEFAULT '{}',
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  approval_date TIMESTAMP WITH TIME ZONE,
  total_sessions INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Expert Specialties Table
```sql
CREATE TABLE expert_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  proficiency_level VARCHAR(50) NOT NULL, -- beginner, intermediate, advanced, expert
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Expert Availability Table
```sql
CREATE TABLE expert_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  time_slots JSONB NOT NULL, -- array of time ranges
  timezone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
  meeting_link VARCHAR(500),
  session_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Session Feedback Table
```sql
CREATE TABLE session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  user_notes TEXT,
  expert_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Commissions Table
```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  expert_earnings DECIMAL(10,2) NOT NULL,
  platform_commission DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔍 Indexes and Constraints

### Performance Indexes
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Curriculum queries
CREATE INDEX idx_curricula_user_id ON curricula(user_id);
CREATE INDEX idx_curricula_status ON curricula(status);
CREATE INDEX idx_curricula_created_at ON curricula(created_at);

-- Session queries
CREATE INDEX idx_sessions_curriculum_id ON sessions(curriculum_id);
CREATE INDEX idx_sessions_session_number ON sessions(curriculum_id, session_number);

-- Progress tracking
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_curriculum_id ON user_progress(curriculum_id);

-- Expert queries
CREATE INDEX idx_experts_verification_status ON experts(verification_status);
CREATE INDEX idx_experts_average_rating ON experts(average_rating);
CREATE INDEX idx_expert_specialties_subject ON expert_specialties(subject);

-- Booking queries
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_expert_id ON bookings(expert_id);
CREATE INDEX idx_bookings_session_date ON bookings(session_date);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### Foreign Key Constraints
```sql
-- Ensure referential integrity
ALTER TABLE curricula ADD CONSTRAINT fk_curricula_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE sessions ADD CONSTRAINT fk_sessions_curriculum_id 
  FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE CASCADE;

ALTER TABLE user_progress ADD CONSTRAINT fk_user_progress_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_progress ADD CONSTRAINT fk_user_progress_curriculum_id 
  FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE CASCADE;
```

## 🔄 Data Relationships

### Core Platform Relationships
- **Users** → **Curricula** (One-to-Many)
- **Curricula** → **Sessions** (One-to-Many)
- **Users** → **User Progress** (One-to-Many)
- **Sessions** → **User Notes** (One-to-Many)

### Expert Marketplace Relationships
- **Users** → **Experts** (One-to-One, optional)
- **Experts** → **Expert Specialties** (One-to-Many)
- **Experts** → **Expert Availability** (One-to-Many)
- **Users** → **Bookings** (One-to-Many)
- **Experts** → **Bookings** (One-to-Many)
- **Bookings** → **Session Feedback** (One-to-One)
- **Bookings** → **Commissions** (One-to-One)

## 🚀 Database Optimization

### Query Optimization
- Use appropriate indexes for common queries
- Implement query caching for frequently accessed data
- Use connection pooling for better performance
- Optimize complex joins and aggregations

### Data Archiving
- Archive completed curricula after 2 years
- Archive old session data
- Implement data retention policies
- Regular cleanup of inactive accounts

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Cross-region backup replication
- Regular backup testing and validation
