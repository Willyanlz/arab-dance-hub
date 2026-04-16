import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>({
  user: null, session: null, loading: true, isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Initialize session and check admin role
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session) {
        setSession(session);
        setUser(session.user);
        await checkAdmin(session.user.id);
      }
      setLoading(false);
    };

    initializeAuth();

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      // Handle session changes synchronously; async operations are wrapped inside
      if (session) {
        handleSessionChange(session);
      } else {
        handleSessionChange(null);
      }
    });

    async function handleSessionChange(session) {
      if (session) {
        setLoading(true); // Indicate we are checking role
        setSession(session);
        setUser(session.user);
        await checkAdmin(session.user.id);
        setLoading(false);
      } else {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    }


    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  async function checkAdmin(userId: string) {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin');
    setIsAdmin(!!data && data.length > 0);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
