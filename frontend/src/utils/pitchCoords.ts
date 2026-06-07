type Coord = { x: number; y: number };
type SlotMap = Record<string, Coord[]>;

const FORMATION_COORDS: Record<string, SlotMap> = {
  '4-3-3': {
    GK: [{ x: 5, y: 50 }],
    DF: [{ x: 18, y: 18 }, { x: 18, y: 38 }, { x: 18, y: 62 }, { x: 18, y: 82 }],
    MF: [{ x: 33, y: 25 }, { x: 33, y: 50 }, { x: 33, y: 75 }],
    FW: [{ x: 44, y: 20 }, { x: 44, y: 50 }, { x: 44, y: 80 }],
  },
  '4-4-2': {
    GK: [{ x: 5, y: 50 }],
    DF: [{ x: 18, y: 18 }, { x: 18, y: 38 }, { x: 18, y: 62 }, { x: 18, y: 82 }],
    MF: [{ x: 30, y: 15 }, { x: 30, y: 38 }, { x: 30, y: 62 }, { x: 30, y: 85 }],
    FW: [{ x: 44, y: 30 }, { x: 44, y: 70 }],
  },
  '4-2-3-1': {
    GK: [{ x: 5, y: 50 }],
    DF: [{ x: 18, y: 18 }, { x: 18, y: 38 }, { x: 18, y: 62 }, { x: 18, y: 82 }],
    MF: [
      { x: 28, y: 35 }, { x: 28, y: 65 },
      { x: 37, y: 18 }, { x: 37, y: 50 }, { x: 37, y: 82 },
    ],
    FW: [{ x: 45, y: 50 }],
  },
  '3-5-2': {
    GK: [{ x: 5, y: 50 }],
    DF: [{ x: 18, y: 25 }, { x: 18, y: 50 }, { x: 18, y: 75 }],
    MF: [{ x: 28, y: 12 }, { x: 28, y: 30 }, { x: 28, y: 50 }, { x: 28, y: 70 }, { x: 28, y: 88 }],
    FW: [{ x: 44, y: 30 }, { x: 44, y: 70 }],
  },
};

const FALLBACK = FORMATION_COORDS['4-3-3'];

/**
 * Returns one {x,y} coordinate per player ordered GK→DF→MF→FW.
 * For home (left half) isHome=true; for away (right half) x is mirrored.
 */
export function getFormationCoords(
  formation: string,
  players: Array<{ position: 'GK' | 'DF' | 'MF' | 'FW' }>,
  isHome: boolean,
): Coord[] {
  const slots = FORMATION_COORDS[formation] ?? FALLBACK;
  const used: Record<string, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };

  return players.map((p) => {
    const pos = p.position as string;
    const idx = used[pos] ?? 0;
    used[pos] = idx + 1;
    const list = slots[pos] ?? FALLBACK[pos] ?? [{ x: 25, y: 50 }];
    const coord = list[Math.min(idx, list.length - 1)];
    return isHome ? coord : { x: 100 - coord.x, y: coord.y };
  });
}
