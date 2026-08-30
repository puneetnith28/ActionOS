import { DurableWakeScheduler } from "@actionos/runtime/wake-outbox";
import type { TaskScheduler } from "@actionos/runtime/task-scheduler";
import { FirestoreWakeOutboxStore } from "@actionos/persistence/wake-outbox-store";
import { firestore } from "./firebase-admin";

export function durableCaseScheduler(tasks: TaskScheduler): DurableWakeScheduler {
  return new DurableWakeScheduler(
    tasks,
    new FirestoreWakeOutboxStore(firestore),
    () => new Date().toISOString()
  );
}
