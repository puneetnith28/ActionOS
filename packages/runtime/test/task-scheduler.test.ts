import { describe, expect, it, vi } from "vitest";
import type { CloudTasksClient } from "@google-cloud/tasks";
import { TaskScheduler } from "../src/task-scheduler";

describe("TaskScheduler", () => {
  it("uses a stable task name and treats ALREADY_EXISTS as deduplication", async () => {
    const client = {
      queuePath: () => "projects/demo/locations/us-central1/queues/cases",
      createTask: vi.fn().mockRejectedValue({ code: 6 })
    } as unknown as CloudTasksClient;
    const scheduler = new TaskScheduler(client, {
      projectId: "demo",
      location: "us-central1",
      queue: "cases",
      workerUrl: "https://dueback.test/api/internal/tasks/run-case",
      serviceAccountEmail: "tasks@demo.iam.gserviceaccount.com"
    });

    await expect(
      scheduler.scheduleCase({
        missionId: "case_1",
        expectedVersion: 2,
        wakeAt: "2026-08-15T12:00:00.000Z"
      })
    ).resolves.toMatchObject({ duplicate: true });
  });

  it("deduplicates inbound provider events with a separate worker URL", async () => {
    const client = {
      queuePath: () => "projects/demo/locations/us-central1/queues/cases",
      createTask: vi.fn().mockRejectedValue({ code: 6 })
    } as unknown as CloudTasksClient;
    const scheduler = new TaskScheduler(client, {
      projectId: "demo",
      location: "us-central1",
      queue: "cases",
      workerUrl: "https://dueback.test/api/internal/tasks/run-case",
      inboundWorkerUrl: "https://dueback.test/api/internal/tasks/process-inbound",
      serviceAccountEmail: "tasks@demo.iam.gserviceaccount.com"
    });
    await expect(scheduler.scheduleInbound({
      providerEventId: "event_123",
      providerEmailId: "email_123",
      eventType: "email.received",
      wakeAt: "2026-08-16T00:00:00.000Z"
    })).resolves.toMatchObject({ duplicate: true });
  });

  it("never schedules a fractional wake before its approved instant", async () => {
    let scheduledSeconds: number | undefined;
    const createTask = vi.fn((input: { task: { scheduleTime?: { seconds?: number | string | null } } }) => {
      scheduledSeconds = Number(input.task.scheduleTime?.seconds);
      return Promise.resolve([{ name: "task" }]);
    });
    const client = {
      queuePath: () => "projects/demo/locations/us-central1/queues/cases",
      createTask
    } as unknown as CloudTasksClient;
    const scheduler = new TaskScheduler(client, {
      projectId: "demo",
      location: "us-central1",
      queue: "cases",
      workerUrl: "https://dueback.test/api/internal/tasks/run-case",
      serviceAccountEmail: "tasks@demo.iam.gserviceaccount.com"
    });
    await scheduler.scheduleCase({
      missionId: "case_fractional",
      expectedVersion: 2,
      wakeAt: "2026-08-15T12:00:00.823Z"
    });
    expect(scheduledSeconds).toBe(1_786_795_201);
  });

  it("pins the OIDC audience independently from the worker path", async () => {
    let observedAudience: string | null | undefined;
    let observedServiceAccount: string | null | undefined;
    const createTask = vi.fn((input: {
      task: {
        httpRequest?: {
          oidcToken?: { audience?: string | null; serviceAccountEmail?: string | null } | null;
        } | null;
      };
    }) => {
      observedAudience = input.task.httpRequest?.oidcToken?.audience;
      observedServiceAccount = input.task.httpRequest?.oidcToken?.serviceAccountEmail;
      return Promise.resolve([{ name: "task" }]);
    });
    const client = {
      queuePath: () => "projects/demo/locations/us-central1/queues/cases",
      createTask
    } as unknown as CloudTasksClient;
    const scheduler = new TaskScheduler(client, {
      projectId: "demo",
      location: "us-central1",
      queue: "cases",
      workerUrl: "https://dueback.test/api/internal/tasks/run-case",
      serviceAccountEmail: "tasks@demo.iam.gserviceaccount.com",
      oidcAudience: "https://dueback.test"
    });
    await scheduler.scheduleCase({
      missionId: "case_oidc",
      expectedVersion: 1,
      wakeAt: "2026-08-15T12:00:00.000Z"
    });
    expect(createTask).toHaveBeenCalledOnce();
    expect(observedAudience).toBe("https://dueback.test");
    expect(observedServiceAccount).toBe("tasks@demo.iam.gserviceaccount.com");
  });
});
