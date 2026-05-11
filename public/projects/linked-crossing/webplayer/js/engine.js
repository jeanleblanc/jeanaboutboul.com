import { GAME_CONSTANTS, GAME_MODE, GAME_STATUS } from "./constants.js";
import {
  clonePoint,
  distance,
  doCirclesIntersect,
  formatNumber,
  isPointInCircle,
  limitPointFrom,
  normalizeAngle,
  projectToArenaBoundary,
} from "./geometry.js";
import { parseScenarioText } from "./parser.js";

function handleArenaCollision(entity, radiusOffset = 0) {
  const nextPos = {
    x: entity.position.x + entity.displacement * Math.cos(entity.angle),
    y: entity.position.y + entity.displacement * Math.sin(entity.angle),
  };

  const limitBoundary = GAME_CONSTANTS.R_MAX - radiusOffset;
  const effectiveLimit = Math.max(0, limitBoundary - GAME_CONSTANTS.EPSILON);

  if (distance({ x: 0, y: 0 }, nextPos) < effectiveLimit) {
    entity.position = nextPos;
    return false;
  }

  const normalAngle = Math.atan2(entity.position.y, entity.position.x);
  const reflectedAngle = normalizeAngle(Math.PI + 2 * normalAngle - entity.angle);
  entity.angle = reflectedAngle;
  entity.position = {
    x: entity.position.x + entity.displacement * Math.cos(reflectedAngle),
    y: entity.position.y + entity.displacement * Math.sin(reflectedAngle),
  };

  const d = distance({ x: 0, y: 0 }, entity.position);
  if (d > effectiveLimit) {
    if (d > GAME_CONSTANTS.EPSILON) {
      const ratio = effectiveLimit / d;
      entity.position.x *= ratio;
      entity.position.y *= ratio;
    } else {
      entity.position = { x: 0, y: 0 };
    }
  }

  return true;
}

class Particle {
  constructor({ position, angle, displacement, counter }) {
    this.position = clonePoint(position);
    this.angle = normalizeAngle(angle);
    this.displacement = Math.min(Math.max(displacement, 0), GAME_CONSTANTS.D_MAX);
    this.counter = Math.max(0, Math.trunc(counter));
  }

  clone() {
    return new Particle(this);
  }

  incrementInternalCounter() {
    if (this.counter < GAME_CONSTANTS.TIME_TO_SPLIT - 1) {
      this.counter += 1;
    } else if (this.counter === GAME_CONSTANTS.TIME_TO_SPLIT - 1) {
      this.counter = GAME_CONSTANTS.TIME_TO_SPLIT;
    }
  }

  shouldSplit() {
    return this.counter >= GAME_CONSTANTS.TIME_TO_SPLIT;
  }

  update() {
    this.incrementInternalCounter();
    if (!this.shouldSplit()) {
      handleArenaCollision(this, 0);
    }
  }

  split() {
    const nextDisplacement = Math.min(
      this.displacement * GAME_CONSTANTS.COEF_SPLIT,
      GAME_CONSTANTS.D_MAX,
    );
    return [
      new Particle({
        position: this.position,
        angle: this.angle + GAME_CONSTANTS.DELTA_SPLIT,
        displacement: nextDisplacement,
        counter: 0,
      }),
      new Particle({
        position: this.position,
        angle: this.angle - GAME_CONSTANTS.DELTA_SPLIT,
        displacement: nextDisplacement,
        counter: 0,
      }),
    ];
  }

  performMove() {
    handleArenaCollision(this, 0);
  }
}

class Faiseur {
  constructor({ position, angle, displacement, radius, nbElements }) {
    this.position = clonePoint(position);
    this.angle = normalizeAngle(angle);
    this.displacement = Math.min(Math.max(displacement, 0), GAME_CONSTANTS.D_MAX);
    this.radius = Math.min(
      Math.max(radius, GAME_CONSTANTS.R_MIN_FAISEUR),
      GAME_CONSTANTS.R_MAX_FAISEUR,
    );
    this.nbElements = Math.max(1, Math.trunc(nbElements));
  }

  clone() {
    return new Faiseur(this);
  }

  update() {
    handleArenaCollision(this, this.radius);
  }

  computeEffectiveLimit() {
    const boundary = GAME_CONSTANTS.R_MAX - this.radius;
    return boundary > GAME_CONSTANTS.EPSILON
      ? boundary - GAME_CONSTANTS.EPSILON
      : 0;
  }

  stepBackward(position, angle) {
    return {
      x: position.x + this.displacement * Math.cos(angle),
      y: position.y + this.displacement * Math.sin(angle),
    };
  }

