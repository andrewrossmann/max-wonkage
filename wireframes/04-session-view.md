# Session View Wireframe

## Main Session Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Session Header                                                              │
│ ┌─────────┐                    Session 9: Django Models & Databases        │
│ │  ← Back │                    Duration: 1 hour | Status: In Progress      │
│ └─────────┘                    Progress: 9 of 20 sessions (45%)            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Session Content                                                            │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ Learning Objectives                                                 │   │
│ │                                                                     │   │
│ │ By the end of this session, you will be able to:                   │   │
│ │ • Understand Django's ORM (Object-Relational Mapping)             │   │
│ │ • Create and manage database models                                │   │
│ │ • Set up relationships between models                              │   │
│ │ • Use Django's admin interface                                     │   │
│ │ • Perform database queries and migrations                          │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ Lesson Materials                                                    │   │
│ │                                                                     │   │
│ │ 1. Introduction to Django Models                                   │   │
│ │    Django models are Python classes that define the structure      │   │
│ │    of your database tables. Each model represents a table, and     │   │
│ │    each attribute represents a column.                             │   │
│ │                                                                     │   │
│ │    Example:                                                         │   │
│ │    ```python                                                       │   │
│ │    from django.db import models                                    │   │
│ │                                                                     │   │
│ │    class Post(models.Model):                                       │   │
│ │        title = models.CharField(max_length=200)                    │   │
│ │        content = models.TextField()                                │   │
│ │        created_at = models.DateTimeField(auto_now_add=True)        │   │
│ │    ```                                                             │   │
│ │                                                                     │   │
│ │ 2. Model Fields and Types                                          │   │
│ │    Django provides various field types for different data types.   │   │
│ │    Common field types include:                                     │   │
│ │    • CharField: For short text strings                             │   │
│ │    • TextField: For long text content                              │   │
│ │    • IntegerField: For whole numbers                               │   │
│ │    • DateTimeField: For date and time values                       │   │
│ │    • BooleanField: For true/false values                           │   │
│ │                                                                     │   │
│ │ 3. Model Relationships                                             │   │
│ │    Models can have relationships with each other:                  │   │
│ │    • One-to-One: Each record relates to exactly one other record   │   │
│ │    • One-to-Many: One record can relate to many others             │   │
│ │    • Many-to-Many: Records can relate to many others               │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Interactive Elements                                                       │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ Session Checklist                                                   │   │
│ │                                                                     │   │
│ │ ☐ Read through the lesson materials                                │   │
│ │ ☐ Complete the hands-on exercise                                   │   │
│ │ ☐ Take the knowledge check quiz                                    │   │
│ │ ☐ Review the additional resources                                  │   │
│ │ ☐ Add notes and reflections                                        │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ Hands-on Exercise                                                   │   │
│ │                                                                     │   │
│ │ Create a simple blog model with the following fields:              │   │
│ │ • title (CharField, max_length=200)                                │   │
│ │ • content (TextField)                                              │   │
│ │ • author (CharField, max_length=100)                               │   │
│ │ • created_at (DateTimeField, auto_now_add=True)                    │   │
│ │ • updated_at (DateTimeField, auto_now=True)                        │   │
│ │                                                                     │   │
│ │ ┌─────────────────┐    ┌─────────────────┐                        │   │
│ │ │  Show Solution  │    │  Mark Complete  │                        │   │
│ │ └─────────────────┘    └─────────────────┘                        │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Notes & Resources                                                          │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ Session Notes                                                       │   │
│ │                                                                     │   │
│ │ ┌─────────────────────────────────────────────────────────────┐     │   │
│ │ │ Add your notes, questions, or insights about this session: │     │   │
│ │ │                                                             │     │   │
│ │ │ Django models are really powerful for database management. │     │   │
│ │ │ The ORM makes it easy to work with databases without       │     │   │
│ │ │ writing raw SQL queries. I'm excited to learn more about   │     │   │
│ │ │ relationships between models.                              │     │   │
│ │ │                                                             │     │   │
│ │ │ ┌─────────────────┐    ┌─────────────────┐                │     │   │
│ │ │ │  Save Notes     │    │  Clear Notes    │                │     │   │
│ │ │ └─────────────────┘    └─────────────────┘                │     │   │
│ │ └─────────────────────────────────────────────────────────────┘     │   │
│ │                                                                     │   │
│ │ Additional Resources:                                               │   │
│ │ • Django Model Field Reference: https://docs.djangoproject.com/    │   │
│ │ • Django ORM Tutorial: https://tutorial.djangogirls.org/           │   │
│ │ • Database Design Best Practices: https://example.com/             │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Session Actions                                                            │
│                                                                             │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│ │  Previous       │    │  Complete       │    │  Next Session   │        │
│ │  Session        │    │  Session        │    │                 │        │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Mobile Session View

