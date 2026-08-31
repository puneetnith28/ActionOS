"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  linkWithPopup,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  type User
} from "firebase/auth";

interface FirebasePublicConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}
let configRequest: Promise<FirebasePublicConfig> | undefined;

export function recoverableAuthError(code: string, linking: boolean): string {
  if (linking && (code.includes("credential-already-in-use") || code.includes("email-already-in-use")))
    return "RECOVERABLE_ACCOUNT_ALREADY_EXISTS";
  if (code.includes("popup-closed") || code.includes("cancelled-popup"))
    return "RECOVERABLE_SIGN_IN_CANCELLED";
  return "RECOVERABLE_SIGN_IN_FAILED";
}

async function currentUser(): Promise<User | null> {
  const config = await publicConfig();
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  await auth.authStateReady();
  return auth.currentUser;
}

async function publicConfig(): Promise<FirebasePublicConfig> {
  configRequest ??= fetch("/api/config/firebase").then(async (response) => {
    if (!response.ok) throw new Error("PUBLIC_FIREBASE_CONFIG_UNAVAILABLE");
    return (await response.json()) as FirebasePublicConfig;
  });
  return configRequest;
}

export async function anonymousIdToken(): Promise<string> {
  const user = await currentUser();
  return user ? await user.getIdToken() : "";
}

export async function recoverableIdentity(): Promise<{
  isAnonymous: boolean;
  email?: string;
  name?: string;
  emailVerified: boolean;
}> {
  const user = await currentUser();
  if (!user) {
    return { isAnonymous: true, emailVerified: false };
  }
  return {
    isAnonymous: user.isAnonymous,
    emailVerified: user.emailVerified,
    ...(user.email ? { email: user.email } : {}),
    ...(user.displayName ? { name: user.displayName } : {})
  };
}

export async function linkCurrentIdentityWithGoogle(): Promise<{
  token: string;
  email?: string;
}> {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.isAnonymous) {
    return { token: await user.getIdToken(true), ...(user.email ? { email: user.email } : {}) };
  }
  try {
    const linked = await linkWithPopup(user, new GoogleAuthProvider());
    return {
      token: await linked.user.getIdToken(true),
      ...(linked.user.email ? { email: linked.user.email } : {})
    };
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    throw new Error(recoverableAuthError(code, true));
  }
}

export async function signInWithExistingGoogle(): Promise<{
  token: string;
  email?: string;
}> {
  const config = await publicConfig();
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  await auth.authStateReady();
  try {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    return {
      token: await credential.user.getIdToken(true),
      ...(credential.user.email ? { email: credential.user.email } : {})
    };
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    throw new Error(recoverableAuthError(code, false));
  }
}

export async function signInWithPassword(email: string, password: string): Promise<{
  token: string;
  email?: string;
}> {
  const config = await publicConfig();
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  await auth.authStateReady();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return {
    token: await credential.user.getIdToken(true),
    ...(credential.user.email ? { email: credential.user.email } : {})
  };
}

export async function signUpWithPassword(email: string, password: string, name: string): Promise<{
  token: string;
  email?: string;
}> {
  const config = await publicConfig();
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  await auth.authStateReady();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await sendEmailVerification(credential.user);
  return {
    token: await credential.user.getIdToken(true),
    ...(credential.user.email ? { email: credential.user.email } : {})
  };
}

export async function signOutUser(): Promise<void> {
  const config = await publicConfig();
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  await auth.authStateReady();
  await signOut(auth);
}

export async function reloadUser(): Promise<void> {
  const user = await currentUser();
  if (user) {
    await user.reload();
  }
}
