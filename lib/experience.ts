export function getUserTitle(xp: bigint | number | null): string {
  if (xp === null) return "N/A";
  const numericXp = Number(xp);

  if (numericXp >= 5000) return "Legendary Creator";
  if (numericXp >= 3000) return "Master Collector";
  if (numericXp >= 1000) return "Rising Star";
  if (numericXp >= 200)  return "Enthusiast";
  return "Newcomer";
}