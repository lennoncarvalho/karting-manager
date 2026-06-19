import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  getCurrentSession,
  login as loginFn,
  logout as logoutFn,
  changePassword as changePasswordFn,
  createAdmin as createAdminFn,
} from "@/lib/auth";

const AuthContext = createContext(null);

/**
 * Derives the user role from Supabase session metadata.
 * - admin:  app_metadata.role === 'admin' (set via migration / dashboard)
 * - driver: any other authenticated user whose email is in the drivers table
 */
function deriveRole(user) {
  if (!user) return { isAdmin: false, isDriver: false };
  const isAdmin = user.app_metadata?.role === "admin";
  return { isAdmin, isDriver: !isAdmin };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const session = await getCurrentSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { isAdmin, isDriver } = deriveRole(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isDriver,
        login: loginFn,
        logout: logoutFn,
        changePassword: changePasswordFn,
        createAdmin: createAdminFn,
        getCurrentSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
