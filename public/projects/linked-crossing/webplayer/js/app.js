import { GAME_MODE, GAME_STATUS, GAME_CONSTANTS } from "./constants.js";
import { LinkedCrossingGame } from "./engine.js";
import { LinkedCrossingRenderer } from "./renderer.js";
import { pickRandomScenario } from "./scenarios.js";

const game = new LinkedCrossingGame();
const canvas = document.querySelector("#game-canvas");
const renderer = new LinkedCrossingRenderer(canvas);

const elements = {
  primaryAction: document.querySelector("#primary-action"),
  restartAction: document.querySelector("#restart-action"),
  canvasOverlay: document.querySelector("#canvas-overlay"),
  canvasOverlayText: document.querySelector("#canvas-overlay-text"),
  messageLog: document.querySelector("#message-log"),
  statScore: document.querySelector("#stat-score"),
  statParticles: document.querySelector("#stat-particles"),
  statFaiseurs: document.querySelector("#stat-faiseurs"),
  statArticulations: document.querySelector("#stat-articulations"),
  statMode: document.querySelector("#stat-mode"),
  statStatus: document.querySelector("#stat-status"),
  statPointer: document.querySelector("#stat-pointer"),
};

let running = false;
let hasStarted = false;
let lastFrame = performance.now();
let accumulator = 0;
let currentScenario = null;

function setMessage(message) {
  elements.messageLog.textContent = message;
}

function setMode(mode) {
  game.setMode(mode);
}

function canInteract() {
  return hasStarted && running && game.status === GAME_STATUS.ONGOING;
}

function updateOverlay() {
  const hidden = canInteract();
  elements.canvasOverlay.classList.toggle("is-hidden", hidden);

  if (hidden) {
    return;
  }

  if (!hasStarted) {
    elements.canvasOverlayText.textContent =
      "Appuie sur Start pour lancer la simulation puis joue directement dans l’arène.";
    return;
  }

  if (game.status !== GAME_STATUS.ONGOING) {
    elements.canvasOverlayText.textContent =
      game.status === GAME_STATUS.WON
        ? "Belle traversée. Appuie sur Restart pour relancer une nouvelle partie."
        : "La partie est terminée. Appuie sur Restart pour rejouer.";
    return;
  }

  elements.canvasOverlayText.textContent =
    "Prévisualisation en pause. Appuie sur Resume pour reprendre.";
}

function updateStats() {
  const stats = game.getStats();
  elements.statScore.textContent = String(stats.score);
  elements.statParticles.textContent = String(stats.particles);
  elements.statFaiseurs.textContent = String(stats.faiseurs);
  elements.statArticulations.textContent = String(stats.articulations);
  elements.statMode.textContent = stats.mode;
  elements.statStatus.textContent = stats.status;
}

function syncUiState() {
  if (!hasStarted) {
    elements.primaryAction.textContent = "Start";
  } else if (game.status !== GAME_STATUS.ONGOING) {
    elements.primaryAction.textContent = "Restart";
  } else if (running) {
    elements.primaryAction.textContent = "Pause";
  } else {
    elements.primaryAction.textContent = "Resume";
  }
}

function render() {
  renderer.render(game);
  updateStats();
  syncUiState();
  updateOverlay();
  setMessage(game.lastMessage);
}

function pauseGame() {
  running = false;
  syncUiState();
}

function loadScenarioDefinition(definition, reason = "loaded") {
  currentScenario = definition;
  accumulator = 0;
  game.loadScenarioText(definition.text);

  if (reason === "restart") {
    game.setMessage(
      `Nouveau scénario: ${definition.label}. Appuie sur Start pour repartir.`,
    );
  } else if (reason === "initial") {
    game.setMessage(
      `Scénario prêt: ${definition.label}. Appuie sur Start pour commencer.`,
    );
  } else {
    game.setMessage(`Scénario chargé: ${definition.label}.`);
  }
}

function restartWithRandomScenario() {
  hasStarted = false;
  running = false;
  const nextScenario = pickRandomScenario(currentScenario?.id ?? null);
  loadScenarioDefinition(nextScenario, currentScenario ? "restart" : "initial");
  render();
}

function handlePrimaryAction() {
  if (!hasStarted) {
    hasStarted = true;
    running = true;
    game.setMessage("Simulation lancée.");
    render();
    return;
  }

  if (game.status !== GAME_STATUS.ONGOING) {
    restartWithRandomScenario();
    return;
  }

  running = !running;
  game.setMessage(running ? "Simulation relancée." : "Simulation en pause.");
  render();
}

function updatePointerStats(worldPoint) {
  elements.statPointer.textContent = `${worldPoint.x.toFixed(1)}, ${worldPoint.y.toFixed(1)}`;
}

function canvasPointerToWorld(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return renderer.screenToWorld(x, y);
}

function handleCanvasLeftClick() {
  if (!canInteract()) {
    game.setMessage(
      !hasStarted
        ? "Appuie sur Start avant de jouer."
        : "La simulation doit être active pour interagir.",
    );
    render();
    return;
  }

  setMode(GAME_MODE.CONSTRUCTION);
  game.tryConstructChain(game.boundaryProjection);
  render();
}

function handleCanvasRightClick(worldPoint) {
  if (!canInteract()) {
    game.setMessage(
      !hasStarted
        ? "Appuie sur Start avant de jouer."
        : "La simulation doit être active pour interagir.",
    );
    render();
    return;
  }

  setMode(GAME_MODE.GUIDAGE);
  if (game.chain.getNbArticulations() > 1) {
    game.intermediateGuidanceGoal = game.computeIntermediateGoal(
      game.chain.getEffector(),
      worldPoint,
    );
    game.guidanceStep(game.intermediateGuidanceGoal);
  } else {
    game.setMessage("Le guidage demande au moins deux articulations.");
  }

  render();
}

function stepGame() {
  game.step();
  if (game.status !== GAME_STATUS.ONGOING) {
    pauseGame();
  }
  render();
}

function animationLoop(now) {
  const delta = now - lastFrame;
  lastFrame = now;

  if (running) {
    accumulator += delta;
    while (accumulator >= GAME_CONSTANTS.TICK_MS) {
      stepGame();
      accumulator -= GAME_CONSTANTS.TICK_MS;
      if (!running) {
        accumulator = 0;
        break;
      }
    }
  }

  requestAnimationFrame(animationLoop);
}

elements.primaryAction.addEventListener("click", handlePrimaryAction);
elements.restartAction.addEventListener("click", restartWithRandomScenario);

canvas.addEventListener("mousemove", (event) => {
  const worldPoint = canvasPointerToWorld(event);
  game.setPointerWorld(worldPoint);
  updatePointerStats(worldPoint);
  render();
});

canvas.addEventListener("click", (event) => {
  event.preventDefault();
  handleCanvasLeftClick();
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  const worldPoint = canvasPointerToWorld(event);
  handleCanvasRightClick(worldPoint);
});

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    handlePrimaryAction();
  }
});

window.addEventListener("resize", render);

restartWithRandomScenario();
requestAnimationFrame(animationLoop);
