import { supabase, APP_URL } from "@/lib/supabase";
import * as Sentry from "@sentry/react";

export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user, session: data.session };
  } catch (error) {
    Sentry.captureException(error);
    throw new Error(error.message || "Login failed");
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    Sentry.captureException(error);
    throw new Error(error.message || "Logout failed");
  }
}

export async function getCurrentSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error getting session:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const session = await getCurrentSession();
    if (!session) return null;
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}

export async function isAuthenticated() {
  const session = await getCurrentSession();
  return session !== null;
}

export async function changePassword(newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  } catch (error) {
    Sentry.captureException(error);
    throw new Error(error.message || "Password change failed");
  }
}

export async function createAdmin(email, password) {
  try {
    const {
      data: { session: originalSession },
    } = await supabase.auth.getSession();
    if (!originalSession) throw new Error("Not authenticated");
    const currentUserId = originalSession.user.id;
    const originalTokens = {
      access_token: originalSession.access_token,
      refresh_token: originalSession.refresh_token,
    };
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: { emailRedirectTo: APP_URL },
      },
    );
    if (signUpError) throw signUpError;
    if (originalTokens.access_token && originalTokens.refresh_token) {
      await supabase.auth.setSession(originalTokens);
    }
    const {
      data: { session: restoredSession },
    } = await supabase.auth.getSession();
    if (!restoredSession || restoredSession.user.id !== currentUserId) {
      throw new Error("Admin session could not be restored.");
    }
    const newUserId = signUpData?.user?.id;
    if (!newUserId)
      throw new Error("Admin user was created but missing user ID.");
    return signUpData.user;
  } catch (error) {
    Sentry.captureException(error);
    throw new Error(error.message || "Admin creation failed");
  }
}
