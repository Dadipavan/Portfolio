// API route for secure authentication
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Get admin password hash from environment variables
function getAdminPasswordHash(): string {
  // Temporarily hardcode the correct hash to bypass env variable issues
  const correctHash = '$2a$10$c27fGNjiXOK/ltKCyyV1keqpDQq6b51M2sqEpEA91/ailvFHK8R9m';
  
  const hash = process.env.ADMIN_PASSWORD_HASH;
  console.log('Environment hash:', hash); // Debug log
  console.log('Using hardcoded hash:', correctHash); // Debug log
  
  // Use hardcoded hash for now
  return correctHash;
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
    }

    const hash = getAdminPasswordHash();
    console.log('Using hash for comparison:', hash); // Debug log
    console.log('Password received:', password); // Debug log
    
    const isValid = await bcrypt.compare(password, hash);
    console.log('Password validation result:', isValid); // Debug log
    
    if (isValid) {
      // Generate session token
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24); // 24 hours session
      
      const sessionData = {
        authenticated: true,
        expiry: expiry.toISOString(),
        loginTime: new Date().toISOString()
      };
      
      return NextResponse.json({ 
        success: true, 
        token: btoa(JSON.stringify(sessionData))
      });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}