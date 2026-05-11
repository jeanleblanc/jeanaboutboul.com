export const GAME_CONSTANTS = Object.freeze({
  EPSILON: 0.5,
  R_MAX: 100,
  R_MIN_FAISEUR: 1.5,
  R_MAX_FAISEUR: 5,
  R_CAPTURE: 18,
  R_VIZ: 0.9,
  D_MAX: 100 / 40,
  TIME_TO_SPLIT: 500,
  NB_PARTICULE_MAX: 50,
  DELTA_SPLIT: 0.5,
  COEF_SPLIT: 0.8,
  SCORE_MAX: 8000,
  TICK_MS: 25,
});

export const GAME_MODE = Object.freeze({
  CONSTRUCTION: "CONSTRUCTION",
  GUIDAGE: "GUIDAGE",
});

export const GAME_STATUS = Object.freeze({
  ONGOING: "ONGOING",
  WON: "WON",
  LOST: "LOST",
});