  reflectIfNeeded(origin, candidate, angle, limit) {
    if (distance({ x: 0, y: 0 }, candidate) < limit) {
      return { next: candidate, angle };
    }

    const normalAngle = Math.atan2(origin.y, origin.x);
    const reflected = normalizeAngle(Math.PI + 2 * normalAngle - angle);
    return {
      next: this.stepBackward(origin, reflected),
      angle: reflected,
    };
  }

  clampPosition(position, limit) {
    const d = distance({ x: 0, y: 0 }, position);
    if (d <= limit || d < GAME_CONSTANTS.EPSILON) {
      return position;
    }

    const ratio = limit / d;
    return { x: position.x * ratio, y: position.y * ratio };
  }

  getElements() {
    const elements = [{ center: clonePoint(this.position), radius: this.radius }];
    if (this.nbElements === 1) {
      return elements;
    }

    let current = clonePoint(this.position);
    let backAngle = normalizeAngle(this.angle + Math.PI);
    const limit = this.computeEffectiveLimit();

    for (let i = 1; i < this.nbElements; i += 1) {
      let next = this.stepBackward(current, backAngle);
      const reflected = this.reflectIfNeeded(current, next, backAngle, limit);
      next = this.clampPosition(reflected.next, limit);
      backAngle = reflected.angle;
      elements.push({ center: next, radius: this.radius });
      current = next;
    }

    return elements;
  }

  collidesWith(other, useEpsilon = true) {
    const a = this.getElements();
    const b = other.getElements();
    return a.some((elemA) =>
      b.some((elemB) => doCirclesIntersect(elemA, elemB, useEpsilon)),
    );
  }
}

class Chain {
  constructor(articulations = []) {
    this.articulations = articulations.map(clonePoint);
  }

  clone() {
    return new Chain(this.articulations);
  }

  isEmpty() {
    return this.articulations.length === 0;
  }

  getNbArticulations() {
    return this.articulations.length;
  }

  getRoot() {
    return this.articulations[0] ?? { x: 0, y: 0 };
  }

  getEffector() {
    return this.articulations[this.articulations.length - 1] ?? { x: 0, y: 0 };
  }

  getFinalGoal() {
    if (this.isEmpty()) {
      return { x: 0, y: 0 };
    }

    const root = this.getRoot();
    const d = distance({ x: 0, y: 0 }, root);
    if (d < GAME_CONSTANTS.EPSILON) {
      return { x: GAME_CONSTANTS.R_MAX, y: 0 };
    }

    const scale = GAME_CONSTANTS.R_MAX / d;
    return { x: -root.x * scale, y: -root.y * scale };
  }

  addArticulation(point) {
    if (distance({ x: 0, y: 0 }, point) >= GAME_CONSTANTS.R_MAX) {
      return false;
    }

    if (this.isEmpty()) {
      this.articulations.push(clonePoint(point));
      return true;
    }

    const last = this.getEffector();
    const d = distance(last, point);
    if (d > GAME_CONSTANTS.R_CAPTURE || d < GAME_CONSTANTS.EPSILON) {
      return false;
    }

    this.articulations.push(clonePoint(point));
    return true;
  }

  collidesWithFaiseur(faiseur, useEpsilon = true) {
    const elements = faiseur.getElements();
    return this.articulations.some((articulation) =>
      elements.some((element) => isPointInCircle(articulation, element, useEpsilon)),
    );
  }
}

export class LinkedCrossingGame {
  constructor() {
    this.lastMessage = "Démo prête.";
    this.pointerWorld = { x: 0, y: 0 };
    this.boundaryProjection = { x: GAME_CONSTANTS.R_MAX, y: 0 };
    this.initialScenarioText = "";
    this.reset();
  }

  reset() {
    this.score = 0;
    this.mode = GAME_MODE.CONSTRUCTION;
    this.status = GAME_STATUS.ONGOING;
    this.particles = [];
    this.faiseurs = [];
    this.chain = new Chain();
    this.intermediateGuidanceGoal = { x: 0, y: 0 };
  }

  loadScenarioText(text) {
    const data = parseScenarioText(text);
    this.initialScenarioText = text;
    this.loadScenarioData(data);
    this.lastMessage = "Scénario chargé.";
  }

  loadScenarioData(data) {
    this.score = data.score;
    this.mode = data.mode;
    this.status = GAME_STATUS.ONGOING;
    this.particles = data.particles.map((particle) => new Particle(particle));
    this.faiseurs = data.faiseurs.map((faiseur) => new Faiseur(faiseur));
    this.chain = new Chain(data.articulations);
    this.intermediateGuidanceGoal = this.chain.isEmpty()
      ? { x: 0, y: 0 }
      : this.chain.getEffector();
  }

