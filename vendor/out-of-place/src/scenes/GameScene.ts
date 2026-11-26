// The whole round in one Phaser scene. Data comes in as props (activity,
// resolved claims, prefs, emit), shaped like living-hokkaido's ActivityPartProps;
// what the players did goes out through emit(). No globals, no URL reading,
// no storage, so the scene can run inside a host page.
import Phaser from "phaser";
import { type SceneArt, WORLD_H, WORLD_W } from "../art/common";
import { SCENE_ART } from "../art/scenes";
import {
  createRound,
  hitTest,
  type Hider,
  type Phase,
  POSE_HITBOX,
  POSES,
  type Pose,
  type RoundAction,
  type RoundState,
  roundReducer,
  secondsLeft,
} from "../core/round";
import {
  type ClipLayout,
  cardImage,
  clipSupport,
  deliverClip,
  startVerticalClip,
} from "../game/clip";
import { Crowd } from "../game/crowd";
import { analyse, giveawayLine } from "../game/giveaway";
import { Nuri, type NuriPaint, type WorldPattern } from "../game/nuri";
import { Sfx } from "../game/sound";
import type { OutOfPlaceProps } from "../integration/contracts";
import { PALETTE } from "../style/palette";
import { RES } from "../style/res";
import { hex } from "../art/iso";
import { type Button, drawChunkyBox, makeButton, makeText } from "../style/ui";

export type GameSceneData = OutOfPlaceProps & {
  /** Puts text in the host's aria-live region (screen readers). */
  announce: (text: string) => void;
};

type Tool = "move" | "brush" | "eyedrop";
const BRUSH_RADIUS = { S: 2, M: 5, L: 10 } as const;
type BrushSize = keyof typeof BRUSH_RADIUS;
const SIZES: BrushSize[] = ["S", "M", "L"];
/** Side of the texture swatch the eyedropper takes from the scene (px). */
const PATCH = 40;
/** Recent paints kept in the panel's bottom row. */
const RECENT_MAX = 4;
/** Eyedropper loupe: the patch at 4×, a frame, and a chip of the colour. */
const LOUPE_K = 3;
const LOUPE_B = 6;
const LOUPE_W = PATCH * LOUPE_K + LOUPE_B * 2;
const LOUPE_H = LOUPE_W + 22;
/** The loupe texture is drawn at 2× so it stays sharp at RES 2. */
const LOUPE_TEX = 2;
/** Painting zoom: close on Nuri and the scene right around them. */
const ZOOM = 3.2;
const KEY_STEP = 8;
/** Finder ring (the seeker's magnifying glass): radius and arrow-key step. */
const FINDER_R = 16;
const FINDER_STEP = 6;

const PHASE_TITLE: Record<Phase, string> = {
  sceneReveal: "Look closely",
  disguise: "Disguise",
  handoff: "",
  seek: "Seek",
  reveal: "Reveal",
  roundOver: "Round over",
};

// Tool panel layout (right side, over the empty backdrop).
const PANEL_X0 = 960;
const COL1 = 1037;
const COL2 = 1193;
const THIRDS = [1013, 1115, 1217];
const BTN_W = 140;
const BTN_H = 76;
const ROWS = [110, 196, 300, 390, 494];
const MAIN_BTN = { x: 1115, y: 650, w: 296, h: 84 };
const RECENT_Y = 568;

// Reveal: freeze, slow zoom on the hider, then the sting.
const REVEAL_ZOOM = 2.3;
const REVEAL_ZOOM_MS = 2400;
/** Screen x where the hider sits during the reveal (card on the right). */
const REVEAL_SCREEN_X = 360;
const CLIP_MS = 10_000;
const CARD = { x: 950, y: 318, w: 560, h: 500 };

/** What the brush paints with: a colour, and the scene patch it came from. */
type Paint = {
  color: number;
  patch: HTMLCanvasElement | null;
  /** World position of the patch's top-left pixel. */
  at: { x: number; y: number } | null;
};

type RevealInfo = {
  found: boolean;
  title: string;
  stats: string;
  giveaway: string;
  factLabel: string;
  fact: string;
  blend: number;
};

export class GameScene extends Phaser.Scene {
  private cfg!: GameSceneData;
  private state!: RoundState;
  private art!: SceneArt;
  private compositeCtx!: CanvasRenderingContext2D;
  private nuri!: Nuri;
  private crowd!: Crowd;
  private world!: Phaser.GameObjects.Layer;
  private ui!: Phaser.GameObjects.Layer;

  private tool: Tool = "move";
  private brushSize: BrushSize = "M";
  private color: number = PALETTE.tuff;
  private fillPattern: WorldPattern | null = null;
  private recent: Paint[] = [];
  private recentBtns: Phaser.GameObjects.Container[] = [];
  private recentKeys: string[] = [];
  private swatchImg!: Phaser.GameObjects.Image;
  private brushGfx!: Phaser.GameObjects.Graphics;
  private loupeTex!: Phaser.Textures.CanvasTexture;
  private loupe!: Phaser.GameObjects.Image;
  private zoomed = false;
  private stroking = false;
  private dragging = false;
  /** Feet minus pointer when a drag starts on Nuri, so Nuri does not jump. */
  private grab = { x: 0, y: 0 };
  private lastDab: { x: number; y: number } | null = null;
  private lastShownSeconds = -1;
  private lastHider: Hider | null = null;
  private completed = false;
  private seekCursor = { x: 0, y: 0, shown: false };
  private sfx!: Sfx;
  private roundNo = 0;
  private revealInfo: RevealInfo | null = null;
  private revealCardShown = false;
  private recording = false;
  private revealFx: Phaser.GameObjects.GameObject[] = [];

