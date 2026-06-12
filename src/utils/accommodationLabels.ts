export function formatFloorHeaderTitle(
  buildingName: string | undefined,
  floorName: string,
): string {
  if (!buildingName?.trim()) {
    return floorName;
  }
  return `${buildingName.trim()} · ${floorName}`;
}