  restart() {
    if (!this.initialScenarioText) {
      return;
    }
    this.loadScenarioText(this.initialScenarioText);
  }

  serialize() {
    const parts = [
      "# Linked-Crossing web save",
      "#",
      `${this.score}`,
      "",
      "# Particules",
      `${this.particles.length}`,
      ...this.particles.map(
        (particle) =>
          `    ${formatNumber(particle.position.x)} ${formatNumber(particle.position.y)} ${formatNumber(particle.angle)} ${formatNumber(particle.displacement)} ${particle.counter}`,
      ),
      "",
      "# Faiseurs",
      `${this.faiseurs.length}`,
      ...this.faiseurs.map(
        (faiseur) =>
          `    ${formatNumber(faiseur.position.x)} ${formatNumber(faiseur.position.y)} ${formatNumber(faiseur.angle)} ${formatNumber(faiseur.displacement)} ${formatNumber(faiseur.radius)} ${faiseur.nbElements}`,
      ),
      "",
      "# Articulations",
      `${this.chain.getNbArticulations()}`,
      ...this.chain.articulations.map(
        (articulation) =>
          `    ${formatNumber(articulation.x)} ${formatNumber(articulation.y)}`,
      ),
      "",
      this.mode,
      "",
    ];

    return parts.join("\n");
  }

  setMode(mode) {
    this.mode = mode;
  }

  setMessage(message) {
    this.lastMessage = message;
  }

  setPointerWorld(point) {
    this.pointerWorld = clonePoint(point);
    this.boundaryProjection = projectToArenaBoundary(point);

    if (this.mode === GAME_MODE.GUIDAGE && !this.chain.isEmpty()) {
      this.intermediateGuidanceGoal = this.computeIntermediateGoal(
        this.chain.getEffector(),
        point,
      );
    }
  }

  tryConstructChain(point) {
    if (this.status !== GAME_STATUS.ONGOING) {
      return false;
    }

    const captureCenter = this.chain.isEmpty() ? point : this.chain.getEffector();
    const candidates = [];
    this.particles.forEach((particle, index) => {
      if (distance(captureCenter, particle.position) < GAME_CONSTANTS.R_CAPTURE) {
        candidates.push(index);
      }
    });

    if (candidates.length > 1) {
      this.lastMessage = "Capture annulée: plusieurs particules dans la zone.";
      return false;
    }

    if (candidates.length === 0) {
      this.lastMessage = "Aucune particule capturable ici.";
      return false;
    }

    const particleIndex = candidates[0];
    const particle = this.particles[particleIndex];
    const added = this.chain.addArticulation(particle.position);
    if (!added) {
      this.lastMessage = "Articulation refusée: géométrie invalide.";
      return false;
    }

    this.particles.splice(particleIndex, 1);
    this.checkGameStatus();
    this.lastMessage = "Articulation capturée.";
    return true;
  }

  computeIntermediateGoal(effector, target) {
    return limitPointFrom(effector, target, GAME_CONSTANTS.R_CAPTURE);
  }

  canGuide() {
    return this.status === GAME_STATUS.ONGOING && this.chain.getNbArticulations() >= 2;
  }

  fabrikPhase1(current, goal) {
    const pPrime = current.map(clonePoint);
    pPrime[pPrime.length - 1] = clonePoint(goal);

    for (let i = current.length - 2; i >= 0; i -= 1) {
      const origin = current[i];
      const next = pPrime[i + 1];
      const dx = origin.x - next.x;
      const dy = origin.y - next.y;
      const d = Math.hypot(dx, dy);
      const length = distance(current[i], current[i + 1]);

      pPrime[i] =
        d < GAME_CONSTANTS.EPSILON
          ? clonePoint(next)
          : {
              x: next.x + (dx / d) * length,
              y: next.y + (dy / d) * length,
            };
    }

    return pPrime;
  }

  fabrikPhase2(original, pPrime) {
    const pDoublePrime = original.map(clonePoint);
    pDoublePrime[0] = clonePoint(original[0]);

    for (let i = 1; i < original.length; i += 1) {
      const prev = pDoublePrime[i - 1];
      const target = pPrime[i];
      const dx = target.x - prev.x;
      const dy = target.y - prev.y;
      const d = Math.hypot(dx, dy);
      const length = distance(original[i - 1], original[i]);

      pDoublePrime[i] =
        d < GAME_CONSTANTS.EPSILON
          ? clonePoint(prev)
          : {
              x: prev.x + (dx / d) * length,
              y: prev.y + (dy / d) * length,
            };
    }

    return pDoublePrime;
  }

