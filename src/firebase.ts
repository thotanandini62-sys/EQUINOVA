import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  onSnapshot,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';

// Your web app's Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyD-E8Tzt2KU4dW3r39r1U4nNhCO62RfqB8",
  authDomain: "equinova-f9830.firebaseapp.com",
  projectId: "equinova-f9830",
  storageBucket: "equinova-f9830.firebasestorage.app",
  messagingSenderId: "330654153709",
  appId: "1:330654153709:web:da29507f853b31f0c885e4",
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Maps Firebase Auth error codes to user-friendly messages with recovery instructions
export function getFriendlyAuthErrorMessage(errorCode: string): { title: string; message: string; actionGuide?: string } {
  switch (errorCode) {
    case 'auth/operation-not-allowed':
      return {
        title: 'Sign-in Provider Not Enabled',
        message: 'This authentication provider is currently disabled in your Firebase console.',
        actionGuide: `Go to Firebase Console > Authentication > Sign-in method > Enable Email/Password or Google provider for project "${firebaseConfig.projectId}".`,
      };
    case 'auth/email-already-in-use':
      return {
        title: 'Account Already Exists',
        message: 'An account with this email address already exists. Please sign in or use password reset.',
      };
    case 'auth/invalid-email':
      return {
        title: 'Invalid Email Address',
        message: 'Please provide a valid and well-formed email address (e.g. name@example.com).',
      };
    case 'auth/weak-password':
      return {
        title: 'Weak Password',
        message: 'The password must be at least 6 characters long and include numbers or symbols for safety.',
      };
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return {
        title: 'Authentication Failed',
        message: 'Invalid email or password. Please verify your credentials and try again.',
      };
    case 'auth/popup-closed-by-user':
      return {
        title: 'Sign-in Cancelled',
        message: 'The Google authentication popup was closed before completing sign-in. Please try again.',
      };
    case 'auth/popup-blocked':
      return {
        title: 'Popup Window Blocked',
        message: 'Your browser blocked the sign-in popup. Please allow popups for this site.',
      };
    case 'auth/too-many-requests':
      return {
        title: 'Temporarily Locked',
        message: 'Access temporarily disabled due to multiple failed attempts. Please reset your password or try again later.',
      };
    case 'auth/network-request-failed':
      return {
        title: 'Network Issue',
        message: 'Unable to reach Firebase servers. Please verify your internet connection.',
      };
    case 'auth/requires-recent-login':
      return {
        title: 'Re-authentication Required',
        message: 'This sensitive security operation requires recent authentication. Please sign out and sign in again.',
      };
    default:
      return {
        title: 'Authentication Notice',
        message: errorCode.replace('auth/', '').replace(/-/g, ' ') || 'An unexpected error occurred during authentication.',
      };
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut as signOut,
  firebaseSendPasswordResetEmail as sendPasswordResetEmail,
  firebaseSendEmailVerification as sendEmailVerification,
  firebaseUpdateProfile as updateProfile,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  onSnapshot,
  deleteDoc,
  orderBy,
  type User,
};
