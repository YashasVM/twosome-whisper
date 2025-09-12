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
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
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
    // Initialize from localStorage without hitting Supabase (custom auth)
    const initializeAuth = () => {
      try {
        const storedSession = localStorage.getItem('buddy-session');
        const storedProfile = localStorage.getItem('buddy-profile');
        if (storedSession && storedProfile) {
          const session = JSON.parse(storedSession) as Session;
          const profile = JSON.parse(storedProfile) as Profile;
          setSession(session);
          setUser(session.user);
          setProfile(profile);
        } else {
          localStorage.removeItem('buddy-session');
          localStorage.removeItem('buddy-profile');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('buddy-session');
        localStorage.removeItem('buddy-profile');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);


  const signIn = async (name: string, password: string) => {
    try {
      // Local credential check (no Supabase auth needed)
      const creds = [
        { name: 'Yashas V M', password: 'ADMIN', id: '00000000-0000-0000-0000-000000000001', nice_comment: 'Admin user' },
        { name: 'Nireeksha (Chotu)', password: 'Buddu', id: '00000000-0000-0000-0000-000000000002', nice_comment: 'Buddu user' },
      ];

      const entry = creds.find((c) => c.name === name);
      if (!entry) throw new Error('User not found');
      if (password !== entry.password) throw new Error('Invalid password');

      const mockUser = {
        id: entry.id,
        email: `${name}@buddy.app`,
        created_at: new Date().toISOString(),
      } as User;

      const mockSession = {
        access_token: btoa(entry.id),
        refresh_token: btoa(`refresh_${entry.id}`),
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      } as Session;

      const mockProfile: Profile = {
        id: entry.id,
        user_id: entry.id,
        name: entry.name,
        nice_comment: entry.nice_comment,
        created_at: new Date().toISOString(),
      };

      setUser(mockUser);
      setSession(mockSession);
      setProfile(mockProfile);

      // Persist locally (no RLS checks)
      localStorage.setItem('buddy-session', JSON.stringify(mockSession));
      localStorage.setItem('buddy-profile', JSON.stringify(mockProfile));

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
    localStorage.removeItem('buddy-profile');
  };

  const isAdmin = profile?.name === 'Yashas V M';

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};