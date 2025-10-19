import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This gives us full access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params.id;

    if (!resumeId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume ID is required' 
      }, { status: 400 });
    }

    console.log('🗑️ Deleting resume:', resumeId);

    // First, get the resume record to find the cloud file name
    const { data: portfolioData, error: fetchError } = await supabaseAdmin
      .from('portfolio_data')
      .select('data')
      .eq('section', 'resumes')
      .single();

    if (fetchError) {
      console.error('Error fetching portfolio data:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch resume data' 
      }, { status: 500 });
    }

    const resumes = portfolioData?.data || [];
    const resumeToDelete = resumes.find((r: any) => r.id === resumeId);

    if (!resumeToDelete) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume not found' 
      }, { status: 404 });
    }

    // Delete from cloud storage if it's a cloud resume
    if (resumeToDelete.storageType === 'cloud' && resumeToDelete.cloudFileName) {
      console.log('☁️ Deleting cloud file:', resumeToDelete.cloudFileName);
      
      const { error: storageError } = await supabaseAdmin.storage
        .from('resumes')
        .remove([resumeToDelete.cloudFileName]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
        // Continue with database deletion even if storage fails
      } else {
        console.log('✅ Cloud file deleted successfully');
      }
    }

    // Remove from database
    const updatedResumes = resumes.filter((r: any) => r.id !== resumeId);
    
    const { error: updateError } = await supabaseAdmin
      .from('portfolio_data')
      .update({ 
        data: updatedResumes,
        updated_at: new Date().toISOString()
      })
      .eq('section', 'resumes');

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update database' 
      }, { status: 500 });
    }

    console.log('✅ Resume deleted successfully:', resumeId);

    return NextResponse.json({ 
      success: true, 
      message: 'Resume deleted successfully',
      deletedId: resumeId
    });

  } catch (error) {
    console.error('Delete resume error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}