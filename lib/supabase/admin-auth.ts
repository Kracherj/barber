"use server";

import { createAdminClient } from "./admin-client";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "barber";

export interface AdminUser {
  id: string;
  username: string;
  role: UserRole;
  barber_id?: string;
  is_active: boolean;
}

/**
 * Verify admin password and return user if valid
 * Uses bcrypt for secure password comparison
 */
export async function verifyAdminPassword(
  username: string,
  password: string
): Promise<AdminUser | null> {
  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, username, role, barber_id, is_active, password_hash")
      .eq("username", username)
      .maybeSingle(); // Remove is_active check temporarily to debug

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    if (!data) {
      console.log("No user found with username:", username);
      return null;
    }

    // Check if user is active
    if (!data.is_active) {
      console.log("User is inactive:", username);
      return null;
    }

    // Verify password (handle both plain text migration and bcrypt)
    let isValid = false;
    if (data.password_hash && data.password_hash.startsWith("$2")) {
      // Bcrypt hash
      try {
        isValid = await bcrypt.compare(password, data.password_hash);
      } catch (bcryptError) {
        console.error("Bcrypt error:", bcryptError);
        // Fallback to plain text if bcrypt fails
        isValid = data.password_hash === password;
      }
    } else {
      // Plain text (migration period)
      isValid = data.password_hash === password;
    }

    if (!isValid) {
      console.log("Password mismatch for user:", username);
      return null;
    }

    // Update last login (don't fail if this errors)
    try {
      await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.id);
    } catch (updateError) {
      console.warn("Failed to update last_login:", updateError);
    }

    return {
      id: data.id,
      username: data.username,
      role: (data.role || "admin") as UserRole,
      barber_id: data.barber_id || undefined,
      is_active: data.is_active,
    };
  } catch (error: any) {
    console.error("verifyAdminPassword error:", error);
    throw error;
  }
}

/**
 * Check if user has admin role
 */
export async function requireAdmin(sessionToken: string): Promise<AdminUser> {
  // Verify session token
  const supabase = createAdminClient();
  
  // Decode session token (simplified - use JWT in production)
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, username, role, barber_id, is_active")
    .eq("id", sessionToken)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data || data.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return {
    id: data.id,
    username: data.username,
    role: data.role as UserRole,
    barber_id: data.barber_id || undefined,
    is_active: data.is_active,
  };
}

/**
 * Check if user has barber role (or admin)
 */
export async function requireBarberOrAdmin(
  sessionToken: string,
  barberId?: string
): Promise<AdminUser> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, username, role, barber_id, is_active")
    .eq("id", sessionToken)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Unauthorized");
  }

  // Admin can access everything
  if (data.role === "admin") {
    return {
      id: data.id,
      username: data.username,
      role: data.role as UserRole,
      barber_id: data.barber_id || undefined,
      is_active: data.is_active,
    };
  }

  // Barber can only access their own data
  if (data.role === "barber" && barberId && data.barber_id === barberId) {
    return {
      id: data.id,
      username: data.username,
      role: data.role as UserRole,
      barber_id: data.barber_id || undefined,
      is_active: data.is_active,
    };
  }

  throw new Error("Unauthorized: Access denied");
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
