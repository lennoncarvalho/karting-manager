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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
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