```
┌─────────────────────────┐
│ Session Header          │
│ ← Back  Session 9       │
│ Django Models &         │
│ Databases               │
│ 1 hour | In Progress    │
│ 9/20 sessions (45%)     │
└─────────────────────────┘

┌─────────────────────────┐
│ Learning Objectives     │
│                         │
│ By the end of this      │
│ session, you will be    │
│ able to:                │
│                         │
│ • Understand Django's   │
│   ORM                   │
│ • Create and manage     │
│   database models       │
│ • Set up relationships  │
│ • Use Django's admin    │
│   interface             │
│ • Perform database      │
│   queries               │
│                         │
│ ┌─────────────────┐     │
│ │  View Materials │     │
│ └─────────────────┘     │
└─────────────────────────┘

┌─────────────────────────┐
│ Session Checklist       │
│                         │
│ ☐ Read lesson materials│
│ ☐ Complete exercise     │
│ ☐ Take knowledge check  │
│ ☐ Review resources      │
│ ☐ Add notes             │
│                         │
│ ┌─────────────────┐     │
│ │  Mark Complete  │     │
│ └─────────────────┘     │
└─────────────────────────┘

┌─────────────────────────┐
│ Session Notes           │
│                         │
│ Add your notes,         │
│ questions, or insights: │
│                         │
│ Django models are       │
│ really powerful for     │
│ database management.    │
│ The ORM makes it easy   │
│ to work with databases  │
│ without writing raw     │
│ SQL queries.            │
│                         │
│ ┌─────────────────┐     │
│ │  Save Notes     │     │
│ └─────────────────┘     │
└─────────────────────────┘

┌─────────────────────────┐
│ Session Actions         │
│                         │
│ ┌─────────────────┐     │
│ │  Complete       │     │
│ │  Session        │     │
│ └─────────────────┘     │
│                         │
│ ┌─────────────────┐     │
│ │  Next Session   │     │
│ └─────────────────┘     │
└─────────────────────────┘
```

## Knowledge Check Modal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Knowledge Check: Django Models                            ✕ Close          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Question 1 of 5                                                           │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ What is the purpose of Django's ORM?                               │   │
│ │                                                                     │   │
│ │ ○ To create web pages                                              │   │
│ │ ○ To manage database operations without writing SQL                 │   │
│ │ ○ To handle user authentication                                    │   │
│ │ ○ To serve static files                                            │   │
│ │                                                                     │   │
│ │ ┌─────────────────┐    ┌─────────────────┐                        │   │
│ │ │  Previous       │    │      Next       │                        │   │
│ │ └─────────────────┘    └─────────────────┘                        │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Design Elements

### Content Organization
- **Clear hierarchy** with learning objectives first
- **Structured lesson materials** with numbered sections
- **Interactive elements** integrated throughout
- **Progress tracking** visible at all times

### Learning Tools
- **Checklist system** for session completion
- **Hands-on exercises** with solutions
- **Knowledge checks** to reinforce learning
- **Note-taking** capabilities

### Navigation
- **Previous/Next** session navigation
- **Breadcrumb** showing current position
- **Quick access** to related resources
- **Session completion** tracking

### Mobile Optimization
- **Stacked layout** for mobile screens
- **Touch-friendly** interactive elements
- **Swipe gestures** for navigation
- **Collapsible sections** to save space

### Interactive Features
- **Real-time progress** updates
- **Auto-save** for notes and progress
- **Hover states** on interactive elements
- **Loading states** for async operations
