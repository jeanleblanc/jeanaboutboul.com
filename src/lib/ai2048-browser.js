export const DIRECTIONS = ["up", "right", "down", "left"];

export const DIRECTION_SYMBOLS = {
  up: "\u2191",
  right: "\u2192",
  down: "\u2193",
  left: "\u2190",
};

const SMALL_TILE_VALUES = [
  0,
  2,
  4,
  8,
  16,
  32,
  64,
  128,
  256,
  512,
  1024,
  2048,
];

const SMALL_TILE_SET = new Set(SMALL_TILE_VALUES);
const SPAWN_DISTRIBUTION = [
  [2, 0.9],
  [4, 0.1],
];

const DEFAULT_WEIGHTS = {
  emptyWeight: 320,
  mergeWeight: 150,
  monotonicityWeight: 34,
  sumPenaltyWeight: 10,
  cornerWeight: 380,
  maxTileWeight: 68,
  mergeRewardWeight: 0.45,
  lostPenalty: 850000,
};

export const EXPECTIMAX_CPROB_THRESHOLD_BASE = 0.00045;

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function rotateClockwise(grid) {
  return grid[0].map((_, columnIndex) =>
    grid.map((row) => row[columnIndex]).reverse()
  );
}

function reflectHorizontally(grid) {
  return grid.map((row) => row.slice().reverse());
}

function transpose(grid) {
  return grid[0].map((_, columnIndex) => grid.map((row) => row[columnIndex]));
}

function reverseRows(grid) {
  return grid.map((row) => row.slice().reverse());
}

function gridToKey(grid) {
  return grid.flat().join(",");
}

function canonicalGridKey(grid) {
  const variants = [];
  let current = cloneGrid(grid);

  for (let rotationIndex = 0; rotationIndex < 4; rotationIndex += 1) {
    variants.push(gridToKey(current));
    variants.push(gridToKey(reflectHorizontally(current)));
    current = rotateClockwise(current);
  }

  variants.sort();
  return variants[0];
}

function collapseLineDynamic(line) {
  const compressed = line.filter((value) => value !== 0);
  const result = [];
  let mergedScore = 0;

  for (let index = 0; index < compressed.length; index += 1) {
    const value = compressed[index];

    if (compressed[index + 1] === value) {
      const mergedValue = value * 2;
      result.push(mergedValue);
      mergedScore += mergedValue;
      index += 1;
      continue;
    }

    result.push(value);
  }

  while (result.length < 4) {
    result.push(0);
  }

  return {
    line: result,
    mergedScore,
    changed: result.some((value, index) => value !== line[index]),
  };
}

function buildLeftMoveCache() {
  const cache = new Map();

  for (const a of SMALL_TILE_VALUES) {
    for (const b of SMALL_TILE_VALUES) {
      for (const c of SMALL_TILE_VALUES) {
        for (const d of SMALL_TILE_VALUES) {
          const line = [a, b, c, d];
          cache.set(gridToKey([line]), collapseLineDynamic(line));
        }
      }
    }
  }

  return cache;
}

const LEFT_MOVE_CACHE = buildLeftMoveCache();

export const MOVE_CACHE_SIZE = LEFT_MOVE_CACHE.size;

function applyLeftMove(line) {
  if (line.every((value) => SMALL_TILE_SET.has(value))) {
    const cached = LEFT_MOVE_CACHE.get(gridToKey([line]));
    if (cached) {
      return {
        line: cached.line.slice(),
        mergedScore: cached.mergedScore,
        changed: cached.changed,
      };
    }
  }

  return collapseLineDynamic(line);
}

export function simulateLeftLine(line) {
  const normalizedLine = Array.from({ length: 4 }, (_, index) => line[index] ?? 0);
  const cacheable = normalizedLine.every((value) => SMALL_TILE_SET.has(value));
  const cached = cacheable ? LEFT_MOVE_CACHE.get(gridToKey([normalizedLine])) : null;
  const result = applyLeftMove(normalizedLine);

  return {
    ...result,
    fromCache: Boolean(cached),
  };
}

function orientGridForMove(grid, direction) {
  if (direction === "left") {
    return cloneGrid(grid);
  }

  if (direction === "right") {
    return reverseRows(grid);
  }

  if (direction === "up") {
    return transpose(grid);
  }

  return reverseRows(transpose(grid));
}

