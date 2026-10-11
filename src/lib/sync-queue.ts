import type { DB } from "./database";
export type SyncStatus = "saved" | "saving" | "error" | "conflict";
export class SaveError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export class SyncQueue {
  pending: DB | null = null;
  status: SyncStatus = "saved";
  message = "";
  private running: Promise<void> | null = null;
  constructor(
    public version: number,
    private save: (
      data: DB,
      version: number,
    ) => Promise<{ version: number; user: DB["user"] }>,
    private notify: () => void,
    private updateUser: (user: DB["user"]) => void,
  ) {}
  enqueue(data: DB) {
    this.pending = data;
    if (this.status !== "conflict") void this.flush();
  }
  flush(): Promise<void> {
    if (this.running) return this.running;
    if (this.status === "conflict" || !this.pending) return Promise.resolve();
    this.running = this.drain().finally(() => {
      this.running = null;
      if (this.pending && this.status === "saved") void this.flush();
    });
    return this.running;
  }
  private async drain() {
    this.status = "saving";
    this.message = "";
    this.notify();
    while (this.pending) {
      const sent = this.pending;
      try {
        const result = await this.save(sent, this.version);
        this.version = result.version;
        if (this.pending === sent) this.pending = null;
        this.updateUser(result.user);
      } catch (error) {
        this.status =
          error instanceof SaveError && [403, 409].includes(error.status)
            ? "conflict"
            : "error";
        this.message =
          error instanceof Error ? error.message : "Saving failed.";
        this.notify();
        return;
      }
    }
    this.status = "saved";
    this.notify();
  }
}
