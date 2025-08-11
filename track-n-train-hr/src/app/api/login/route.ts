import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from 'bcryptjs';
import { UserService } from '@/services/database-adapter';
import { withMiddlewares } from '@/lib/api-middleware';

export const POST = withMiddlewares(async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials", success: false });
    }

    // Find user in MongoDB
    const user = await UserService.getByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Email not found", success: false });
    }

    console.log('🔍 Login attempt for:', email);
    console.log('👤 User found:', { fullName: user.fullName, role: user.role, zone: user.zone });

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Password verification failed for:', email);
      return NextResponse.json({ error: "Invalid password", success: false });
    }

    console.log('✅ Password verified for:', email);

    // Update last login
    await UserService.updateLastLogin(email);

    // Set cookies with proper configuration
    const cookieStore = await cookies();

    console.log('🍪 Setting cookies for user:', user.fullName);

    // Set user session cookies
    cookieStore.set("userName", user.fullName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    cookieStore.set("userEmail", user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Handle role mapping - keep the original role from database for consistency
    const normalizedRole = user.role;

    console.log('🔄 Role normalization:', {
      originalRole: user.role,
      normalizedRole,
      isSuperAdmin: normalizedRole === 'SuperAdmin'
    });

    // Set permissions based on role (handle both SuperAdmin variations)
    const isSuperAdmin = normalizedRole === 'SuperAdmin' || normalizedRole === 'Super Admin';
    const permissions = {
      canAddUsers: isSuperAdmin,
      canAddProfiles: isSuperAdmin,
      canViewAllProfiles: isSuperAdmin,
      canManageSystem: isSuperAdmin
    };

    cookieStore.set("userRole", normalizedRole, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    cookieStore.set("userPermissions", JSON.stringify(permissions), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    cookieStore.set("userZone", user.zone, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Set authentication flags (both for compatibility)
    cookieStore.set("isAuthenticated", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    cookieStore.set("isLoggedIn", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    console.log('🎉 Login successful for:', user.fullName);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        fullName: user.fullName,
        email: user.email,
        role: normalizedRole,
        zone: user.zone,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      success: false 
    }, { status: 500 });
  }
}, { rateLimit: { points: 10, duration: 60 } });

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    
    // Clear all authentication cookies
    const cookieNames = ["userName", "userEmail", "userRole", "userZone", "isAuthenticated", "isLoggedIn", "userPermissions"];
    
    cookieNames.forEach(name => {
      cookieStore.set(name, "", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0, // Expire immediately
        path: "/",
      });
    });

    return NextResponse.json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      success: false 
    }, { status: 500 });
  }
}
