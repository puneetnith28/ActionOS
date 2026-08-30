import { CloudTasksClient, protos } from "@google-cloud/tasks";
import { stableHash } from "@dueback/domain";

export interface TaskSchedulerConfig {
  readonly projectId: string;
  readonly location: string;
  readonly queue: string;
  readonly workerUrl: string;
  readonly analysisWorkerUrl?: string;
  readonly inboundWorkerUrl?: string;
  readonly serviceAccountEmail: string;
  readonly oidcAudience?: string;
}

export class TaskScheduler {
  constructor(
    private readonly client: CloudTasksClient,
    private readonly config: TaskSchedulerConfig
  ) {}

  async scheduleCase(input: {
    readonly caseId: string;
    readonly expectedVersion: number;
    readonly wakeAt: string;
    readonly correlationId?: string;
  }): Promise<{ taskName: string; duplicate: boolean }> {
    const parent = this.client.queuePath(
      this.config.projectId,
      this.config.location,
      this.config.queue
    );
    const correlationId =
      input.correlationId ??
      `corr_${stableHash({ namespace: "dueback/correlation/v1", caseId: input.caseId }).slice(7, 31)}`;
    const stableName = stableHash({ namespace: "dueback/task/v1", ...input }).slice(7, 39);
    const taskName = `${parent}/tasks/case-${stableName}`;
    const body = Buffer.from(
      JSON.stringify({
        caseId: input.caseId,
        expectedVersion: input.expectedVersion,
        correlationId
      })
    ).toString("base64");
    const task: protos.google.cloud.tasks.v2.ITask = {
      name: taskName,
      scheduleTime: { seconds: Math.ceil(Date.parse(input.wakeAt) / 1000) },
      httpRequest: {
        httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
        url: this.config.workerUrl,
        headers: { "Content-Type": "application/json" },
        body,
        oidcToken: {
          serviceAccountEmail: this.config.serviceAccountEmail,
          ...(this.config.oidcAudience ? { audience: this.config.oidcAudience } : {})
        }
      }
    };

    try {
      const [created] = await this.client.createTask({ parent, task });
      return { taskName: created.name ?? taskName, duplicate: false };
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code === 6) return { taskName, duplicate: true };
      throw error;
    }
  }

  async scheduleInbound(input: {
    readonly providerEventId: string;
    readonly providerEmailId: string;
    readonly eventType: string;
    readonly wakeAt: string;
  }): Promise<{ taskName: string; duplicate: boolean }> {
    if (!this.config.inboundWorkerUrl) throw new Error("INBOUND_WORKER_NOT_CONFIGURED");
    const parent = this.client.queuePath(
      this.config.projectId,
      this.config.location,
      this.config.queue
    );
    const stableName = stableHash({ namespace: "dueback/inbound-task/v1", ...input }).slice(7, 39);
    const taskName = `${parent}/tasks/inbound-${stableName}`;
    const task: protos.google.cloud.tasks.v2.ITask = {
      name: taskName,
      scheduleTime: { seconds: Math.ceil(Date.parse(input.wakeAt) / 1000) },
      httpRequest: {
        httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
        url: this.config.inboundWorkerUrl,
        headers: { "Content-Type": "application/json" },
        body: Buffer.from(JSON.stringify(input)).toString("base64"),
        oidcToken: {
          serviceAccountEmail: this.config.serviceAccountEmail,
          ...(this.config.oidcAudience ? { audience: this.config.oidcAudience } : {})
        }
      }
    };
    try {
      const [created] = await this.client.createTask({ parent, task });
      return { taskName: created.name ?? taskName, duplicate: false };
    } catch (error) {
      if ((error as { code?: number }).code === 6) return { taskName, duplicate: true };
      throw error;
    }
  }

  async scheduleAnalysis(input: {
    readonly jobId: string;
    readonly wakeAt: string;
  }): Promise<{ taskName: string; duplicate: boolean }> {
    if (!this.config.analysisWorkerUrl) throw new Error("ANALYSIS_WORKER_NOT_CONFIGURED");
    const parent = this.client.queuePath(
      this.config.projectId,
      this.config.location,
      this.config.queue
    );
    const stableName = stableHash({ namespace: "dueback/analysis-task/v1", ...input }).slice(7, 39);
    const taskName = `${parent}/tasks/analysis-${stableName}`;
    const task: protos.google.cloud.tasks.v2.ITask = {
      name: taskName,
      scheduleTime: { seconds: Math.ceil(Date.parse(input.wakeAt) / 1000) },
      httpRequest: {
        httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
        url: this.config.analysisWorkerUrl,
        headers: { "Content-Type": "application/json" },
        body: Buffer.from(JSON.stringify({ jobId: input.jobId })).toString("base64"),
        oidcToken: {
          serviceAccountEmail: this.config.serviceAccountEmail,
          ...(this.config.oidcAudience ? { audience: this.config.oidcAudience } : {})
        }
      }
    };
    try {
      const [created] = await this.client.createTask({ parent, task });
      return { taskName: created.name ?? taskName, duplicate: false };
    } catch (error) {
      if ((error as { code?: number }).code === 6) return { taskName, duplicate: true };
      throw error;
    }
  }
}
