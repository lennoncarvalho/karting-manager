/**
 * Authentication Service
 * Handles admin login, logout, and session management
 * 
 * Reference: contracts/api-contracts.md → Authentication Endpoints
 * Reference: research.md → Authentication Implementation
 */

import { getSupabaseClient, handleApiError } from './api.js';
import { APP_URL } from '../config.js';

/**
 * Login admin user with email and password
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<Object>} User session data
 */
export async function login(email, password) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw error;
    }

    return {
      user: data.user,
      session: data.session
    };
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

/**
 * Logout current user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

/**
 * Get current session
 * @returns {Promise<Object|null>} Current session or null
 */
export async function getCurrentSession() {
  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get current user
 * @returns {Promise<Object|null>} Current user or null
 */
export async function getCurrentUser() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return null;
    }
    
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Check if current user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * Check if current user is first admin
 * @returns {Promise<boolean>}
 */
/**
 * Change current user's password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export async function changePassword(newPassword) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

/**
 * Create new admin account (first admin only)
 * @param {string} email - New admin email
 * @param {string} password - New admin password
 * @returns {Promise<Object>} Created admin data
 */
export async function createAdmin(email, password) {
  try {
    const supabase = getSupabaseClient();
    const { data: { session: originalSession } } = await supabase.auth.getSession();
    
    if (!originalSession) {
      throw new Error('Not authenticated');
    }
    
    const currentUserId = originalSession.user.id;
    const originalTokens = {
      access_token: originalSession.access_token,
      refresh_token: originalSession.refresh_token
    };
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: APP_URL
      }
    });
    
    if (signUpError) {
      throw signUpError;
    }
    
    if (originalTokens.access_token && originalTokens.refresh_token) {
      await supabase.auth.setSession(originalTokens);
    }
    
    const { data: { session: restoredSession } } = await supabase.auth.getSession();
    if (!restoredSession || restoredSession.user.id !== currentUserId) {
      throw new Error('Admin session could not be restored.');
    }
    
    const newUserId = signUpData.user ? signUpData.user.id : null;
    if (!newUserId) {
      throw new Error('Admin user was created but missing user ID.');
    }

    return signUpData.user;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}
