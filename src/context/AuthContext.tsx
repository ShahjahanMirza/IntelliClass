import React, { useEffect, useState, createContext, useContext } from 'react';
import { supabase, signIn, signOut, getCurrentUser, getUserProfile, signUp, clearCachedData, getUserClasses } from '../utils/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  isTeacherForClass: (classId: string) => Promise<boolean>;
  isStudentInClass: (classId: string) => Promise<boolean>;
  canCreateClasses: () => boolean;
  canJoinClasses: () => boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with better error handling
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Session found, loading user profile...');
          await loadUserProfile(session.user);
        } else {
          console.log('No session found');
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        // If there's an error getting session, just proceed without user
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure Supabase is ready
    const timer = setTimeout(getInitialSession, 100);
    return () => clearTimeout(timer);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        try {
          if (session?.user) {
            await loadUserProfile(session.user);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          // Just clear user state, don't force reload
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading user profile for:', supabaseUser.id);

      // First, try to get the profile
      const { data: profile, error } = await getUserProfile(supabaseUser.id);

      if (error) {
        console.error('Error loading user profile:', error);

        // If profile doesn't exist, create it from auth metadata
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          console.log('Profile not found, creating from auth metadata...');

          const newUser = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User'
          };

          try {
            const { error: createError } = await supabase
              .from('users')
              .upsert(newUser, { onConflict: 'id' });

            if (!createError) {
              console.log('Profile created successfully');
              setUser(newUser);
              return;
            } else {
              console.error('Error creating profile:', createError);
            }
          } catch (createError) {
            console.error('Error creating user profile:', createError);
          }
        }

        // If we can't load or create profile, create a minimal user object
        console.log('Using minimal user object from auth data');
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User'
        });
        return;
      }

      if (profile) {
        console.log('Profile loaded successfully');
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar_url: profile.avatar_url
        });
      } else {
        // No profile data, create minimal user
        console.log('No profile data, using auth metadata');
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User'
        });
      }
    } catch (error) {
      console.error('Unexpected error loading profile:', error);
      // On any unexpected error, create minimal user from auth data
      console.log('Creating minimal user from auth data due to error');
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User'
      });
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (data.user) {
        await loadUserProfile(data.user);
      } else {
        throw new Error('No user data received');
      }
    } catch (error) {
      console.error('Login error:', error);
      setUser(null); // Clear any existing user state
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { data, error } = await signUp(email, password, name);
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      // For development, try to sign in immediately after signup
      if (data.user) {
        try {
          // Wait a moment for the user to be fully created
          await new Promise(resolve => setTimeout(resolve, 2000));
          await login(email, password);
        } catch (loginError) {
          console.log('Auto-login failed:', loginError);
          // Don't throw here, just inform user to login manually
          throw new Error('Account created successfully! Please try logging in.');
        }
      } else {
        throw new Error('Account creation failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  // Class-based permission checking functions
  const isTeacherForClass = async (classId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', classId)
        .eq('teacher_id', user.id)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error checking teacher status:', error);
      return false;
    }
  };

  const isStudentInClass = async (classId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', classId)
        .eq('user_id', user.id)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error checking student status:', error);
      return false;
    }
  };

  // General permission functions
  const canCreateClasses = () => !!user; // Any authenticated user can create classes
  const canJoinClasses = () => !!user; // Any authenticated user can join classes

  return <AuthContext.Provider value={{
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    isTeacherForClass,
    isStudentInClass,
    canCreateClasses,
    canJoinClasses
  }}>
      {children}
    </AuthContext.Provider>;
};