/**
 * Tracks timeouts and the main animation frame loop for clean teardown.
 */
export class InstanceTimers {
  private readonly timeouts = new Set<number>();
  private rafHandle: number | null = null;

  setTimeoutMs(fn: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      this.timeouts.delete(id);
      fn();
    }, ms);

    this.timeouts.add(id);

    return id;
  }

  clearTimeoutMs(id?: number): void {
    if (id === undefined) return;
    window.clearTimeout(id);
    this.timeouts.delete(id);
  }

  clearAllTimeouts(): void {
    for (const id of this.timeouts) {
      window.clearTimeout(id);
    }
    this.timeouts.clear();
  }

  setAnimationLoop(fn: FrameRequestCallback): number {
    this.cancelAnimationFrame();
    const id = window.requestAnimationFrame((t) => {
      this.rafHandle = null;
      fn(t);
    });

    this.rafHandle = id;

    return id;
  }

  cancelAnimationFrame(): void {
    if (this.rafHandle != null) {
      window.cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  clearAll(): void {
    this.clearAllTimeouts();
    this.cancelAnimationFrame();
  }
}