function restoreGridOrientation(grid, direction) {
  if (direction === "left") {
    return cloneGrid(grid);
  }

  if (direction === "right") {
    return reverseRows(grid);
  }

  if (direction === "up") {
    return transpose(grid);
  }

  return transpose(reverseRows(grid));
}

function countEmptyCells(grid) {
  let total = 0;

  for (const row of grid) {
    for (const value of row) {
      if (value === 0) {
        total += 1;
      }
    }
  }

  return total;
}

function getEmptyPositions(grid) {
  const cells = [];

  grid.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value === 0) {
        cells.push([rowIndex, columnIndex]);
      }
    });
  });

  return cells;
}

function getMaxTile(grid) {
  return Math.max(...grid.flat());
}

function countDistinctNonZeroTiles(grid) {
  const values = new Set();

  grid.flat().forEach((value) => {
    if (value !== 0) {
      values.add(value);
    }
  });

  return values.size;
}

function log2Value(value) {
  return value > 0 ? Math.log2(value) : 0;
}

function buildLogGrid(grid) {
  return grid.map((row) => row.map((value) => log2Value(value)));
}

function countPotentialMerges(grid) {
  let total = 0;

  for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
      const value = grid[rowIndex][columnIndex];
      if (value === 0) {
        continue;
      }

      if (columnIndex < 3 && grid[rowIndex][columnIndex + 1] === value) {
        total += 1;
      }

      if (rowIndex < 3 && grid[rowIndex + 1][columnIndex] === value) {
        total += 1;
      }
    }
  }

  return total;
}

function lineMonotonicityPenalty(line) {
  let ascendingPenalty = 0;
  let descendingPenalty = 0;

  for (let index = 0; index < line.length - 1; index += 1) {
    const current = line[index];
    const next = line[index + 1];

    if (current === 0 || next === 0) {
      continue;
    }

    if (current > next) {
      ascendingPenalty += current - next;
    } else if (next > current) {
      descendingPenalty += next - current;
    }
  }

  return Math.min(ascendingPenalty, descendingPenalty);
}

function computeMonotonicityPenalty(logGrid) {
  let totalPenalty = 0;

  for (const row of logGrid) {
    totalPenalty += lineMonotonicityPenalty(row);
  }

  for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
    const column = logGrid.map((row) => row[columnIndex]);
    totalPenalty += lineMonotonicityPenalty(column);
  }

  return totalPenalty;
}

function computeSumPenalty(logGrid) {
  let total = 0;

  for (const row of logGrid) {
    for (const rank of row) {
      total += rank ** 2;
    }
  }

  return total;
}

function cornerAnchorScore(grid) {
  const maxTile = getMaxTile(grid);
  if (maxTile === 0) {
    return 0;
  }

  const corners = [
    grid[0][0],
    grid[0][3],
    grid[3][0],
    grid[3][3],
  ];

  return corners.includes(maxTile) ? log2Value(maxTile) : 0;
}

export function evaluateBoard(grid, weights = DEFAULT_WEIGHTS) {
  const logGrid = buildLogGrid(grid);
  const emptyCells = countEmptyCells(grid);
  const potentialMerges = countPotentialMerges(grid);
  const monotonicityPenalty = computeMonotonicityPenalty(logGrid);
  const sumPenalty = computeSumPenalty(logGrid);
  const maxTileRank = log2Value(getMaxTile(grid));
  const cornerAnchor = cornerAnchorScore(grid);

  const contributions = {
    emptySpace: emptyCells * weights.emptyWeight,
    mergePotential: potentialMerges * weights.mergeWeight,
    monotonicity: -monotonicityPenalty * weights.monotonicityWeight,
    loadPenalty: -sumPenalty * weights.sumPenaltyWeight,
    cornerAnchor: cornerAnchor * weights.cornerWeight,
    maxTile: maxTileRank * weights.maxTileWeight,
  };

  const total = Object.values(contributions).reduce(
    (sum, contribution) => sum + contribution,
    0
  );

  return {
    total,
    contributions,
    features: {
      emptyCells,
      potentialMerges,
      monotonicityPenalty,
      sumPenalty,
      maxTileRank,
      cornerAnchor,
    },
  };
}

export function createInitialState(random = Math.random) {
  let state = {
    grid: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    score: 0,
    moveCount: 0,
    lastMergeScore: 0,
    over: false,
  };

  state = spawnRandomTile(state, random);
  state = spawnRandomTile(state, random);

  return state;
}

