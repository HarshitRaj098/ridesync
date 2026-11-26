import * as Location from 'expo-location';

/**
 * Thin expo-location wrapper for the Convoy Dashboard.
 *
 * Everything here is defensive by design: a denied permission, a device
 * with location off, or a failed fix never throws and never spins — the
 * caller gets `null` / a non-granted status and shows an honest state.
 * No position is sent anywhere; fixes stay on this device (there is no
 * live backend yet — see README).
 */

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface UserCoords {
  latitude: number;
  longitude: number;
  /** Radius of uncertainty in metres, null when the device does not report one. */
  accuracy: number | null;
  /** Speed in metres per second, null when the device does not report one. */
  speed: number | null;
  timestamp: number;
}

export interface PermissionResult {
  status: LocationPermissionStatus;
  /**
   * False when the user has permanently denied — the OS will not show the
   * permission prompt again, so the app must point at device Settings.
   */
  canAskAgain: boolean;
}

function toStatus(status: Location.PermissionStatus): LocationPermissionStatus {
  if (status === Location.PermissionStatus.GRANTED) return 'granted';
  if (status === Location.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

function toCoords(loc: Location.LocationObject): UserCoords {
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy,
    speed: loc.coords.speed,
    timestamp: loc.timestamp,
  };
}

/** Current permission state without showing any prompt. Never throws. */
export async function getPermissionStatus(): Promise<PermissionResult> {
  try {
    const res = await Location.getForegroundPermissionsAsync();
    return { status: toStatus(res.status), canAskAgain: res.canAskAgain ?? true };
  } catch {
    return { status: 'undetermined', canAskAgain: true };
  }
}

/** Ask the user for foreground location permission. Never throws. */
export async function requestPermission(): Promise<PermissionResult> {
  try {
    const res = await Location.requestForegroundPermissionsAsync();
    return { status: toStatus(res.status), canAskAgain: res.canAskAgain ?? true };
  } catch {
    return { status: 'undetermined', canAskAgain: true };
  }
}

/** One-shot high-accuracy fix. Returns null when unavailable — never throws. */
export async function getCurrentPosition(): Promise<UserCoords | null> {
  try {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.High });
    return toCoords(loc);
  } catch {
    return null;
  }
}

export type Unsubscribe = () => void;

/**
 * Watch the device position (high accuracy, ~every 2 s or 10 m).
 * Returns an unsubscribe function. Never throws — if the watch cannot
 * start, the callback simply never fires and the unsubscribe is a no-op.
 */
export async function watchPosition(onUpdate: (coords: UserCoords) => void): Promise<Unsubscribe> {
  try {
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.LocationAccuracy.High, timeInterval: 2000, distanceInterval: 10 },
      (loc) => onUpdate(toCoords(loc)),
    );
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
