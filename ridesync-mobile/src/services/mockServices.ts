import { CURRENT_USER, RIDER_STATS, TRIP } from '../data/mockData';

/** Mock auth service — TODO: replace with api/client calls to the Node backend. */
export const authService = {
  async signIn(email: string, _password: string) {
    await new Promise((r) => setTimeout(r, 600));
    return { name: CURRENT_USER.name, email };
  },
  async register(name: string, email: string, _password: string) {
    await new Promise((r) => setTimeout(r, 600));
    return { name, email };
  },
};

/** Mock trip service — TODO: replace with api/client calls to the Node backend. */
export const tripService = {
  async createTrip(payload: { name: string; destination: string; date: string; startTime: string }) {
    await new Promise((r) => setTimeout(r, 600));
    return { ...TRIP, ...payload };
  },
  async joinTrip(code: string) {
    await new Promise((r) => setTimeout(r, 600));
    if (!code.trim()) throw new Error('Enter a trip code');
    return TRIP;
  },
};

/** Mock profile query for React Query — TODO: GET /api/profile. */
export async function fetchProfile() {
  await new Promise((r) => setTimeout(r, 400));
  return { ...CURRENT_USER, ...RIDER_STATS };
}
