import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { checkServerPermissions } from '@/lib/rbac';
import { UserService, PersonnelRecordService } from '@/services/database-adapter';
import { withMiddlewares } from '@/lib/api-middleware';

export const POST = withMiddlewares(async (request: NextRequest) => {
  try {
    // Check permissions
    const cookieStore = await cookies();
    const userSession = checkServerPermissions(cookieStore);

    if (!userSession || !userSession.permissions.canAddUsers) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to add users' },
        { status: 403 }
      );
    }

    const { fullName, email, password, role, zone, position, phoneNumber, address } = await request.json();

    // Validation
    if (!fullName || !email || !password || !role || !zone) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await UserService.getByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const userData = {
      fullName,
      email,
      password: hashedPassword,
      role,
      zone,
      position,
      phoneNumber,
      address,
      isActive: true
    };

    // Save to MongoDB
    const newUser = await UserService.create(userData);
    
    if (!newUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to save user' },
        { status: 500 }
      );
    }

    // Return success (without password)
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { rateLimit: { points: 20, duration: 60 } });

export const GET = withMiddlewares(async (request: NextRequest) => {
  try {
    // Check if user is authenticated (for tagging functionality, all authenticated users should be able to see user list)
    const cookieStore = await cookies();
    const userSession = checkServerPermissions(cookieStore);

    if (!userSession) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔍 Users API: Authenticated user', userSession.userName, 'requesting user list');

    // Get all users from MongoDB
    const users = await UserService.getAll();
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map((user: any) => {
      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    });

    // Get personnel records for additional user info
    const personnelRecords = await PersonnelRecordService.getAll();

    return NextResponse.json({
      success: true,
      users: usersWithoutPasswords,
      personnelRecords: personnelRecords
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { rateLimit: { points: 60, duration: 60 } });
