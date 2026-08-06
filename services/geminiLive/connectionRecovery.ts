/**
 * Reconnect with exponential backoff on unexpected close/error.
 * Does not require a full app reload.
 */
export type RecoverConnectFn = () => Promise<void>;

class ConnectionRecovery {
  readonly maxRetries = 3;
  private attempts = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private recovering = false;

  reset() {
    this.attempts = 0;
    this.recovering = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  isRecovering(): boolean {
    return this.recovering;
  }

  getAttempts(): number {
    return this.attempts;
  }

  canRetry(): boolean {
    return this.attempts < this.maxRetries;
  }

  /**
   * Schedule a reconnect. Returns true if scheduled, false if exhausted.
   */
  schedule(connectFn: RecoverConnectFn): boolean {
    if (!this.canRetry()) {
      console.error(
        `[ConnectionRecovery] Max retries (${this.maxRetries}) reached. Manual reconnect required.`,
      );
      this.recovering = false;
      return false;
    }

    this.attempts += 1;
    this.recovering = true;
    const delayMs = Math.min(1000 * Math.pow(2, this.attempts - 1), 8000);

    console.warn(
      `[ConnectionRecovery] Reconnecting in ${delayMs}ms (attempt ${this.attempts}/${this.maxRetries})`,
    );

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      this.timer = null;
      try {
        await connectFn();
        // success path resets via markSuccess from sessionManager
      } catch (err) {
        console.error('[ConnectionRecovery] Reconnect failed:', err);
        if (!this.schedule(connectFn)) {
          this.recovering = false;
        }
      }
    }, delayMs);

    return true;
  }

  markSuccess() {
    this.attempts = 0;
    this.recovering = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const connectionRecovery = new ConnectionRecovery();
