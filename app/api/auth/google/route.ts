import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/client';
import { z } from 'zod';

const GoogleAuthSchema = z.object({
  credential: z.string(),
});

// Google token verification
async function verifyGoogleToken(token: string) {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    const data = await response.json();
    
    // Verify the token is for our app
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (data.aud !== clientId) {
      throw new Error('Token audience mismatch');
    }

    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      email_verified: data.email_verified,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Failed to verify Google token');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = GoogleAuthSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const { credential } = validation.data;

    // Verify Google token
    const googleUser = await verifyGoogleToken(credential);

    if (!googleUser.email_verified) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 401 }
      );
    }

    // Check if user exists
    let user;
    try {
      user = await prisma.user.findFirst({
        where: { email: googleUser.email },
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Database connection error. Please try again.' },
        { status: 503 }
      );
    }

    // Create user if doesn't exist
    if (!user) {
      try {
        // Generate username from email
        const username = googleUser.email.split('@')[0] + '_' + Date.now().toString().slice(-4);
        
        user = await prisma.user.create({
          data: {
            username: username,
            email: googleUser.email,
            password: '', // No password for Google auth users
            role: 'user', // Default role
          },
        });

        console.log(`[Auth] New Google user created: ${user.email}`);
      } catch (createError) {
        console.error('User creation error:', createError);
        return NextResponse.json(
          { error: 'Failed to create user account. Please try again.' },
          { status: 503 }
        );
      }
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        picture: googleUser.picture,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
