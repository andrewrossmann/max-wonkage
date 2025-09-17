import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('API route called');
    const { email, name, expertiseAreas, experienceLevel, hourlyRateRange, availability, additionalInfo } = await request.json();
    console.log('Request data:', { email, name, expertiseAreas, experienceLevel, hourlyRateRange, availability, additionalInfo });

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Using the imported supabase client
    console.log('About to insert into database');

    // Insert the expert interest
    const { data, error } = await supabase
      .from('expert_interest')
      .insert({
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        expertise_areas: expertiseAreas || null,
        experience_level: experienceLevel || null,
        hourly_rate_range: hourlyRateRange || null,
        availability: availability || null,
        additional_info: additionalInfo || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // Handle duplicate email error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already on our expert waitlist' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to add email to waitlist', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Successfully added to expert waitlist',
        data: { id: data.id }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Expert interest API endpoint' },
    { status: 200 }
  );
}
