/**
 * Authentication Service
 * Handles admin login, logout, and session management
 * 
 * Reference: contracts/api-contracts.md → Authentication Endpoints
 * Reference: research.md → Authentication Implementation
 */

import { getSupabaseClient, handleApiError } from './api.js';

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
    
    // Verify user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id, email, is_first_admin')
      .eq('id', data.user.id)
      .single();
    
    if (adminError || !adminData) {
      // Logout if not an admin
      await supabase.auth.signOut();
      throw new Error('Access denied: Admin account required');
    }
    
    return {
      user: data.user,
      session: data.session,
      isFirstAdmin: adminData.is_first_admin
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
export async function isFirstAdmin() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('admins')
      .select('is_first_admin')
      .eq('id', user.id)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.is_first_admin === true;
  } catch (error) {
    console.error('Error checking first admin:', error);
    return false;
  }
}

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
    const isFirst = await isFirstAdmin();
    if (!isFirst) {
      throw new Error('Only the first admin can create new admin accounts');
    }
    
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }
    
    const currentUserId = session.user.id;
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError) {
      throw signUpError;
    }
    
    if (session && session.access_token && session.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
    }
    
    const newUserId = signUpData.user ? signUpData.user.id : null;
    if (!newUserId) {
      throw new Error('Admin user was created but missing user ID.');
    }
    
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .insert([
        {
          id: newUserId,
          email,
          is_first_admin: false,
          created_by: currentUserId
        }
      ])
      .select('*')
      .single();
    
    if (adminError) {
      throw adminError;
    }
    
    return adminData;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}
