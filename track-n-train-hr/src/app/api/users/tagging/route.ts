import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkServerPermissions } from '@/lib/rbac';
import { UserService } from '@/services/database-adapter';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (for tagging functionality)
    const cookieStore = await cookies();
    const userSession = checkServerPermissions(cookieStore);

    if (!userSession) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔍 Tagging API: User', userSession.userName, 'requesting user list for tagging');

    // Get all users from database
    const users = await UserService.getAll();
    
    // Return only necessary information for tagging (no sensitive data)
    const taggingUsers = users.map((user: any) => ({
      fullName: user.fullName,
      role: user.role,
      zone: user.zone
    }));

    console.log('✅ Tagging API: Returning', taggingUsers.length, 'users for tagging');

    return NextResponse.json({
      success: true,
      users: taggingUsers
    });

  } catch (error) {
    console.error('❌ Tagging API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