  // HUD
  private titleText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Graphics;
  private mainBtn!: Button;
  private scenesBtn!: Button;
  private panel!: Phaser.GameObjects.Container;
  private toolBtns!: Record<Tool, Button>;
  private sizeBtns!: Record<BrushSize, Button>;
  private poseBtns!: Record<Pose, Button>;
  private zoomBtn!: Button;
  private undoBtn!: Button;
  private swatch!: Phaser.GameObjects.Graphics;
  private handoff!: Phaser.GameObjects.Container;
  private card!: Phaser.GameObjects.Container;
  private cardBody!: Phaser.GameObjects.Text;
  private cardTitle!: Phaser.GameObjects.Text;
  private cardChips!: Phaser.GameObjects.Text;
  private cardBox!: Phaser.GameObjects.Graphics;
  private factBox!: Phaser.GameObjects.Graphics;
  private factLabelText!: Phaser.GameObjects.Text;
  private factText!: Phaser.GameObjects.Text;
  private spotlight!: Phaser.GameObjects.Graphics;
  private cursorGfx!: Phaser.GameObjects.Graphics;
  private recText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
  }

  init(data: GameSceneData) {
    this.cfg = data;
    // Phaser reuses this object when the scene restarts (e.g. after the scene
    // select), so reset every piece of per-run state here.
    this.tool = "move";
    this.brushSize = "M";
    this.color = PALETTE.tuff;
    this.fillPattern = null;
    this.recent = [];
    this.zoomed = false;
    this.stroking = false;
    this.dragging = false;
    this.lastDab = null;
    this.lastShownSeconds = -1;
    this.lastHider = null;
    this.completed = false;
    this.roundNo = 0;
    this.revealInfo = null;
    this.revealCardShown = false;
    this.recording = false;
    this.revealFx = [];
  }

  private get canChooseScene() {
    return (this.cfg.activities?.length ?? 0) > 1;
  }

  private chooseScene() {
    if (!this.canChooseScene || this.recording) return;
    this.scene.start("Select", this.cfg);
  }

  create() {
    this.sfx = new Sfx(this.cfg.muted ?? false);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.sfx.dispose());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.sfx.dispose());

    // Two cameras: the world camera can zoom for painting; the UI camera never moves.
    this.world = this.add.layer();
    this.ui = this.add.layer();
    const uiCam = this.cameras
      .add(0, 0, WORLD_W * RES, WORLD_H * RES)
      .setZoom(RES)
      .centerOn(WORLD_W / 2, WORLD_H / 2);
    this.cameras.main.setZoom(RES).centerOn(WORLD_W / 2, WORLD_H / 2);
    this.cameras.main.ignore(this.ui);
    uiCam.ignore(this.world);

    this.buildWorld();
    this.buildHud();
    this.bindPointer();
    this.bindKeys();

    const d = this.cfg.activity.durations;
    this.state = createRound({
      spawn: this.art.spawn,
      penaltyMs: this.cfg.activity.wrongTapPenalty * 1000,
      durations: {
        sceneReveal: d.sceneReveal * 1000,
        disguise: d.disguise * 1000,
        seek: d.seek * 1000,
        reveal: d.reveal * 1000,
      },
    });
    this.onEnter("sceneReveal");
    this.render();
  }

  // ---------- content helpers ----------

  private claimText(id: string) {
    return this.cfg.claims[id]?.claim.text ?? "";
  }

  /** Honesty labels (living-hokkaido STYLE.md): research preview, illustrative. */
  private honestyLabels() {
    const a = this.cfg.activity;
    const labels: string[] = [];
    if (
      a.claimIds.some(
        (id) => this.cfg.claims[id]?.presentation === "research-preview",
      )
    ) {
      labels.push("Research preview · review pending");
    }
    if (a.illustrative) labels.push("Illustrative scene");
    return labels.join("  ·  ");
  }

  private get penaltySeconds() {
    return this.cfg.activity.wrongTapPenalty;
  }

  private get still() {
    return this.cfg.prefs.reducedMotion;
  }

  // ---------- setup ----------

  private buildWorld() {
    this.art = SCENE_ART[this.cfg.activity.scene]();
    this.compositeCtx = this.art.composite.getContext("2d", {
      willReadFrequently: true,
    })!;
    const crisp = (key: string, c: HTMLCanvasElement) => {
      // Textures are global to the game: replace the previous scene's ones.
      if (this.textures.exists(key)) this.textures.remove(key);
      this.textures
        .addCanvas(key, c)
        ?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    };
    crisp("scene-bg", this.art.background);
    this.world.add(
      this.add.image(0, 0, "scene-bg").setOrigin(0).setDepth(-10_000),
    );
    this.art.props.forEach((p, i) => {
      crisp(`prop-${i}`, p.canvas);
      this.world.add(
        this.add
          .image(p.x, p.y, `prop-${i}`)
          .setOrigin(p.originX, p.originY)
          .setDepth(p.depth),
      );
    });
    this.crowd = new Crowd(
      this,
      this.world,
      this.art.walkers ?? [],
      this.cfg.prefs.reducedMotion,
    );
    this.nuri = new Nuri(this);
    this.world.add(this.nuri.container);
    this.spotlight = this.add.graphics().setDepth(20_000);
    this.cursorGfx = this.add.graphics().setDepth(25_000);
    this.brushGfx = this.add.graphics().setDepth(25_000);
    this.world.add([this.spotlight, this.cursorGfx, this.brushGfx]);
    if (this.textures.exists("loupe")) this.textures.remove("loupe");
    this.loupeTex = this.textures.createCanvas(
      "loupe",
      LOUPE_W * LOUPE_TEX,
      LOUPE_H * LOUPE_TEX,
    )!;
    this.loupe = this.add
      .image(0, 0, "loupe")
      .setDepth(25_001)
      .setVisible(false);
    this.world.add(this.loupe);
    this.seekCursor = { ...this.art.spawn, shown: false };
  }

  private buildHud() {
    const add = <T extends Phaser.GameObjects.GameObject>(o: T) => {
      this.ui.add(o);
      return o;
    };

    // Top banner behind the title and hint, so text stays readable over the art.
    this.banner = add(this.add.graphics());
    this.titleText = add(makeText(this, 28, 14, 38));
    this.hintText = add(
      makeText(this, 30, 62, 21, "creamSoft", { wordWrap: { width: 900 } }),
    );

    // Disguise tool panel
    this.panel = add(this.add.container(0, 0));
    const bg = this.add.graphics();
    drawChunkyBox(
      bg,
      (PANEL_X0 + 1270) / 2,
      380,
      1270 - PANEL_X0 - 8,
      690,
      "backdropDeep",
      "backdropDeep",
    );
    this.panel.add(bg);
    const btn = (
      x: number,
      y: number,
      label: string,
      fn: () => void,
      w = BTN_W,
      size = 26,
    ) => {
      const b = makeButton(this, x, y, w, BTN_H, label, fn, size);
      this.panel.add(b.root);
      return b;
    };
    this.toolBtns = {
      move: btn(COL1, ROWS[0], "Move", () => this.setTool("move")),
      brush: btn(COL1, ROWS[1], "Brush", () => this.setTool("brush")),
      eyedrop: btn(COL2, ROWS[1], "Eyedrop", () => this.setTool("eyedrop")),
    };
    this.zoomBtn = btn(COL2, ROWS[0], "Zoom +", () =>
      this.setZoom(!this.zoomed),
    );
    this.sizeBtns = {
      S: btn(THIRDS[0], ROWS[2], "S", () => this.setBrushSize("S"), 88),
      M: btn(THIRDS[1], ROWS[2], "M", () => this.setBrushSize("M"), 88),
      L: btn(THIRDS[2], ROWS[2], "L", () => this.setBrushSize("L"), 88),
    };
    this.swatch = this.add.graphics();
    this.panel.add(this.swatch);
    this.swatchImg = this.add
      .image(THIRDS[0], ROWS[3] - 3, "__DEFAULT")
      .setVisible(false);
    this.panel.add(this.swatchImg);
    btn(THIRDS[1], ROWS[3], "Fill", () => this.fillAll(), 88, 24);
    this.undoBtn = btn(THIRDS[2], ROWS[3], "Undo", () => this.undo(), 88, 24);
    // Four practical shapes in one row (1–4).
    const POSE_X = [1001, 1077, 1153, 1229];
    const poseBtn = (i: number, pose: Pose, text: string) =>
      btn(POSE_X[i], ROWS[4], text, () => this.setPose(pose), 70, 20);
    this.poseBtns = {
      standing: poseBtn(0, "standing", "Stand"),
      sitting: poseBtn(1, "sitting", "Sit"),
      kneeling: poseBtn(2, "kneeling", "Kneel"),
      lying: poseBtn(3, "lying", "Lie"),
    };
    const label = (y: number, t: string) =>
      this.panel.add(
        makeText(this, PANEL_X0 + 14, y, 16, "creamSoft").setText(t),
      );
    label(ROWS[2] - 60, "Brush size");
    label(ROWS[3] - 56, "Color");
    label(ROWS[4] - 60, "Pose");

    // One main button for every phase: Skip / I'm hidden / Give up / Next / Play again.
    this.mainBtn = makeButton(
      this,
      MAIN_BTN.x,
      MAIN_BTN.y,
      MAIN_BTN.w,
      MAIN_BTN.h,
      "",
      () => this.onMainButton(),
      30,
    );
    add(this.mainBtn.root);
    this.scenesBtn = makeButton(
      this,
      830,
      MAIN_BTN.y,
      210,
      MAIN_BTN.h,
      "Scenes",
      () => this.chooseScene(),
      28,
    );
    add(this.scenesBtn.root);

    // Handoff cover: hides the scene completely while the device changes hands.
    this.handoff = add(this.add.container(0, 0));
    const cover = this.add
      .graphics()
      .fillStyle(PALETTE.backdropDeep)
      .fillRect(0, 0, WORLD_W, WORLD_H);
    const blocker = this.add
      .zone(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H)
      .setInteractive();
    const go = makeButton(
      this,
      WORLD_W / 2,
      470,
      460,
      96,
      "I’m the seeker: start",
      () => this.dispatch({ type: "ready" }),
      32,
    );
    this.handoff.add([
      cover,
      blocker,
      makeText(this, WORLD_W / 2, 220, 54)
        .setOrigin(0.5)
        .setText("All hidden!"),
      makeText(this, WORLD_W / 2, 310, 28, "creamSoft")
        .setOrigin(0.5)
        .setText("Pass the device to the seeker. No peeking!"),
      makeText(this, WORLD_W / 2, 560, 20, "creamSoft")
        .setOrigin(0.5)
        .setText("Keyboard: press Enter to start"),
      go.root,
    ]);

    // Reveal card: what gave you away + one real fact, then sources and clip.
    this.card = add(this.add.container(CARD.x, CARD.y));
    this.cardBox = this.add.graphics();
    drawChunkyBox(
      this.cardBox,
      0,
      0,
      CARD.w,
      CARD.h,
      "backdropDeep",
      "backdropDeep",
    );
    this.cardTitle = makeText(
      this,
      0,
      -CARD.h / 2 + 18,
      38,
      "sunGlow",
    ).setOrigin(0.5, 0);
    this.cardChips = makeText(this, 0, -CARD.h / 2 + 66, 15, "creamSoft", {
      strokeThickness: 3,
    }).setOrigin(0.5, 0);
    this.cardBody = makeText(
      this,
      -CARD.w / 2 + 26,
      -CARD.h / 2 + 100,
      19,
      "cream",
      {
        wordWrap: { width: CARD.w - 52 },
        lineSpacing: 5,
        strokeThickness: 3,
      },
    );
    // The real-history fact gets its own bright panel, so it stands out.
    this.factBox = this.add.graphics();
    this.factLabelText = makeText(
      this,
      -CARD.w / 2 + 44,
      0,
      22,
      "persimmonDark",
      {
        strokeThickness: 0,
        fontStyle: "bold",
      },
    );
    this.factText = makeText(this, -CARD.w / 2 + 44, 0, 20, "outline", {
      wordWrap: { width: CARD.w - 88 },
      lineSpacing: 4,
      strokeThickness: 0,
    });
    const how = makeButton(
      this,
      -158,
      CARD.h / 2 - 44,
      204,
      54,
      "How do we know?",
      () => this.openSources(),
      19,
    );
    const still = makeButton(
      this,
      27,
      CARD.h / 2 - 44,
      150,
      54,
      "Save card",
      () => void this.saveCard(),
      19,
    );
    const clip = makeButton(
      this,
      186,
      CARD.h / 2 - 44,
      152,
      54,
      "Save clip ●",
      () => void this.saveClip(),
      19,
    );
    this.card.add([
      this.cardBox,
      this.cardTitle,
      this.cardChips,
      this.cardBody,
      this.factBox,
      this.factLabelText,
      this.factText,
      how.root,
      still.root,
      clip.root,
    ]);

    this.recText = add(makeText(this, 28, 66, 24, "sunGlow").setVisible(false));
    this.toastText = add(
      makeText(this, WORLD_W / 2, 600, 26)
        .setOrigin(0.5)
        .setVisible(false),
    );
  }

  private bindPointer() {
    const cam = this.cameras.main;
    this.input.on(
      "pointerdown",
      (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
        if (over.length) return; // a UI button handled it
        const w = cam.getWorldPoint(p.x, p.y);
        if (this.state.phase === "disguise") {
          if (this.tool === "move") {
            this.dragging = true;
            const h = this.state.hider;
            // Grabbed Nuri: keep the grab point under the finger. Tapped
            // elsewhere: walk Nuri's feet to the tap.
            this.grab = hitTest(h, w.x, w.y)
              ? { x: h.x - w.x, y: h.y - w.y }
              : { x: 0, y: 0 };
            this.tryMove(w.x + this.grab.x, w.y + this.grab.y);
          } else if (this.tool === "brush") {
            this.nuri.beginStroke();
            this.stroking = true;
            this.lastDab = { x: w.x, y: w.y };
            this.nuri.dab(w.x, w.y, BRUSH_RADIUS[this.brushSize], this.paint);
            this.syncPanel();
          } else {
            this.pickColor(w.x, w.y);
          }
        } else if (this.state.phase === "seek") {
          this.seekTap(w.x, w.y);
        }
      },
    );
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.state.phase !== "disguise") return;
      const w = cam.getWorldPoint(p.x, p.y);
      this.drawBrushPreview(w.x, w.y);
      if (!p.isDown) {
        // A release we missed (outside the window, or a cancelled touch).
        this.dragging = this.stroking = false;
        this.lastDab = null;
        return;
      }
      if (this.dragging) this.tryMove(w.x + this.grab.x, w.y + this.grab.y);
      if (this.stroking && this.lastDab) {
        // Fill the gap between pointer events so fast strokes stay continuous.
        const r = BRUSH_RADIUS[this.brushSize];
        const dist = Phaser.Math.Distance.Between(
          this.lastDab.x,
          this.lastDab.y,
          w.x,
          w.y,
        );
        const steps = Math.max(1, Math.ceil(dist / Math.max(1, r * 0.5)));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          this.nuri.dab(
            this.lastDab.x + (w.x - this.lastDab.x) * t,
            this.lastDab.y + (w.y - this.lastDab.y) * t,
            r,
            this.paint,
          );
        }
        this.lastDab = { x: w.x, y: w.y };
      }
    });
    const end = () => {
      this.dragging = false;
      this.stroking = false;
      this.lastDab = null;
    };
    this.input.on("pointerup", end);
    this.input.on("pointerupoutside", end);
  }

  /**
   * Full keyboard path (living-hokkaido: every activity completes by keyboard).
   * Keys only reach the game while its host element has focus.
   */
  private bindKeys() {
    this.input.keyboard?.on("keydown", (ev: KeyboardEvent) => {
      if (this.recording) return;
      const phase = this.state.phase;
      const base = phase === "seek" ? FINDER_STEP : KEY_STEP;
      const step = ev.shiftKey ? base * 3 : base;
      const arrow: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      let handled = true;
      if (ev.key in arrow) {
        const [dx, dy] = arrow[ev.key];
        if (phase === "disguise")
          this.tryMove(this.state.hider.x + dx, this.state.hider.y + dy);
        else if (phase === "seek") this.moveSeekCursor(dx, dy);
        else handled = false;
      } else if (phase === "seek" && (ev.key === "Enter" || ev.key === " ")) {
        this.seekCursor.shown = true;
        this.seekTap(this.seekCursor.x, this.seekCursor.y);
      } else if (phase === "seek" && ev.key.toLowerCase() === "g") {
        this.onMainButton();
      } else if (
        phase === "roundOver" &&
        ev.key.toLowerCase() === "p" &&
        this.canChooseScene
      ) {
        this.chooseScene();
      } else if (
        (phase === "reveal" || phase === "roundOver") &&
        ev.key.toLowerCase() === "c"
      ) {
        void this.saveClip();
      } else if (
        (phase === "reveal" || phase === "roundOver") &&
        ev.key.toLowerCase() === "i"
      ) {
        void this.saveCard();
      } else if (
        (phase === "reveal" || phase === "roundOver") &&
        ev.key.toLowerCase() === "s"
      ) {
        this.openSources();
      } else if (ev.key === "Enter") {
        if (phase === "handoff") this.dispatch({ type: "ready" });
        else if (phase === "reveal" && !this.revealCardShown) handled = false;
        else this.onMainButton();
      } else if (phase === "disguise") {
        const k = ev.key.toLowerCase();
        const poseKey = POSES[Number(k) - 1];
        if (poseKey) this.setPose(poseKey);
        else if (k === "e")
          // The colour behind the middle of Nuri, whatever the pose.
          this.pickColor(
            this.state.hider.x,
            this.state.hider.y - POSE_HITBOX[this.state.hider.pose].h / 2,
          );
        else if (k === "f" || k === " ") this.fillAll();
        else if (k === "z") this.undo();
        else if (k === "[") this.stepBrushSize(-1);
        else if (k === "]") this.stepBrushSize(1);
        else if (k === "+" || k === "=") this.setZoom(true);
        else if (k === "-") this.setZoom(false);
        else handled = false;
      } else handled = false;
      if (handled) ev.preventDefault();
    });
  }

  // ---------- loop and state ----------

  update(_time: number, deltaMs: number) {
    // Freeze the round clock while a clip records (the reveal must not end mid-clip).
    if (!this.recording)
      this.dispatch({ type: "tick", dtMs: deltaMs * (this.cfg.speed ?? 1) });
    this.nuri.flush();
    this.crowd.update(deltaMs * (this.cfg.speed ?? 1));
  }

  private dispatch(action: RoundAction) {
    const prev = this.state;
    const next = roundReducer(prev, action);
    if (next === prev) return;
    this.state = next;
    if (next.phase !== prev.phase) this.onEnter(next.phase);
    this.render();
  }

  private onEnter(phase: Phase) {
    this.dragging = this.stroking = false;
    this.lastShownSeconds = -1;
    this.brushGfx?.clear();
    this.loupe?.setVisible(false);
    if (phase !== "roundOver") {
      this.clearRevealFx();
      this.resetCamera();
      if (phase !== "disguise") this.setZoom(false);
    }
    this.seekCursor.shown = false;
    this.drawSeekCursor();
    // The crowd freezes with the reveal and walks again in the next round.
    this.crowd.setPaused(phase === "reveal" || phase === "roundOver");
    this.crowd.setFaded(this, phase === "disguise");
    const a = this.cfg.activity;
    if (phase === "sceneReveal") {
      this.nuri.reset();
      this.brushSize = "M";
      this.setTool("move");
      this.setPaint({ color: PALETTE.tuff, patch: null, at: null }, false);
      this.recent = [];
      this.drawRecent();
      this.lastHider = null;
      this.roundNo++;
      this.revealInfo = null;
      this.revealCardShown = false;
      this.cfg.announce(
        `${a.title}. ${a.captionClaimIds.map((id) => this.claimText(id)).join(" ")} Look closely.`,
      );
    }
    if (phase === "disguise") {
      this.cfg.announce(
        `Disguise, ${a.durations.disguise} seconds. Hider: arrow keys move Nuri, E picks the colour behind Nuri, F fills, 1 to 4 change pose (stand, sit, kneel, lie), Enter when hidden.`,
      );
    }
    if (phase === "handoff")
      this.cfg.announce(
        "All hidden. Pass the device to the seeker, then press Enter.",
      );
    if (phase === "seek") {
      this.seekCursor = { ...this.art.spawn, shown: false };
      this.cfg.announce(
        `Seek, ${a.durations.seek} seconds. Arrow keys move the finder ring, Space taps. Wrong taps cost ${this.penaltySeconds} seconds.`,
      );
    }
    if (phase === "reveal") this.showReveal();
    if (phase === "roundOver") {
      this.mainBtn.setLabel("Play again");
      this.cfg.announce(
        `${a.completion} Press Enter to play again${this.canChooseScene ? ", or P to pick another scene" : ""}.`,
      );
    }
  }

  private onMainButton() {
    if (this.state.phase === "roundOver") this.dispatch({ type: "restart" });
    else this.dispatch({ type: "skipPhase" });
  }

  private render() {
    const s = this.state;
    const { phase } = s;
    const secs = secondsLeft(s);

    if (s.hider !== this.lastHider) {
      this.lastHider = s.hider;
      this.nuri.setFeet(s.hider.x, s.hider.y);
      this.nuri.setPose(s.hider.pose);
      if (this.zoomed && phase === "disguise") this.centerZoom();
      for (const [pose, b] of Object.entries(this.poseBtns))
        b.setSelected(pose === s.hider.pose);
    }
    this.nuri.container.setVisible(
      phase !== "sceneReveal" && phase !== "handoff",
    );

    if (secs !== this.lastShownSeconds || phase === "handoff") {
      this.lastShownSeconds = secs;
      const timed = phase !== "handoff" && phase !== "roundOver";
      this.titleText.setText(
        timed ? `${PHASE_TITLE[phase]} · ${secs}` : PHASE_TITLE[phase],
      );
    }
    const a = this.cfg.activity;
    const hints: Record<Phase, string> = {
      sceneReveal: [
        a.title,
        ...a.captionClaimIds.map((id) => this.claimText(id)),
        this.honestyLabels(),
      ]
        .filter(Boolean)
        .join("\n"),
      // Zoomed in to paint: a short line, so the banner covers less.
      disguise: this.zoomed
        ? "Paint near where you picked: the pattern lines up with the scene. Move zooms out."
        : "Hider: move Nuri to a spot, then paint to blend in and pick a pose. The eyedropper picks up colour and pattern.\nKeys: arrows move · E pick paint · [ ] brush size · F fill · 1–4 pose · Enter done",
      handoff: "",
      seek: `Seeker: tap whoever looks out of place. Wrong taps cost ${this.penaltySeconds} seconds.\nKeys: arrows move the ring · Space taps · G gives up`,
      reveal: "",
      roundOver: a.completion,
    };
    this.hintText.setText(hints[phase]);
    this.drawBanner();

    this.panel.setVisible(phase === "disguise");
    this.handoff.setVisible(phase === "handoff");
    const revealing = phase === "reveal" || phase === "roundOver";
    const cardUp = revealing && this.revealCardShown && !this.recording;
    this.card.setVisible(cardUp);
    this.mainBtn.root.setVisible(phase !== "handoff" && (!revealing || cardUp));
    this.scenesBtn.root.setVisible(
      phase === "roundOver" && cardUp && this.canChooseScene,
    );
    this.titleText.setVisible(!this.recording);
    const mainLabel: Record<Phase, string> = {
      sceneReveal: "Skip ▸",
      disguise: "I’m hidden ✓",
      handoff: "",
      seek: "Give up",
      reveal: "Next ▸",
      roundOver: "Play again",
    };
    this.mainBtn.setLabel(mainLabel[phase]);
  }

  private drawBanner() {
    const text = this.hintText.text;
    if (this.banner.getData("for") === text + this.state.phase) return;
    this.banner.setData("for", text + this.state.phase);
    this.banner.clear();
    const show =
      this.state.phase !== "handoff" && this.state.phase !== "reveal";
    if (!show) return;
    const h = 62 + (text ? this.hintText.height + 10 : 0);
    const w = Math.max(
      this.titleText.width + 60,
      text ? this.hintText.width + 60 : 0,
    );
    this.banner
      .fillStyle(PALETTE.backdropDeep, 0.85)
      .fillRoundedRect(8, 6, w, h, 14);
  }

  // ---------- disguise tools ----------

  private setTool(tool: Tool) {
    this.tool = tool;
    // Once Nuri stands where they hide, painting zooms in close; Move zooms
    // back out to choose a spot.
    if (this.state.phase === "disguise" && (tool === "move") === this.zoomed)
      this.setZoom(tool !== "move");
    this.syncPanel();
  }

  /** Outline of the brush (or the eyedropper's square) under the pointer. */
  private drawBrushPreview(x: number, y: number) {
    const g = this.brushGfx;
    g.clear();
    this.loupe.setVisible(false);
    if (this.state.phase !== "disguise") return;
    if (this.tool === "brush") {
      const r = BRUSH_RADIUS[this.brushSize];
      g.lineStyle(3, PALETTE.outline, 0.9).strokeCircle(x, y, r + 1);
      g.lineStyle(1.5, PALETTE.cream, 0.95).strokeCircle(x, y, r + 1);
    } else if (this.tool === "eyedrop") {
      g.lineStyle(3, PALETTE.outline, 0.9).strokeRect(
        x - PATCH / 2,
        y - PATCH / 2,
        PATCH,
        PATCH,
      );
      g.lineStyle(1.5, PALETTE.sunGlow).strokeRect(
        x - PATCH / 2,
        y - PATCH / 2,
        PATCH,
        PATCH,
      );
      this.drawLoupe(x, y);
    }
  }

  /**
   * The loupe beside the eyedropper: the exact patch the brush will paint
   * with, enlarged, the targeted pixel marked, and a chip of its colour.
   */
  private drawLoupe(x: number, y: number) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= WORLD_W || py >= WORLD_H) return;
    const ctx = this.loupeTex.getContext();
    const B = LOUPE_B;
    const side = PATCH * LOUPE_K;
    ctx.save();
    ctx.setTransform(LOUPE_TEX, 0, 0, LOUPE_TEX, 0, 0);
    ctx.clearRect(0, 0, LOUPE_W, LOUPE_H);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = hex("outline");
    ctx.beginPath();
    ctx.roundRect(0, 0, LOUPE_W, LOUPE_H, 10);
    ctx.fill();
    ctx.fillStyle = hex("backdrop");
    ctx.fillRect(B, B, side, side);
    ctx.drawImage(
      this.art.composite,
      px - PATCH / 2,
      py - PATCH / 2,
      PATCH,
      PATCH,
      B,
      B,
      side,
      side,
    );
    // The targeted pixel, ringed dark then light so it shows on any colour.
    const c = B + (PATCH / 2) * LOUPE_K;
    ctx.lineWidth = 2;
    ctx.strokeStyle = hex("outline");
    ctx.strokeRect(c - 2, c - 2, LOUPE_K + 4, LOUPE_K + 4);
    ctx.lineWidth = 1;
    ctx.strokeStyle = hex("cream");
    ctx.strokeRect(c - 0.5, c - 0.5, LOUPE_K + 1, LOUPE_K + 1);
    const [r, g, b, a] = this.compositeCtx.getImageData(px, py, 1, 1).data;
    ctx.fillStyle = a > 0 ? `rgb(${r}, ${g}, ${b})` : hex("backdrop");
    ctx.beginPath();
    ctx.roundRect(B, B + side + 4, side, 14, 5);
    ctx.fill();
    ctx.strokeStyle = hex("cream");
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    this.loupeTex.refresh();

    // Same size on screen at any zoom; up and right of the pointer, flipped
    // when it would run under the tool panel or off the top.
    const cam = this.cameras.main;
    const k = RES / cam.zoom;
    const gap = 22 * k;
    const w = LOUPE_W * k;
    const h = LOUPE_H * k;
    const panelX = cam.getWorldPoint(PANEL_X0 * RES, 0).x;
    const left = x + gap + w > panelX;
    const below = y - gap - h < cam.worldView.top;
    this.loupe
      .setScale(k / LOUPE_TEX)
      .setOrigin(left ? 1 : 0, below ? 0 : 1)
      .setPosition(left ? x - gap : x + gap, below ? y + gap : y - gap)
      .setVisible(true);
  }

  private stepBrushSize(d: number) {
    const i = SIZES.indexOf(this.brushSize);
    this.setBrushSize(SIZES[Math.max(0, Math.min(SIZES.length - 1, i + d))]);
  }

  private setBrushSize(size: BrushSize) {
    this.brushSize = size;
    if (this.tool === "move") this.setTool("brush");
    else this.syncPanel();
  }

  private setPose(pose: Pose) {
    this.dispatch({ type: "setPose", pose });
  }

  private fillAll() {
    if (this.state.phase !== "disguise") return;
    this.nuri.fill(this.paint);
    this.syncPanel();
    this.cfg.announce("Nuri painted.");
  }

  private undo() {
    this.nuri.undo();
    this.syncPanel();
  }

  private setZoom(on: boolean) {
    this.zoomed = on;
    const cam = this.cameras.main;
    if (on) {
      cam.setZoom(ZOOM * RES);
      this.centerZoom();
    } else {
      cam.setZoom(RES);
      cam.centerOn(WORLD_W / 2, WORLD_H / 2);
    }
    this.zoomBtn?.setLabel(on ? "Zoom −" : "Zoom +");
    if (this.state.phase === "disguise") this.render();
  }

  /** Keeps Nuri in the middle of the area the panel doesn't cover. */
  private centerZoom() {
    this.cameras.main.centerOn(
      this.state.hider.x + (WORLD_W - PANEL_X0) / (2 * ZOOM),
      this.hiderMidY,
    );
  }

  /**
   * Moves Nuri toward (x, y). When the target is blocked (a wall, the water),
   * Nuri slides along the edge or goes to the open spot closest to it on the way,
   * instead of freezing until the pointer is back on open ground.
   */
  private tryMove(x: number, y: number) {
    const { x: hx, y: hy } = this.state.hider;
    const go = (tx: number, ty: number) =>
      this.dispatch({
        type: "moveHider",
        x: Math.round(tx),
        y: Math.round(ty),
      });
    if (this.art.walkable(x, y)) return go(x, y);
    if (this.art.walkable(x, hy)) return go(x, hy);
    if (this.art.walkable(hx, y)) return go(hx, y);
    const steps = Math.ceil(Math.hypot(x - hx, y - hy) / 4);
    let best: [number, number] | null = null;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = hx + (x - hx) * t;
      const py = hy + (y - hy) * t;
      if (this.art.walkable(px, py)) best = [px, py];
    }
    if (best) go(best[0], best[1]);
  }

  private pickColor(x: number, y: number) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= WORLD_W || py >= WORLD_H) return;
    const [r, g, b, alpha] = this.compositeCtx.getImageData(px, py, 1, 1).data;
    const color = alpha > 0 ? (r << 16) | (g << 8) | b : PALETTE.backdrop;
    // Take a small square of the scene too, so the brush can copy its
    // pattern (stone joints, planks), not only one flat colour.
    const patch = document.createElement("canvas");
    patch.width = patch.height = PATCH;
    const pc = patch.getContext("2d")!;
    pc.fillStyle = `#${PALETTE.backdrop.toString(16).padStart(6, "0")}`;
    pc.fillRect(0, 0, PATCH, PATCH);
    pc.drawImage(
      this.art.composite,
      px - PATCH / 2,
      py - PATCH / 2,
      PATCH,
      PATCH,
      0,
      0,
      PATCH,
      PATCH,
    );
    this.setPaint(
      { color, patch, at: { x: px - PATCH / 2, y: py - PATCH / 2 } },
      true,
    );
    this.setTool("brush");
  }

  /** Brush paint: the scene patch when there is one, else the colour. */
  private get paint(): NuriPaint {
    return this.fillPattern ?? this.color;
  }

  private setPaint(p: Paint, remember: boolean) {
    this.color = p.color;
    const pattern = p.patch ? this.nuri.pattern(p.patch) : null;
    this.fillPattern =
      pattern && p.at ? { pattern, x0: p.at.x, y0: p.at.y } : null;
    if (this.textures.exists("swatch-patch"))
      this.textures.remove("swatch-patch");
    if (p.patch) {
      this.textures
        .addCanvas("swatch-patch", p.patch)
        ?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.swatchImg?.setTexture("swatch-patch").setDisplaySize(80, 60);
    }
    this.swatchImg?.setVisible(!!p.patch);
    if (remember) {
      this.recent = [
        p,
        ...this.recent.filter((q) => q.patch !== p.patch),
      ].slice(0, RECENT_MAX);
      this.drawRecent();
    }
    this.syncPanel();
  }

  /** The row of recent paints under the poses: tap one to paint with it again. */
  private drawRecent() {
    for (const b of this.recentBtns) b.destroy();
    for (const k of this.recentKeys)
      if (this.textures.exists(k)) this.textures.remove(k);
    this.recentBtns = [];
    this.recentKeys = [];
    if (!this.panel) return;
    this.recent.forEach((p, i) => {
      const x = PANEL_X0 + 46 + i * 72;
      const root = this.add.container(x, RECENT_Y);
      const g = this.add.graphics();
      drawChunkyBox(g, 0, 0, 58, 40, p.color, p.color);
      root.add(g);
      if (p.patch) {
        const key = `recent-${i}`;
        this.recentKeys.push(key);
        this.textures
          .addCanvas(key, p.patch)
          ?.setFilter(Phaser.Textures.FilterMode.NEAREST);
        root.add(this.add.image(0, -2, key).setDisplaySize(50, 30));
      }
      const hit = this.add
        .zone(0, 0, 66, 48)
        .setInteractive({ useHandCursor: true });
      hit.on("pointerup", () => this.setPaint(p, false));
      root.add(hit);
      this.panel.add(root);
      this.recentBtns.push(root);
    });
  }

  private syncPanel() {
    for (const t of Object.keys(this.toolBtns) as Tool[])
      this.toolBtns[t].setSelected(t === this.tool);
    for (const s of Object.keys(this.sizeBtns) as BrushSize[]) {
      this.sizeBtns[s].setSelected(
        s === this.brushSize && this.tool === "brush",
      );
    }
    this.swatch.clear();
    drawChunkyBox(
      this.swatch,
      THIRDS[0],
      ROWS[3],
      88,
      BTN_H,
      this.color,
      this.color,
    );
    this.undoBtn.root.setAlpha(this.nuri.canUndo ? 1 : 0.5);
    if (this.swatchImg) this.panel.bringToTop(this.swatchImg);
  }

  // ---------- seek and reveal ----------

  private seekTap(x: number, y: number) {
    const before = this.state.taps.length;
    this.dispatch({ type: "seekTap", x, y });
    const tap = this.state.taps[before];
    if (tap && !tap.hit) {
      this.sfx.miss();
      this.missEffect(tap.x, tap.y);
      this.cfg.announce(
        `Not there. Minus ${this.penaltySeconds} seconds, ${secondsLeft(this.state)} left.`,
      );
    }
  }

  private moveSeekCursor(dx: number, dy: number) {
    const c = this.seekCursor;
    c.x = Phaser.Math.Clamp(c.x + dx, 0, WORLD_W);
    c.y = Phaser.Math.Clamp(c.y + dy, 0, WORLD_H);
    c.shown = true;
    this.drawSeekCursor();
  }

  private drawSeekCursor() {
    const g = this.cursorGfx;
    g.clear();
    if (!this.seekCursor.shown || this.state?.phase !== "seek") return;
    const { x, y } = this.seekCursor;
    g.lineStyle(7, PALETTE.outline).strokeCircle(x, y, FINDER_R);
    g.lineStyle(4, PALETTE.sunGlow).strokeCircle(x, y, FINDER_R);
    g.fillStyle(PALETTE.sunGlow).fillCircle(x, y, 3);
  }

  private missEffect(x: number, y: number) {
    const ring = this.add
      .circle(x, y, 10)
      .setStrokeStyle(4, PALETTE.cream)
      .setDepth(30_000);
    const label = makeText(this, x, y - 20, 26, "sunGlow")
      .setOrigin(0.5)
      .setText(`−${this.penaltySeconds}s`)
      .setDepth(30_000);
    this.world.add([ring, label]);
    if (this.still) {
      // Reduced motion: no growing ring or floating label, just a short fade.
      this.tweens.add({
        targets: [ring, label],
        alpha: 0,
        delay: 700,
        duration: 300,
        onComplete: () => [ring, label].forEach((o) => o.destroy()),
      });
      return;
    }
    this.tweens.add({
      targets: ring,
      radius: 34,
      alpha: 0,
      duration: 500,
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: label,
      y: y - 70,
      alpha: 0,
      duration: 1100,
      ease: "Sine.easeOut",
      onComplete: () => label.destroy(),
    });
    this.tweens.add({
      targets: this.titleText,
      scale: 1.12,
      duration: 120,
      yoyo: true,
    });
  }

  private openSources() {
    const a = this.cfg.activity;
    this.cfg.emit({
      type: "reveal.open",
      knowledgeId: a.knowledgeId,
      claimId: a.accurateClaimIds[0],
    });
  }

  private showReveal() {
    const s = this.state;
    const a = this.cfg.activity;
    const analysis = analyse(this.nuri.sampleParts(this.compositeCtx));
    const found = s.outcome === "seekersWin";
    const wrong = s.taps.filter((t) => !t.hit).length;
    const foundTap = s.taps.find((t) => t.hit);
    const taps = (n: number) => `${n} wrong tap${n === 1 ? "" : "s"}`;

    // One real fact per round, taking turns through the scene's claims.
    const facts = [
      ...a.accurateClaimIds.map((id) => ({
        label: "Real history",
        text: this.claimText(id),
      })),
      ...a.anachronismClaimIds.map((id) => ({
        label: "Not here yet",
        text: this.claimText(id),
      })),
    ];
    const fact = facts[(this.roundNo - 1) % facts.length];

    this.revealInfo = {
      found,
      title: found ? "Found you!" : "Master of Disguise!",
      stats: found
        ? `Found after ${Math.round((foundTap?.atMs ?? 0) / 1000)}s, with ${taps(wrong)}.`
        : `Never found, after ${taps(wrong)}.`,
      giveaway: giveawayLine(found, analysis),
      factLabel: fact.label,
      fact: fact.text,
      blend: analysis.blend,
    };
    const r = this.revealInfo;
    this.cardTitle.setText(r.title);
    this.cardChips.setText(this.honestyLabels());
    this.cardBody.setText(
      [
        r.stats,
        `Blend score: ${r.blend}%`,
        ...(found ? ["", "What gave you away:", r.giveaway] : []),
      ].join("\n"),
    );
    this.layoutFact(r.factLabel, r.fact);
    this.cfg.announce(
      `${r.title} ${r.stats} ${found ? `${r.giveaway} ` : ""}${r.factLabel}: ${r.fact} Press Enter to continue, S for sources, I to save the card as a picture, C to save a clip.`,
    );
    this.playRevealSequence(false);

    // living-hokkaido: emit completion once, only when a round really finished.
    if (!this.completed) {
      this.completed = true;
      this.cfg.emit({
        type: "activity.complete",
        result: {
          activityId: a.id,
          completed: true,
          score: r.blend / 100,
          at: new Date().toISOString(),
        },
      });
    }
  }

  /** The fact panel sits under the body text, above the card's buttons. */
  private layoutFact(label: string, fact: string) {
    const top = this.cardBody.y + this.cardBody.height + 18;
    this.factLabelText.setText(`★ ${label.toUpperCase()}`).setY(top + 14);
    this.factText.setText(fact).setY(top + 46);
    const h = 46 + this.factText.height + 26;
    this.factBox.clear();
    drawChunkyBox(
      this.factBox,
      0,
      top + h / 2,
      CARD.w - 40,
      h,
      "sunGlow",
      "persimmonDark",
    );
  }

  // ---------- the reveal moment ----------

  private resetCamera() {
    const cam = this.cameras.main;
    cam.panEffect.reset();
    cam.zoomEffect.reset();
    cam.roundPixels = true;
  }

  private clearRevealFx() {
    this.time.removeAllEvents();
    this.tweens.killTweensOf(this.nuri.container);
    this.tweens.killTweensOf(this.spotlight);
    for (const o of this.revealFx) {
      this.tweens.killTweensOf(o);
      o.destroy();
    }
    this.revealFx = [];
    this.spotlight.clear().setAlpha(1);
    this.nuri.container.setScale(1);
    if (this.state) {
      this.nuri.setFeet(this.state.hider.x, this.state.hider.y);
      this.nuri.setPose(this.state.hider.pose);
    }
  }

  /**
   * Freeze, zoom in slowly on the hider, then the sting: a FOUND! stamp and a
   * hop, or the survivor's Master of Disguise pose with confetti. With reduced
   * motion the zoom is a cut and nothing bounces. `forClip` frames the hider in
   * the centre (for the vertical crop) and keeps the card hidden.
   */
  private playRevealSequence(forClip: boolean) {
    const info = this.revealInfo;
    if (!info) return;
    this.clearRevealFx();
    this.resetCamera();
    this.revealCardShown = forClip; // the clip replays after the card was shown
    const cam = this.cameras.main;
    const { x: hx } = this.state.hider;
    const cy = this.hiderMidY;
    const cx = forClip
      ? hx
      : hx + (WORLD_W / 2 - REVEAL_SCREEN_X) / REVEAL_ZOOM;
    const zoomMs = this.still ? 0 : REVEAL_ZOOM_MS;

    cam.setZoom(RES).centerOn(WORLD_W / 2, WORLD_H / 2);
    if (zoomMs) {
      // Snapping to whole pixels while the zoom changes makes the slow zoom
      // step and judder; let it glide (resetCamera turns snapping back on).
      cam.roundPixels = false;
      cam.pan(cx, cy, zoomMs, "Sine.easeInOut", true);
      cam.zoomTo(REVEAL_ZOOM * RES, zoomMs, "Sine.easeInOut", true);
    } else {
      cam.setZoom(REVEAL_ZOOM * RES).centerOn(cx, cy);
    }

    this.time.delayedCall(zoomMs, () =>
      info.found ? this.foundMoment() : this.survivorMoment(),
    );
    if (!forClip) {
      this.time.delayedCall(zoomMs + (this.still ? 150 : 800), () => {
        this.revealCardShown = true;
        this.render();
      });
    }
    this.render();
  }

  /** World y of the middle of the hider's body, for the pose they are in. */
  private get hiderMidY() {
    const h = this.state.hider;
    return h.y - POSE_HITBOX[h.pose].h / 2;
  }

  private spotlightRing() {
    const { x } = this.state.hider;
    this.spotlight
      .lineStyle(5, PALETTE.outline)
      .strokeCircle(x, this.hiderMidY, 92);
    this.spotlight
      .lineStyle(3, PALETTE.sunGlow)
      .strokeCircle(x, this.hiderMidY, 92);
    if (!this.still)
      this.tweens.add({
        targets: this.spotlight,
        alpha: 0.45,
        duration: 700,
        yoyo: true,
        repeat: -1,
      });
  }

  private foundMoment() {
    const { x, y } = this.state.hider;
    this.sfx.found();
    this.spotlightRing();
    const stamp = makeText(this, x, y - 172, 30, "sunGlow")
      .setOrigin(0.5)
      .setText("FOUND!")
      .setDepth(30_000);
    stamp.setAngle(-8);
    this.world.add(stamp);
    this.revealFx.push(stamp);
    if (this.still) return;
    stamp.setScale(0);
    this.tweens.add({
      targets: stamp,
      scale: 1,
      duration: 320,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: this.nuri.container,
      y: y - 22,
      duration: 160,
      yoyo: true,
      repeat: 3,
      ease: "Quad.easeOut",
    });
  }

  private survivorMoment() {
    const { x, y } = this.state.hider;
    this.sfx.survive();
    this.spotlightRing();
    this.nuri.setPose("victory");

    const ribbon = this.add.container(x, y - 178).setDepth(30_000);
    const g = this.add.graphics();
    drawChunkyBox(g, 0, 0, 200, 34, "persimmon", "persimmonDark");
    const label = makeText(this, 0, -2, 15)
      .setOrigin(0.5)
      .setText("MASTER OF DISGUISE");
    ribbon.add([g, label]);
    this.world.add(ribbon);
    this.revealFx.push(ribbon);
    if (this.still) return;

    ribbon.setScale(0);
    this.tweens.add({
      targets: ribbon,
      scale: 1,
      duration: 360,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: this.nuri.container,
      scaleX: 1.08,
      scaleY: 0.94,
      duration: 140,
      yoyo: true,
      repeat: 2,
    });

    // Confetti in the scene's own colours.
    const colors = [
      PALETTE.sunGlow,
      PALETTE.persimmon,
      PALETTE.moss,
      PALETTE.sky,
      PALETTE.plum,
      PALETTE.cream,
    ];
    for (let i = 0; i < 36; i++) {
      const bit = this.add
        .rectangle(x, y - 120, 4, 7, colors[i % colors.length])
        .setDepth(29_000)
        .setAngle(Phaser.Math.Between(0, 180));
      this.world.add(bit);
      this.revealFx.push(bit);
      const dx = Phaser.Math.Between(-110, 110);
      const up = Phaser.Math.Between(50, 120);
      this.tweens.add({
        targets: bit,
        x: x + dx,
        y: y - 120 - up,
        angle: bit.angle + 180,
        duration: 450,
        ease: "Quad.easeOut",
        onComplete: () =>
          this.tweens.add({
            targets: bit,
            y: y + 10,
            x: x + dx * 1.3,
            alpha: 0,
            duration: 1300,
            ease: "Quad.easeIn",
          }),
      });
    }
  }

  private toast(text: string) {
    this.toastText.setText(text).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 2200,
      duration: 400,
    });
    this.cfg.announce(text);
  }

  /** Title, the giveaway, the fact and the honesty labels for clip and card. */
  private clipLayout(info: RevealInfo): ClipLayout {
    return {
      title: info.found ? "FOUND!" : "Master of Disguise!",
      subtitle: this.cfg.activity.title,
      lines: [
        ...(info.found
          ? [{ label: "What gave me away", text: info.giveaway }]
          : []),
        { label: info.factLabel, text: info.fact },
      ],
      footer: `${this.honestyLabels()} · Sources in the game`,
    };
  }

  /**
   * Save card: a still 9:16 PNG of the hider (as the reveal shows them now)
   * with the same text as the clip. Works in browsers that can't record video.
   */
  private async saveCard() {
    const info = this.revealInfo;
    if (this.recording || !info || !this.revealCardShown) return;
    const k = this.game.canvas.width / WORLD_W;
    const size = 540;
    const blob = await cardImage(
      this.game.canvas,
      {
        x: (REVEAL_SCREEN_X - size / 2) * k,
        y: (WORLD_H / 2 - size / 2) * k,
        size: size * k,
      },
      this.clipLayout(info),
    );
    if (!blob) {
      this.toast("This browser can’t save the card.");
      return;
    }
    const how = await deliverClip(blob, "png");
    this.toast(how === "shared" ? "Card shared!" : "Card saved (PNG, 9:16)");
  }

  /**
   * Save clip: replays the reveal moment for 10 seconds (zoom, sting, pose) and
   * records it as a vertical 9:16 video with the history card underneath.
   */
  private async saveClip() {
    const info = this.revealInfo;
    if (this.recording || !info) return;
    const format = clipSupport();
    if (!format) {
      this.toast("This browser can’t record video clips.");
      return;
    }
    this.recording = true;
    const layout = this.clipLayout(info);
    const k = this.game.canvas.width / WORLD_W;
    const size = 540;
    const rec = startVerticalClip({
      source: this.game.canvas,
      crop: () => ({
        x: (WORLD_W / 2 - size / 2) * k,
        y: (WORLD_H / 2 - size / 2) * k,
        size: size * k,
      }),
      layout,
      textAfterMs: this.still ? 200 : REVEAL_ZOOM_MS,
      audio: this.sfx.recordStream(),
      format,
    });
    this.playRevealSequence(true);
    let left = CLIP_MS / 1000;
    this.recText.setText(`● Recording clip · ${left}s`).setVisible(true);
    this.time.addEvent({
      delay: 1000,
      repeat: left - 1,
      callback: () => {
        left--;
        this.recText.setText(`● Recording clip · ${left}s`);
      },
    });
    this.cfg.announce("Recording a 10 second clip of the reveal.");
    await new Promise<void>((resolve) =>
      this.time.delayedCall(CLIP_MS, resolve),
    );
    const blob = await rec.stop();

    this.recording = false;
    this.recText.setVisible(false);
    // Back to the normal reveal framing with the card.
    const { x: hx } = this.state.hider;
    this.cameras.main.pan(
      hx + (WORLD_W / 2 - REVEAL_SCREEN_X) / REVEAL_ZOOM,
      this.hiderMidY,
      this.still ? 0 : 400,
      "Sine.easeInOut",
      true,
    );
    this.revealCardShown = true;
    this.render();

    if (this.cfg.onClip) {
      this.cfg.onClip(blob, rec.ext);
      this.toast("Clip ready!");
    } else {
      const how = await deliverClip(blob, rec.ext);
      this.toast(
        how === "shared"
          ? "Clip shared!"
          : `Clip saved (${rec.ext.toUpperCase()}, 9:16)`,
      );
    }
  }
}
