import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/supabase/admin-auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const user = await verifyAdminPassword(username, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create session token (in production, use JWT)
    const sessionToken = user.id;
    const cookieStore = await cookies();
    
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        barber_id: user.barber_id,
      },
    });
  } catch (error: any) {
    console.error("Auth error:", error);
    // Don't expose stack traces in production
    const isProduction = process.env.NODE_ENV === "production";
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        ...(isProduction ? {} : { details: error.stack })
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  
  return NextResponse.json({ success: true });
}
