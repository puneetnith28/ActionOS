import { DurableWakeScheduler } from "@dueback/runtime/wake-outbox";
import type { TaskScheduler } from "@dueback/runtime/task-scheduler";
import { FirestoreWakeOutboxStore } from "@dueback/persistence/wake-outbox-store";
import { firestore } from "./firebase-admin";

export function durableCaseScheduler(tasks: TaskScheduler): DurableWakeScheduler {
  return new DurableWakeScheduler(
    tasks,
    new FirestoreWakeOutboxStore(firestore),
    () => new Date().toISOString()
  );
}
