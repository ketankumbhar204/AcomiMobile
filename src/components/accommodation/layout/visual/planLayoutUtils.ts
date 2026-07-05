export function splitAroundCorridor<T>(items: T[]): { top: T[]; bottom: T[] } {
  const midpoint = Math.ceil(items.length / 2);
  return {
    top: items.slice(0, midpoint),
    bottom: items.slice(midpoint),
  };
}

export function chunkIntoRows<T>(items: T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

/** Place units in a floor-plan grid around a central core (lift/stairs). */
export function arrangeAroundCore<T>(items: T[], columns = 2): T[][] {
  return chunkIntoRows(items, columns);
}
