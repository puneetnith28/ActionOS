export interface InboxIdentity {
  isAnonymous: boolean;
  email?: string;
}

export function emptyInboxPresentation(identity: InboxIdentity) {
  if (!identity.isAnonymous) {
    return {
      heading: "No active missions",
      message: identity.email
        ? `Signed in as ${identity.email}. This account does not have any active or historical missions.`
        : "You are signed in. This account does not have any active or historical missions.",
      showSignIn: false
    } as const;
  }
  return {
    heading: "No missions in this session",
    message: "Sign in to recover missions saved with Google, or define a new objective.",
    showSignIn: true
  } as const;
}
