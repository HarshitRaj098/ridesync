import { nameFromEmail, type Trip } from '../data/mockData';

/**
 * Local services — there is no backend yet, so these run on this device
 * only and never return a seeded person, trip or stat.
 * TODO: replace with api/client calls to the Node backend (real JWT auth,
 * POST /api/trips, GET /api/profile).
 */

/** Local auth: the signed-in user is whoever the user typed in. */
export const authService = {
  async signIn(email: string, _password: string) {
    return { name: nameFromEmail(email), email: email.trim() };
  },
  async register(name: string, email: string, _password: string) {
    return { name: name.trim(), email: email.trim() };
  },
};

/** Local trip service: builds a real trip from the form the user filled in. */
export const tripService = {
  async createTrip(payload: {
    name: string;
    origin: string;
    destination: string;
    date: string;
    startTime: string;
    type: 'Public' | 'Private';
    riderLimit: number;
    code: string;
    inviteLink: string;
    leaderName: string;
  }): Promise<Trip> {
    return {
      id: `trip-${Date.now()}`,
      name: payload.name.trim(),
      origin: payload.origin.trim(),
      destination: payload.destination.trim(),
      distanceKm: null,
      riderLimit: payload.riderLimit,
      type: payload.type,
      date: payload.date.trim(),
      startTime: payload.startTime.trim(),
      code: payload.code.toUpperCase(),
      inviteLink: payload.inviteLink,
      leaderName: payload.leaderName.trim(),
    };
  },
};
