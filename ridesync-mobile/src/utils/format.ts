export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatKm(km: number): string {
  return `${km.toLocaleString('en-IN')} km`;
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** ETA in minutes at the given speed for the remaining distance. */
export function etaMinutes(distanceKm: number, speedKmh: number): number {
  if (speedKmh <= 0) return 0;
  return Math.round((distanceKm / speedKmh) * 60);
}
