import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  type User,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { getDocFromServer } from 'firebase/firestore';
import { UserProfile, SecurityLog } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  firestoreConnected: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateUserDisplayName: (name: string) => Promise<void>;
  recordSecurityLog: (event: string, status: 'success' | 'warning' | 'info', details: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(true);

  // Fetch or create user profile in Firestore safely without blocking app initialization
  const syncUserProfile = async (firebaseUser: User, customDisplayName?: string) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);
      const now = new Date().toISOString();
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const updated: UserProfile = {
          ...data,
          lastLoginAt: now,
          email: firebaseUser.email || data.email,
          displayName: customDisplayName || firebaseUser.displayName || data.displayName || 'Security User',
          photoURL: firebaseUser.photoURL || data.photoURL,
        };
        await setDoc(userDocRef, updated, { merge: true });
        setUserProfile(updated);
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: customDisplayName || firebaseUser.displayName || 'Equinova User',
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${firebaseUser.uid}`,
          role: 'user',
          createdAt: now,
          lastLoginAt: now,
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Could not sync Firestore profile:', err);
      // Fallback local profile so UI is never blocked
      setUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: customDisplayName || firebaseUser.displayName || 'Equinova User',
        photoURL: firebaseUser.photoURL || undefined,
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
    }
  };

  const recordSecurityLog = async (
    event: string,
    status: 'success' | 'warning' | 'info',
    details: string
  ) => {
    if (!user) return;
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newLog: SecurityLog = {
      id: logId,
      userId: user.uid,
      event,
      status,
      details,
      timestamp: new Date().toISOString(),
    };
    try {
      const logRef = doc(db, 'users', user.uid, 'logs', logId);
      await setDoc(logRef, newLog);
    } catch (err) {
      console.warn('Could not write security log to Firestore:', err);
    }
  };

  useEffect(() => {
    // Safety fallback: if onAuthStateChanged takes more than 1.5 seconds, unblock UI immediately
    const fallbackTimer = setTimeout(() => {
      setAuthReady(true);
      setLoading(false);
    }, 1200);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        clearTimeout(fallbackTimer);
        setUser(currentUser);
        setAuthReady(true);
        setLoading(false);

        if (currentUser) {
          // Sync profile in background without delaying authReady
          syncUserProfile(currentUser);
        } else {
          setUserProfile(null);
        }
      },
      (error) => {
        clearTimeout(fallbackTimer);
        console.error('onAuthStateChanged error:', error);
        setAuthReady(true);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await syncUserProfile(cred.user);
    // Security log
    if (cred.user) {
      const logId = `log_${Date.now()}`;
      try {
        await setDoc(doc(db, 'users', cred.user.uid, 'logs', logId), {
          id: logId,
          userId: cred.user.uid,
          event: 'EMAIL_LOGIN',
          status: 'success',
          details: `Authenticated via Email/Password credentials`,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Ignored
      }
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (cred.user) {
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      // Send email verification
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Verification email send notice:', e);
      }
      await syncUserProfile(cred.user, displayName);

      const logId = `log_${Date.now()}`;
      try {
        await setDoc(doc(db, 'users', cred.user.uid, 'logs', logId), {
          id: logId,
          userId: cred.user.uid,
          event: 'ACCOUNT_REGISTRATION',
          status: 'success',
          details: `User registered with email: ${email}`,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Ignored
      }
    }
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      await syncUserProfile(cred.user);
      const logId = `log_${Date.now()}`;
      try {
        await setDoc(doc(db, 'users', cred.user.uid, 'logs', logId), {
          id: logId,
          userId: cred.user.uid,
          event: 'GOOGLE_OAUTH_LOGIN',
          status: 'success',
          details: `User logged in via Google Identity provider`,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Ignored
      }
    }
  };

  const logout = async () => {
    if (user) {
      try {
        const logId = `log_${Date.now()}`;
        await setDoc(doc(db, 'users', user.uid, 'logs', logId), {
          id: logId,
          userId: user.uid,
          event: 'USER_LOGOUT',
          status: 'info',
          details: `User explicitly signed out of the session`,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Ignore
      }
    }
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const updateUserDisplayName = async (name: string) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName: name });
    setUser({ ...auth.currentUser });
    if (userProfile) {
      const updated = { ...userProfile, displayName: name };
      setUserProfile(updated);
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), { displayName: name }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    }
  };

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
      await syncUserProfile(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authReady,
        firestoreConnected,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        resendVerificationEmail,
        updateUserDisplayName,
        recordSecurityLog,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
