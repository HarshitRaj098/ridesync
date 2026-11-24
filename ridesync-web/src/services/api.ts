/**
 * Mock API layer for React Query.
 * No real backend: these functions resolve the shared mock data after a
 * short delay so React Query (loading / caching / refetch) behaves as it
 * will against the real Node.js + MongoDB API.
 * TODO: replace with Axios calls to the real API (see Blueprint §12).
 */
import { CURRENT_TRIP, MEMBERS, RIDER_STATS } from '../data/mockData.ts'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchRiderStats() {
  await delay(350)
  return { ...RIDER_STATS }
}

export async function fetchTripHistory() {
  await delay(350)
  return [
    { id: 'manali-2026', name: CURRENT_TRIP.name, route: `${CURRENT_TRIP.from} → ${CURRENT_TRIP.to}`, distanceKm: CURRENT_TRIP.distanceKm, date: CURRENT_TRIP.date },
    { id: 'bhopal-loop', name: 'Bhopal Bikers Sunday Loop', route: 'Bhopal → Bhopal', distanceKm: 86, date: '2026-07-19' },
    { id: 'indore-run', name: 'Highway Cruisers – Indore Run', route: 'Bhopal → Indore', distanceKm: 198, date: '2026-07-12' },
  ]
}

export async function fetchMembers() {
  await delay(300)
  return MEMBERS
}