  isValidConfiguration(config) {
    for (const point of config) {
      if (distance({ x: 0, y: 0 }, point) >= GAME_CONSTANTS.R_MAX) {
        return false;
      }
    }

    const candidate = new Chain();
    for (const point of config) {
      if (!candidate.addArticulation(point)) {
        return false;
      }
    }

    return candidate.getNbArticulations() === config.length;
  }

  applyConfiguration(config) {
    this.chain = new Chain(config);
  }

  guidanceStep(target) {
    if (!this.canGuide()) {
      return false;
    }

    const articulations = this.chain.articulations;
    const intermediate = this.computeIntermediateGoal(
      articulations[articulations.length - 1],
      target,
    );
    const pPrime = this.fabrikPhase1(articulations, intermediate);
    const pDoublePrime = this.fabrikPhase2(articulations, pPrime);

    if (!this.isValidConfiguration(pDoublePrime)) {
      this.lastMessage = "Guidage refusé: configuration invalide.";
      return false;
    }

    this.intermediateGuidanceGoal = intermediate;
    this.applyConfiguration(pDoublePrime);
    this.checkGameStatus();
    this.lastMessage = "Guidage appliqué.";
    return true;
  }

  updateParticles() {
    const next = [];
    let liveCount = this.particles.length;

    for (const particle of this.particles) {
      particle.update();
      if (particle.shouldSplit()) {
        if (liveCount + 1 > GAME_CONSTANTS.NB_PARTICULE_MAX) {
          continue;
        }

        const [a, b] = particle.split();
        a.performMove();
        b.performMove();
        next.push(a, b);
        liveCount += 1;
      } else {
        next.push(particle);
      }
    }

    this.particles = next;
  }

  canFaiseurMove(index) {
    const simulated = this.faiseurs[index].clone();
    simulated.update();
    const nextElements = simulated.getElements();

    for (let i = 0; i < this.faiseurs.length; i += 1) {
      if (i === index) continue;
      const otherElements = this.faiseurs[i].getElements();
      for (const candidate of nextElements) {
        for (const other of otherElements) {
          if (doCirclesIntersect(candidate, other, true)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  handleChainCollision() {
    if (this.chain.isEmpty()) {
      return;
    }

    for (const faiseur of this.faiseurs) {
      if (this.chain.collidesWithFaiseur(faiseur, true)) {
        this.chain = new Chain();
        this.lastMessage = "Chaîne détruite par un faiseur.";
        break;
      }
    }
  }

  updateFaiseurs() {
    for (let i = 0; i < this.faiseurs.length; i += 1) {
      if (this.canFaiseurMove(i)) {
        this.faiseurs[i].update();
      }
    }

    this.handleChainCollision();
  }

  checkGameStatus() {
    if (this.status !== GAME_STATUS.ONGOING) {
      return;
    }

    if (!this.chain.isEmpty()) {
      const effector = this.chain.getEffector();
      const goal = this.chain.getFinalGoal();
      if (distance(effector, goal) <= GAME_CONSTANTS.R_CAPTURE) {
        this.status = GAME_STATUS.WON;
        this.lastMessage = `Victoire. Score final: ${this.score}.`;
        return;
      }
    }

    if (this.score === 0) {
      this.status = GAME_STATUS.LOST;
      this.lastMessage = "Défaite: le score est tombé à zéro.";
    }
  }

  step() {
    if (this.status !== GAME_STATUS.ONGOING) {
      return;
    }

    if (this.score > 0) {
      this.score -= 1;
    } else {
      this.status = GAME_STATUS.LOST;
      this.lastMessage = "Défaite: le score est tombé à zéro.";
      return;
    }

    this.updateParticles();
    this.updateFaiseurs();

    let chainMovedByGuidance = false;
    if (this.mode === GAME_MODE.GUIDAGE && this.chain.getNbArticulations() > 1) {
      chainMovedByGuidance = this.guidanceStep(this.intermediateGuidanceGoal);
    }

    if (chainMovedByGuidance) {
      this.handleChainCollision();
    }

    this.checkGameStatus();
  }

  getStats() {
    return {
      score: this.score,
      particles: this.particles.length,
      faiseurs: this.faiseurs.length,
      articulations: this.chain.getNbArticulations(),
      mode: this.mode,
      status: this.status,
    };
  }
}
