import { GAME_CONSTANTS, GAME_MODE } from "./constants.js";

function cleanLine(line) {
  const normalized = line.replace(/\r$/, "").trim();
  if (!normalized || normalized.startsWith("#")) {
    return "";
  }
  return normalized;
}

function expectNumber(token, label) {
  const value = Number(token);
  if (!Number.isFinite(value)) {
    throw new Error(`Impossible de lire ${label}.`);
  }
  return value;
}

function parseParticule(line) {
  const tokens = line.split(/\s+/);
  if (tokens.length < 5) {
    throw new Error("Ligne particule invalide.");
  }
  return {
    position: {
      x: expectNumber(tokens[0], "x particule"),
      y: expectNumber(tokens[1], "y particule"),
    },
    angle: expectNumber(tokens[2], "angle particule"),
    displacement: expectNumber(tokens[3], "déplacement particule"),
    counter: expectNumber(tokens[4], "compteur particule"),
  };
}

function parseFaiseur(line) {
  const tokens = line.split(/\s+/);
  if (tokens.length < 6) {
    throw new Error("Ligne faiseur invalide.");
  }
  return {
    position: {
      x: expectNumber(tokens[0], "x faiseur"),
      y: expectNumber(tokens[1], "y faiseur"),
    },
    angle: expectNumber(tokens[2], "angle faiseur"),
    displacement: expectNumber(tokens[3], "déplacement faiseur"),
    radius: expectNumber(tokens[4], "rayon faiseur"),
    nbElements: Math.trunc(expectNumber(tokens[5], "nombre d'éléments")),
  };
}

function parseArticulation(line) {
  const tokens = line.split(/\s+/);
  if (tokens.length < 2) {
    throw new Error("Ligne articulation invalide.");
  }
  return {
    x: expectNumber(tokens[0], "x articulation"),
    y: expectNumber(tokens[1], "y articulation"),
  };
}

function validateScenarioData(data) {
  if (data.score <= 0 || data.score > GAME_CONSTANTS.SCORE_MAX) {
    throw new Error("Le score initial est invalide.");
  }

  if (data.mode !== GAME_MODE.CONSTRUCTION && data.mode !== GAME_MODE.GUIDAGE) {
    throw new Error("Le mode doit être CONSTRUCTION ou GUIDAGE.");
  }
}

export function parseScenarioText(text) {
  const lines = text
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  let index = 0;
  const nextLine = (label) => {
    const line = lines[index++];
    if (line === undefined) {
      throw new Error(`Scénario incomplet: ${label} manquant.`);
    }
    return line;
  };

  const score = Math.trunc(expectNumber(nextLine("score"), "score"));

  const nbParticules = Math.trunc(
    expectNumber(nextLine("nombre de particules"), "nombre de particules"),
  );
  const particles = [];
  for (let i = 0; i < nbParticules; i += 1) {
    particles.push(parseParticule(nextLine(`particule ${i}`)));
  }

  const nbFaiseurs = Math.trunc(
    expectNumber(nextLine("nombre de faiseurs"), "nombre de faiseurs"),
  );
  const faiseurs = [];
  for (let i = 0; i < nbFaiseurs; i += 1) {
    faiseurs.push(parseFaiseur(nextLine(`faiseur ${i}`)));
  }

  const nbArticulations = Math.trunc(
    expectNumber(nextLine("nombre d'articulations"), "nombre d'articulations"),
  );
  const articulations = [];
  for (let i = 0; i < nbArticulations; i += 1) {
    articulations.push(parseArticulation(nextLine(`articulation ${i}`)));
  }

  const mode = nextLine("mode");
  if (index < lines.length) {
    throw new Error("Le scénario contient des données supplémentaires.");
  }

  const data = { score, particles, faiseurs, articulations, mode };
  validateScenarioData(data);
  return data;
}
