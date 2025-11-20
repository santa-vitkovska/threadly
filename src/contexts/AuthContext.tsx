import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signUp as authSignUp, signIn as authSignIn, signOut as authSignOut, signInWithGoogle as authSignInWithGoogle } from '../lib/firebase/auth';
import { createUserProfile, getUserProfile, type UserProfile } from '../lib/firebase/firestore';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchProfile = async (uid: string) => {
    try {
      const userProfile = await getUserProfile(uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch profile when user is logged in
        await fetchProfile(currentUser.uid);
      } else {
        // Clear profile when user logs out
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, displayName: string) => {
    const newUser = await authSignUp(email, password, displayName);
    
    // Create user profile in Firestore
    const profileData: { displayName: string; avatar?: string; status: string } = {
      displayName: displayName || newUser.displayName || 'User',
      status: '',
    };

    // Only include avatar if it exists
    if (newUser.photoURL) {
      profileData.avatar = newUser.photoURL;
    }

    await createUserProfile(newUser.uid, profileData);

    // Fetch the newly created profile
    await fetchProfile(newUser.uid);
  };

  const signin = async (email: string, password: string) => {
    await authSignIn(email, password);
    // Profile will be fetched by the auth state listener
  };

  const handleSignInWithGoogle = async () => {
    const googleUser = await authSignInWithGoogle();
    
    // Check if profile exists, if not create one
    const existingProfile = await getUserProfile(googleUser.uid);
    if (!existingProfile) {
      const profileData: { displayName: string; avatar?: string; status: string } = {
        displayName: googleUser.displayName || 'User',
        status: '',
      };

      // Only include avatar if it exists
      if (googleUser.photoURL) {
        profileData.avatar = googleUser.photoURL;
      }

      await createUserProfile(googleUser.uid, profileData);
    }

    // Fetch profile
    await fetchProfile(googleUser.uid);
  };

  const signout = async () => {
    await authSignOut();
    // Profile will be cleared by the auth state listener
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signup,
    signin,
    signInWithGoogle: handleSignInWithGoogle,
    signout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