export function applyMove(state, direction) {
  const orientedGrid = orientGridForMove(state.grid, direction);
  const movedRows = [];
  let mergedScore = 0;
  let changed = false;

  for (const row of orientedGrid) {
    const result = applyLeftMove(row);
    movedRows.push(result.line);
    mergedScore += result.mergedScore;
    changed ||= result.changed;
  }

  if (!changed) {
    return {
      changed: false,
      mergedScore: 0,
      state,
    };
  }

  const restoredGrid = restoreGridOrientation(movedRows, direction);

  return {
    changed: true,
    mergedScore,
    state: {
      grid: restoredGrid,
      score: state.score + mergedScore,
      moveCount: state.moveCount + 1,
      lastMergeScore: mergedScore,
      over: false,
    },
  };
}

function spawnTileAt(state, rowIndex, columnIndex, value) {
  const nextGrid = cloneGrid(state.grid);
  nextGrid[rowIndex][columnIndex] = value;

  return {
    ...state,
    grid: nextGrid,
    over: isGameOver(nextGrid),
  };
}

export function spawnRandomTile(state, random = Math.random) {
  const emptyCells = getEmptyPositions(state.grid);

  if (emptyCells.length === 0) {
    return {
      ...state,
      over: isGameOver(state.grid),
    };
  }

  const [rowIndex, columnIndex] =
    emptyCells[Math.floor(random() * emptyCells.length)];
  const value = random() < 0.9 ? 2 : 4;

  return spawnTileAt(state, rowIndex, columnIndex, value);
}

export function playMove(state, direction, random = Math.random) {
  const moved = applyMove(state, direction);

  if (!moved.changed) {
    return moved;
  }

  return {
    changed: true,
    mergedScore: moved.mergedScore,
    state: spawnRandomTile(moved.state, random),
  };
}

export function getLegalMoves(state) {
  return DIRECTIONS.filter((direction) => applyMove(state, direction).changed);
}

export function isGameOver(grid) {
  const probeState = {
    grid,
    score: 0,
    moveCount: 0,
    lastMergeScore: 0,
    over: false,
  };

  return DIRECTIONS.every((direction) => !applyMove(probeState, direction).changed);
}

export function chooseSearchDepth(state, requestedDepth = "auto") {
  if (requestedDepth === 2 || requestedDepth === 3) {
    return requestedDepth;
  }

  const emptyCells = countEmptyCells(state.grid);
  const distinctTiles = countDistinctNonZeroTiles(state.grid);

  if (emptyCells >= 6 && distinctTiles <= 7) {
    return 2;
  }

  return 3;
}

function quickMoveOrderingScore(candidateState, mergedScore) {
  return (
    evaluateBoard(candidateState.grid).total +
    mergedScore * DEFAULT_WEIGHTS.mergeRewardWeight
  );
}

function evaluateTerminalState(state) {
  const evaluation = evaluateBoard(state.grid);
  return evaluation.total - DEFAULT_WEIGHTS.lostPenalty;
}

function expectimaxMaxNode(state, depth, cumulativeProbability, cache, stats) {
  stats.nodesVisited += 1;

  if (state.over) {
    stats.leafEvaluations += 1;
    return evaluateTerminalState(state);
  }

  if (depth <= 0) {
    stats.leafEvaluations += 1;
    return evaluateBoard(state.grid).total;
  }

  const cacheKey = `${canonicalGridKey(state.grid)}|${depth}|max`;
  if (cache.has(cacheKey)) {
    stats.cacheHits += 1;
    return cache.get(cacheKey);
  }

  const candidates = DIRECTIONS.map((direction) => {
    const moved = applyMove(state, direction);
    if (!moved.changed) {
      return null;
    }

    return {
      direction,
      movedState: moved.state,
      mergedScore: moved.mergedScore,
      orderingScore: quickMoveOrderingScore(moved.state, moved.mergedScore),
    };
  })
    .filter(Boolean)
    .sort((left, right) => right.orderingScore - left.orderingScore);

  if (candidates.length === 0) {
    stats.leafEvaluations += 1;
    const terminalValue = evaluateTerminalState({
      ...state,
      over: true,
    });
    cache.set(cacheKey, terminalValue);
    return terminalValue;
  }

  let bestValue = -Infinity;

  for (const candidate of candidates) {
    const continuation =
      candidate.mergedScore * DEFAULT_WEIGHTS.mergeRewardWeight +
      expectimaxChanceNode(
        candidate.movedState,
        depth - 1,
        cumulativeProbability,
        cache,
        stats
      );

    if (continuation > bestValue) {
      bestValue = continuation;
    }
  }

  cache.set(cacheKey, bestValue);
  return bestValue;
}

