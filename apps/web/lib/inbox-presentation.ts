export interface InboxIdentity {
  isAnonymous: boolean;
  email?: string;
}

export function emptyInboxPresentation(identity: InboxIdentity) {
  if (!identity.isAnonymous) {
    return {
      heading: "No follow-ups yet",
      message: identity.email
        ? `Signed in as ${identity.email}. This account does not have any follow-ups yet.`
        : "You are signed in. This account does not have any follow-ups yet.",
      showSignIn: false
    } as const;
  }
  return {
    heading: "No follow-ups in this session",
    message: "Sign in to recover cases saved with Google, or add a new company promise.",
    showSignIn: true
  } as const;
}
