import { GAME_CONSTANTS, GAME_MODE, GAME_STATUS } from "./constants.js";
import { distance } from "./geometry.js";

export class LinkedCrossingRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.max(320, Math.min(rect.width, rect.height));

    if (this.canvas.width !== Math.round(size * dpr) || this.canvas.height !== Math.round(size * dpr)) {
      this.canvas.width = Math.round(size * dpr);
      this.canvas.height = Math.round(size * dpr);
    }

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  clear() {
    const { ctx, canvas } = this;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  worldToScreen(point) {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    const side = Math.min(width, height);
    const scale = side / (2 * GAME_CONSTANTS.R_MAX);

    return {
      x: width / 2 + point.x * scale,
      y: height / 2 - point.y * scale,
    };
  }

  screenToWorld(x, y) {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    const side = Math.min(width, height);
    const scale = (2 * GAME_CONSTANTS.R_MAX) / side;

    return {
      x: scale * (x - width / 2),
      y: scale * (height / 2 - y),
    };
  }

  drawCircle(center, radius, color, filled = false, lineWidth = 1.4) {
    const { ctx } = this;
    const screenCenter = this.worldToScreen(center);
    const screenEdge = this.worldToScreen({ x: center.x + radius, y: center.y });
    const screenRadius = Math.abs(screenEdge.x - screenCenter.x);

    ctx.beginPath();
    ctx.arc(screenCenter.x, screenCenter.y, screenRadius, 0, Math.PI * 2);
    if (filled) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  drawLine(a, b, color, lineWidth = 2) {
    const { ctx } = this;
    const start = this.worldToScreen(a);
    const end = this.worldToScreen(b);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  render(game) {
    this.resize();
    this.clear();

    this.drawCircle({ x: 0, y: 0 }, GAME_CONSTANTS.R_MAX, "#169447", false, 2.2);

    game.particles.forEach((particle) => {
      this.drawCircle(particle.position, GAME_CONSTANTS.R_VIZ, "#59eaea", true);
      this.drawCircle(particle.position, GAME_CONSTANTS.R_VIZ, "#169447", false, 1.3);
    });

    game.faiseurs.forEach((faiseur) => {
      faiseur.getElements().forEach((element) => {
        this.drawCircle(element.center, element.radius, "#88a7ff", false, 1.5);
      });
    });

    if (!game.chain.isEmpty()) {
      const points = game.chain.articulations;
      for (let i = 0; i < points.length - 1; i += 1) {
        this.drawLine(points[i], points[i + 1], "#d13828", 2.2);
      }

      points.forEach((point) => {
        this.drawCircle(point, GAME_CONSTANTS.R_VIZ, "#d13828", false, 1.5);
      });

      this.drawCircle(game.chain.getEffector(), GAME_CONSTANTS.R_CAPTURE, "#d13828", false, 1.1);

      const goal = game.chain.getFinalGoal();
      if (distance({ x: 0, y: 0 }, goal) > GAME_CONSTANTS.EPSILON) {
        this.drawCircle(goal, GAME_CONSTANTS.R_VIZ, "#101010", true);
      }

      if (
        game.status === GAME_STATUS.ONGOING &&
        game.mode === GAME_MODE.GUIDAGE &&
        game.chain.getNbArticulations() > 1
      ) {
        this.drawCircle(game.intermediateGuidanceGoal, GAME_CONSTANTS.R_VIZ, "#101010", true);
      }
    } else if (game.status === GAME_STATUS.ONGOING) {
      this.drawCircle(game.boundaryProjection, GAME_CONSTANTS.R_CAPTURE, "#d13828", false, 1.1);
      this.drawCircle(
        { x: -game.boundaryProjection.x, y: -game.boundaryProjection.y },
        GAME_CONSTANTS.R_VIZ,
        "#101010",
        true,
      );
    }
  }
}
