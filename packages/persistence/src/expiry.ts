import { Timestamp } from "firebase-admin/firestore";

export const THIRTY_DAYS_MS = 30 * 86_400_000;

export function firestoreDeleteAt(referenceTime: string, offsetMs = THIRTY_DAYS_MS): Timestamp {
  const milliseconds = Date.parse(referenceTime);
  if (!Number.isFinite(milliseconds)) throw new Error("RETENTION_TIME_INVALID");
  return Timestamp.fromMillis(milliseconds + offsetMs);
}