function expectimaxChanceNode(state, depth, cumulativeProbability, cache, stats) {
  stats.nodesVisited += 1;

  if (state.over) {
    stats.leafEvaluations += 1;
    return evaluateTerminalState(state);
  }

  const cacheKey = `${canonicalGridKey(state.grid)}|${depth}|chance`;
  if (cache.has(cacheKey)) {
    stats.cacheHits += 1;
    return cache.get(cacheKey);
  }

  const emptyCells = getEmptyPositions(state.grid);
  if (emptyCells.length === 0) {
    const value = expectimaxMaxNode(
      {
        ...state,
        over: isGameOver(state.grid),
      },
      depth,
      cumulativeProbability,
      cache,
      stats
    );
    cache.set(cacheKey, value);
    return value;
  }

  const cellProbability = 1 / emptyCells.length;
  let expectedValue = 0;

  for (const [rowIndex, columnIndex] of emptyCells) {
    for (const [tileValue, spawnProbability] of SPAWN_DISTRIBUTION) {
      const branchProbability = cellProbability * spawnProbability;
      const cumulativeBranchProbability =
        cumulativeProbability * branchProbability;
      const spawnedState = spawnTileAt(state, rowIndex, columnIndex, tileValue);

      let continuationValue;
      if (
        depth <= 0 ||
        cumulativeBranchProbability < EXPECTIMAX_CPROB_THRESHOLD_BASE
      ) {
        stats.leafEvaluations += 1;
        continuationValue = evaluateBoard(spawnedState.grid).total;
      } else {
        continuationValue = expectimaxMaxNode(
          spawnedState,
          depth,
          cumulativeBranchProbability,
          cache,
          stats
        );
      }

      expectedValue += branchProbability * continuationValue;
    }
  }

  cache.set(cacheKey, expectedValue);
  return expectedValue;
}

export function analyzePosition(state, requestedDepth = "auto") {
  const depth = chooseSearchDepth(state, requestedDepth);
  const cache = new Map();
  const stats = {
    cacheHits: 0,
    leafEvaluations: 0,
    nodesVisited: 0,
  };

  const orderedCandidates = DIRECTIONS.map((direction) => {
    const moved = applyMove(state, direction);
    if (!moved.changed) {
      return null;
    }

    return {
      direction,
      movedState: moved.state,
      mergedScore: moved.mergedScore,
      orderingScore: quickMoveOrderingScore(moved.state, moved.mergedScore),
    };
  })
    .filter(Boolean)
    .sort((left, right) => right.orderingScore - left.orderingScore);

  let bestMove = null;
  let bestValue = -Infinity;
  const valueByDirection = new Map();

  for (const candidate of orderedCandidates) {
    const value =
      candidate.mergedScore * DEFAULT_WEIGHTS.mergeRewardWeight +
      expectimaxChanceNode(candidate.movedState, depth - 1, 1, cache, stats);

    valueByDirection.set(candidate.direction, value);

    if (value > bestValue) {
      bestValue = value;
      bestMove = candidate.direction;
    }
  }

  const evaluation = evaluateBoard(state.grid);
  const moveTable = DIRECTIONS.map((direction) => ({
    direction,
    symbol: DIRECTION_SYMBOLS[direction],
    legal: valueByDirection.has(direction),
    isBest: direction === bestMove,
    value: valueByDirection.get(direction) ?? null,
  }));

  return {
    bestMove,
    bestValue: Number.isFinite(bestValue) ? bestValue : null,
    depth,
    moveTable,
    heuristics: evaluation,
    summary: {
      score: state.score,
      bestTile: getMaxTile(state.grid),
      emptyCells: evaluation.features.emptyCells,
      moveCount: state.moveCount,
    },
    stats,
  };
}

export function stepExpectimax(state, requestedDepth = "auto", random = Math.random) {
  const analysis = analyzePosition(state, requestedDepth);

  if (!analysis.bestMove) {
    return {
      changed: false,
      analysis,
      state: {
        ...state,
        over: true,
      },
    };
  }

  const result = playMove(state, analysis.bestMove, random);

  return {
    ...result,
    analysis,
  };
}
