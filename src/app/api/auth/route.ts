// API route for simple authentication
import { NextRequest, NextResponse } from 'next/server';

// Define the admin password directly
const ADMIN_PASSWORD = 'TryPa$$wordDadi@6563or129';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
    }

    console.log('Password received:', password); // Debug log
    console.log('Expected password:', ADMIN_PASSWORD); // Debug log
    
    // Simple direct comparison
    if (password === ADMIN_PASSWORD) {
      // Generate session token
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24); // 24 hours session
      
      const sessionData = {
        authenticated: true,
        expiry: expiry.toISOString(),
        loginTime: new Date().toISOString()
      };
      
      console.log('Authentication successful'); // Debug log
      
      return NextResponse.json({ 
        success: true, 
        token: btoa(JSON.stringify(sessionData))
      });
    } else {
      console.log('Authentication failed - password mismatch'); // Debug log
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}