import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkServerPermissions } from '@/lib/rbac';
import { UserService } from '@/services/database-adapter';
import { withMiddlewares } from '@/lib/api-middleware';

// PUT - Update user
export const PUT = withMiddlewares(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    // Check permissions
    const cookieStore = await cookies();
    const userSession = checkServerPermissions(cookieStore);

    if (!userSession || (userSession.userRole !== 'SuperAdmin' && userSession.userRole !== 'Admin')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to update users' },
        { status: 403 }
      );
    }

    const { id } = params;
    const updateData = await request.json();

    // Additional restriction: Admin cannot grant Admin or SuperAdmin roles
    if (userSession.userRole === 'Admin' && updateData.role && 
        (updateData.role === 'Admin' || updateData.role === 'SuperAdmin')) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to grant Admin or SuperAdmin roles' },
        { status: 403 }
      );
    }

    // Update user
    const updatedUser = await UserService.updateById(id, updateData);
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password field from response
    const { password, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      user: safeUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE - Delete user
export const DELETE = withMiddlewares(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    // Check permissions
    const cookieStore = await cookies();
    const userSession = checkServerPermissions(cookieStore);

    if (!userSession || (userSession.userRole !== 'SuperAdmin' && userSession.userRole !== 'Admin')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to delete users' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get user to check if it exists and get role
    const userToDelete = await UserService.getById(id);
    if (!userToDelete) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Additional restriction: Admin cannot delete Admin or SuperAdmin users
    if (userSession.userRole === 'Admin' && 
        (userToDelete.role === 'Admin' || userToDelete.role === 'SuperAdmin')) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete Admin or SuperAdmin users' },
        { status: 403 }
      );
    }

    // Prevent users from deleting themselves
    if (userSession.userName === userToDelete.fullName) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    const deleted = await UserService.deleteById(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET - Get single user
export const GET = withMiddlewares(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    // Check permissions
    const cookieStore = await cookies();
    const userSession = checkServerPermissions(cookieStore);

    if (!userSession || (userSession.userRole !== 'SuperAdmin' && userSession.userRole !== 'Admin')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view user details' },
        { status: 403 }
      );
    }

    const { id } = params;
    const user = await UserService.getById(id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password field from response
    const { password, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
