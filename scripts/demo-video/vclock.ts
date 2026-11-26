// Frame-by-frame capture with a virtual clock (`--capture frames`).
//
// Use it where the GPU is slow or absent (a cloud container renders WebGL in
// software at 1–2 fps). The page clock (performance.now, Date.now, timers and
// requestAnimationFrame) only moves when the recorder advances it, by exactly
// one video frame. After each step the recorder takes a screenshot and pipes
// it to ffmpeg. The result is a smooth constant-fps video, however slow each
// frame was to render. CSS transitions run on the browser's real clock, so
// the recorder slows the document timeline to match (CDP Animation domain).
//
// installVirtualClock is serialised into the page, so it must not use
// imports or closures from this module.
export function installVirtualClock() {
  type Timer = {
    id: number;
    due: number;
    fn: TimerHandler;
    args: unknown[];
    every?: number;
  };
  const w = window as Window & {
    __vclock?: {
      advance: (ms: number) => number;
      now: () => number;
      media: (ms: number) => Promise<number>;
    };
  };
  if (w.__vclock) return;
  const realNow = performance.now.bind(performance);
  const setTimeoutReal = window.setTimeout.bind(window);
  const clearTimeoutReal = window.clearTimeout.bind(window);
  let vt = realNow();
  const dateBase = Date.now() - vt;
  const timers = new Map<number, Timer>();
  let raf: [number, FrameRequestCallback][] = [];
  let nextId = 1;

  performance.now = () => vt;
  Date.now = () => Math.round(dateBase + vt);
  const add = (
    fn: TimerHandler,
    ms: unknown,
    args: unknown[],
    every = false,
  ) => {
    const id = nextId++;
    const d = Math.max(0, Number(ms) || 0);
    timers.set(id, {
      id,
      due: vt + d,
      fn,
      args,
      every: every ? Math.max(d, 1) : undefined,
    });
    return id;
  };
  const clear = (id?: number) => {
    if (id !== undefined) timers.delete(id);
  };
  const g = window as unknown as Record<string, unknown>;
  g.setTimeout = (fn: TimerHandler, ms?: number, ...args: unknown[]) =>
    add(fn, ms, args);
  g.setInterval = (fn: TimerHandler, ms?: number, ...args: unknown[]) =>
    add(fn, ms, args, true);
  g.clearTimeout = clear;
  g.clearInterval = clear;
  g.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const id = nextId++;
    raf.push([id, cb]);
    return id;
  };
  g.cancelAnimationFrame = (id: number) => {
    raf = raf.filter(([i]) => i !== id);
  };

  const call = (t: Timer) => {
    try {
      // String timers (eval) are not supported; nothing in the app uses them.
      if (typeof t.fn === "function")
        (t.fn as (...a: unknown[]) => void)(...t.args);
    } catch (err) {
      console.error(err);
    }
  };

  // Media: <video>/<audio> would play on the real clock (fast-forward in a
  // slow capture). play() only marks the element; media() steps its
  // currentTime by one frame and waits for the seek.
  type Media = HTMLMediaElement & { __vplay?: boolean };
  const playing = new Set<Media>();
  const proto = HTMLMediaElement.prototype;
  const realPause = proto.pause;
  proto.play = function (this: Media) {
    if (!this.__vplay) {
      this.__vplay = true;
      playing.add(this);
      this.dispatchEvent(new Event("play"));
      this.dispatchEvent(new Event("playing"));
    }
    return Promise.resolve();
  };
  proto.pause = function (this: Media) {
    realPause.call(this);
    if (this.__vplay) {
      this.__vplay = false;
      playing.delete(this);
      this.dispatchEvent(new Event("pause"));
    }
  };
  Object.defineProperty(proto, "paused", {
    configurable: true,
    get(this: Media) {
      return !this.__vplay;
    },
  });

  // autoplay would start on the real clock: take it off and call play().
  const tame = (m: HTMLMediaElement) => {
    if (!m.autoplay) return;
    m.autoplay = false;
    m.removeAttribute("autoplay");
    realPause.call(m);
    m.play();
  };
  new MutationObserver((list) => {
    for (const r of list)
      for (const n of r.addedNodes)
        if (n instanceof HTMLElement) {
          if (n instanceof HTMLMediaElement) tame(n);
          for (const m of n.querySelectorAll("video, audio"))
            tame(m as HTMLMediaElement);
        }
  }).observe(document, { childList: true, subtree: true });

  w.__vclock = {
    now: () => vt,
    async media(ms: number) {
      const steps: Promise<unknown>[] = [];
      for (const m of playing) {
        if (!m.isConnected) {
          playing.delete(m);
          continue;
        }
        const d = Number.isFinite(m.duration) ? m.duration : Infinity;
        const next = m.currentTime + ms / 1000;
        if (next >= d) {
          m.__vplay = false;
          playing.delete(m);
          m.currentTime = d;
          m.dispatchEvent(new Event("ended"));
          continue;
        }
        steps.push(
          new Promise((r) => {
            const t = setTimeoutReal(r, 400);
            m.addEventListener(
              "seeked",
              () => {
                clearTimeoutReal(t);
                r(null);
              },
              { once: true },
            );
            m.currentTime = next;
          }),
        );
      }
      await Promise.all(steps);
      return playing.size;
    },
    /** Move the clock by ms: run due timers in order, then one rAF batch. */
    advance(ms: number) {
      const end = vt + ms;
      for (let guard = 0; guard < 10000; guard++) {
        let first: Timer | undefined;
        for (const t of timers.values())
          if (t.due <= end && (!first || t.due < first.due)) first = t;
        if (!first) break;
        vt = Math.max(vt, first.due);
        if (first.every) first.due += first.every;
        else timers.delete(first.id);
        call(first);
      }
      vt = end;
      const batch = raf;
      raf = [];
      for (const [, cb] of batch) {
        try {
          cb(vt);
        } catch (err) {
          console.error(err);
        }
      }
      return vt;
    },
  };
}
