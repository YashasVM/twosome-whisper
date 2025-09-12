import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  nice_comment: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (name: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (name: string, password: string, niceComment: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  isAdmin: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  const logUsage = async (action: string) => {
    await supabase
      .from('usage_logs')
      .insert([{ 
        user_id: profile?.id || null, 
        action 
      }]);
  };

  useEffect(() => {
    // Check for stored session on app load
    const initializeAuth = async () => {
      try {
        const storedSession = localStorage.getItem('buddy-session');
        if (storedSession) {
          const session = JSON.parse(storedSession) as Session;
          
          // Verify session is still valid by checking if profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profile) {
            setSession(session);
            setUser(session.user);
            setProfile(profile);
          } else {
            // Clean up invalid session
            localStorage.removeItem('buddy-session');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('buddy-session');
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signUp = async (name: string, password: string, niceComment: string) => {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('name')
        .eq('name', name)
        .single();

      if (existingUser) {
        throw new Error('User already exists with this name');
      }

      // Create user with simple password hash (allows any password)
      const passwordHash = btoa(password); // Simple encoding - allows any password
      const userId = crypto.randomUUID();
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          user_id: userId,
          name,
          password_hash: passwordHash,
          nice_comment: niceComment
        }]);

      if (profileError) throw profileError;

      // Set user session manually
      const mockUser = {
        id: userId,
        email: `${name}@buddy.app`,
        created_at: new Date().toISOString(),
      } as User;

      const mockSession = {
        access_token: btoa(userId),
        refresh_token: btoa(`refresh_${userId}`),
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      } as Session;

      setUser(mockUser);
      setSession(mockSession);
      
      // Fetch and set profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profile) {
        setProfile(profile);
      }
      
      // Store session in localStorage for persistence
      localStorage.setItem('buddy-session', JSON.stringify(mockSession));
      
      await logUsage('signup');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (name: string, password: string) => {
    try {
      // Get user profile and verify password
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('name', name)
        .single();

      if (profileError || !profile) {
        throw new Error('User not found');
      }

      // Check password (simple comparison - no security requirements)
      const storedPasswordHash = profile.password_hash;
      const providedPasswordHash = btoa(password);

      if (storedPasswordHash !== providedPasswordHash) {
        throw new Error('Invalid password');
      }

      // Create mock user session
      const mockUser = {
        id: profile.user_id,
        email: `${name}@buddy.app`,
        created_at: profile.created_at,
      } as User;

      const mockSession = {
        access_token: btoa(profile.user_id),
        refresh_token: btoa(`refresh_${profile.user_id}`),
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      } as Session;

      setUser(mockUser);
      setSession(mockSession);
      setProfile(profile);
      
      // Store session in localStorage for persistence
      localStorage.setItem('buddy-session', JSON.stringify(mockSession));
      
      await logUsage('login');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await logUsage('logout');
    
    // Clear local state
    setUser(null);
    setSession(null);
    setProfile(null);
    
    // Clear stored session
    localStorage.removeItem('buddy-session');
  };

  const isAdmin = profile?.name === 'YashasVM';

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};