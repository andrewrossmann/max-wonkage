# 🧪 Test Data Feature

## Overview
A temporary testing feature that allows you to quickly populate the onboarding form with realistic test data, eliminating the need to manually fill out all fields during testing.

## How to Use

### 1. **Load Test Data**
- Navigate to the onboarding page (`/onboarding`)
- Look for the **"Load Test Data"** button in the top-right corner (only visible in development mode)
- Click the button to instantly populate all form fields with realistic test data

### 2. **Test Data Contents**
The test data includes:
- **Personal Background**: Software developer with 3 years experience
- **Interests**: Web development, machine learning, data science, etc.
- **Experiences**: React, Node.js, PostgreSQL, AWS, open source contributions
- **Goals**: Become senior full-stack developer, learn AI/ML integration
- **Time Availability**: 4 weeks, 5 sessions/week, 45 minutes each (20 total sessions)
- **Subject**: Advanced JavaScript and Modern Web Development
- **Skill Level**: Intermediate
- **Learning Goals**: Master advanced JS, learn Next.js/Vue.js, performance optimization

### 3. **Clear Test Data**
- Click the **"Test Data ON"** button (when active) to clear all fields
- Returns form to empty state for fresh testing

### 4. **Toggle States**
- **Gray Button**: "Load Test Data" - Click to populate form
- **Yellow Button**: "Test Data ON" - Click to clear form

## Development Only
- This feature only appears when `NODE_ENV === 'development'`
- Will not be visible in production builds
- Safe to leave in codebase for future testing

## Removal
When testing is complete, simply delete:
1. The `testData` object
2. The `useTestData` state
3. The `toggleTestData` function
4. The test data toggle button JSX

## Benefits
- ⚡ **Instant Testing**: No more manual form filling
- 🎯 **Realistic Data**: Uses comprehensive, realistic test data
- 🔄 **Easy Toggle**: Switch between test data and empty form
- 🧹 **Clean Removal**: Easy to remove when testing is done
