import { GAME_CONSTANTS } from "./constants.js";

export function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function normalizeAngle(angle) {
  let value = (angle + Math.PI) % (2 * Math.PI);
  if (value < 0) value += 2 * Math.PI;
  return value - Math.PI;
}

export function isPointInCircle(point, circle, useEpsilon = true) {
  const d = distance(point, circle.center);
  return useEpsilon
    ? d < circle.radius - GAME_CONSTANTS.EPSILON
    : d < circle.radius;
}

export function doCirclesIntersect(a, b, useEpsilon = true) {
  const d = distance(a.center, b.center);
  const sumR = a.radius + b.radius;
  return useEpsilon ? d < sumR + GAME_CONSTANTS.EPSILON : d < sumR;
}

export function limitPointFrom(origin, target, maxDistance) {
  const d = distance(origin, target);
  if (d <= maxDistance || d < GAME_CONSTANTS.EPSILON) {
    return { ...target };
  }

  const ratio = maxDistance / d;
  return {
    x: origin.x + (target.x - origin.x) * ratio,
    y: origin.y + (target.y - origin.y) * ratio,
  };
}

export function projectToArenaBoundary(point) {
  const d = Math.hypot(point.x, point.y);
  if (d < GAME_CONSTANTS.EPSILON) {
    return { x: GAME_CONSTANTS.R_MAX, y: 0 };
  }

  const scale = GAME_CONSTANTS.R_MAX / d;
  return {
    x: point.x * scale,
    y: point.y * scale,
  };
}

export function clonePoint(point) {
  return { x: point.x, y: point.y };
}

export function formatNumber(value) {
  return Number(value.toFixed(6)).toString();
}
