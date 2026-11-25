// Scene select: one card per scene, with a live thumbnail of its art.
// Shown only when the host passes two or more activities; living-hokkaido
// passes one, so it goes straight to the game.
import Phaser from "phaser";
import { WORLD_W } from "../art/common";
import { SCENE_ART } from "../art/scenes";
import type { HideSeekActivity } from "../integration/contracts";
import { PALETTE } from "../style/palette";
import { type Button, drawChunkyBox, makeButton, makeText } from "../style/ui";
import type { GameSceneData } from "./GameScene";

const CARD_W = 540;
const CARD_H = 470;
const CARD_Y = 400;
const THUMB_W = 500;
const THUMB_H = 281;
// The part of a scene's 1280×720 art that holds the island (16:9).
const CROP = { x: 10, y: 20, w: 1000, h: 562 };

export class SelectScene extends Phaser.Scene {
  private cfg!: GameSceneData;
  private index = 0;
  private outlines: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super("Select");
  }

  private get list(): HideSeekActivity[] {
    return this.cfg.activities?.length
      ? this.cfg.activities
      : [this.cfg.activity];
  }

  init(data: GameSceneData) {
    this.cfg = data;
    this.index = Math.max(
      0,
      this.list.findIndex((a) => a.id === data.activity.id),
    );
    this.outlines = [];
  }

  create() {
    makeText(this, WORLD_W / 2, 58, 52)
      .setOrigin(0.5)
      .setText("Out of Place");
    makeText(this, WORLD_W / 2, 112, 24, "creamSoft")
      .setOrigin(0.5)
      .setText("Choose a scene to hide in");

    const n = this.list.length;
    const gap = 60;
    const totalW = n * CARD_W + (n - 1) * gap;
    this.list.forEach((a, i) => {
      const cx = WORLD_W / 2 - totalW / 2 + CARD_W / 2 + i * (CARD_W + gap);
      this.buildCard(a, i, cx);
    });
    makeText(this, WORLD_W / 2, 688, 18, "creamSoft")
      .setOrigin(0.5)
      .setText("Keys: ← → choose · Enter play");
    this.highlight();

    this.input.keyboard?.on("keydown", (ev: KeyboardEvent) => {
      const num = Number(ev.key);
      if (ev.key === "ArrowLeft") this.select(this.index - 1);
      else if (ev.key === "ArrowRight") this.select(this.index + 1);
      else if (num >= 1 && num <= n) this.select(num - 1);
      else if (ev.key === "Enter" || ev.key === " ") this.play(this.index);
      else return;
      ev.preventDefault();
    });
    this.cfg.announce(
      `Choose a scene. ${this.list.map((a, i) => `${i + 1}: ${this.shortTitle(a)}.`).join(" ")} Arrow keys choose, Enter plays.`,
    );
  }

  private shortTitle(a: HideSeekActivity) {
    const t = a.title.replace(/^Out of Place:\s*/i, "");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  private buildCard(a: HideSeekActivity, i: number, cx: number) {
    const card = this.add.container(cx, CARD_Y);
    const box = this.add.graphics();
    drawChunkyBox(box, 0, 0, CARD_W, CARD_H, "backdropDeep", "backdropDeep");
    const outline = this.add.graphics();
    this.outlines.push(outline);

    // Thumbnail from the scene's own composite (background plus props).
    const key = `thumb-${a.id}`;
    if (this.textures.exists(key)) this.textures.remove(key);
    const thumb = document.createElement("canvas");
    thumb.width = THUMB_W;
    thumb.height = THUMB_H;
    const ctx = thumb.getContext("2d") as CanvasRenderingContext2D;
    ctx.fillStyle = `#${PALETTE.backdrop.toString(16).padStart(6, "0")}`;
    ctx.fillRect(0, 0, THUMB_W, THUMB_H);
    ctx.drawImage(
      SCENE_ART[a.scene]().composite,
      CROP.x,
      CROP.y,
      CROP.w,
      CROP.h,
      0,
      0,
      THUMB_W,
      THUMB_H,
    );
    this.textures.addCanvas(key, thumb);
    const img = this.add.image(0, -CARD_H / 2 + 20 + THUMB_H / 2, key);
    const frame = this.add.graphics();
    frame
      .lineStyle(4, PALETTE.outline)
      .strokeRect(-THUMB_W / 2, -CARD_H / 2 + 20, THUMB_W, THUMB_H);

    const title = makeText(this, 0, CARD_H / 2 - 150, 26, "cream", {
      align: "center",
      wordWrap: { width: CARD_W - 40 },
    })
      .setOrigin(0.5, 0)
      .setText(this.shortTitle(a));
    const labels = [
      a.claimIds.some(
        (id) => this.cfg.claims[id]?.presentation === "research-preview",
      )
        ? "Research preview"
        : "",
      a.illustrative ? "Illustrative scene" : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const chip = makeText(this, 0, CARD_H / 2 - 108, 15, "creamSoft", {
      strokeThickness: 3,
    })
      .setOrigin(0.5, 0)
      .setText(labels);
    const play: Button = makeButton(
      this,
      0,
      CARD_H / 2 - 48,
      220,
      64,
      `Play ${i + 1} ▸`,
      () => this.play(i),
      26,
    );

    const hit = this.add
      .zone(0, -CARD_H / 2 + 20 + THUMB_H / 2, THUMB_W, THUMB_H)
      .setInteractive({ useHandCursor: true });
    hit.on("pointerover", () => this.select(i));
    hit.on("pointerup", () => this.play(i));
    card.add([box, outline, img, frame, title, chip, hit, play.root]);
  }

  private select(i: number) {
    const n = this.list.length;
    this.index = (i + n) % n;
    this.highlight();
    this.cfg.announce(
      `${this.index + 1}: ${this.shortTitle(this.list[this.index])}`,
    );
  }

  private highlight() {
    this.outlines.forEach((g, i) => {
      g.clear();
      if (i !== this.index) return;
      g.lineStyle(6, PALETTE.sunGlow).strokeRoundedRect(
        -CARD_W / 2 - 10,
        -CARD_H / 2 - 10,
        CARD_W + 20,
        CARD_H + 20,
        20,
      );
    });
  }

  private play(i: number) {
    this.scene.start("Game", { ...this.cfg, activity: this.list[i] });
  }
}
