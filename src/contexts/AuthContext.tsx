import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Profile {
  id: string;
  name: string;
  nice_comment: string;
  created_at: string;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (name: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
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
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('auth_user');
    const savedProfile = localStorage.getItem('auth_profile');
    
    if (savedUser && savedProfile) {
      const parsedUser = JSON.parse(savedUser);
      const parsedProfile = JSON.parse(savedProfile);
      setUser(parsedUser);
      setProfile(parsedProfile);
      setIsAdmin(parsedProfile.name === 'Yashas V M');
    }
    setLoading(false);
  }, []);

  const signIn = async (name: string, password: string) => {
    try {
      // Predefined users with passwords
      const users = {
        'Yashas V M': { password: 'ADMIN', isAdmin: true },
        'Nireeksha (Chotu)': { password: 'Buddu', isAdmin: false }
      };

      const userData = users[name as keyof typeof users];
      if (!userData || userData.password !== password) {
        return { error: new Error('Invalid credentials') };
      }

      const newProfile: Profile = {
        id: name === 'Yashas V M' ? 'yashas-vm' : 'nireeksha-chotu',
        name: name,
        nice_comment: name === 'Yashas V M' ? 'Admin user' : 'Buddu user',
        created_at: new Date().toISOString(),
      };

      localStorage.setItem('auth_user', JSON.stringify({ uid: newProfile.id }));
      localStorage.setItem('auth_profile', JSON.stringify(newProfile));
      setUser({ uid: newProfile.id });
      setProfile(newProfile);
      setIsAdmin(name === 'Yashas V M');

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_profile');
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};