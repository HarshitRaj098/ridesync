import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getCurrentPosition,
  requestPermission,
  watchPosition,
  type UserCoords,
} from '../services/locationService';

/**
 * Live device position for the Convoy Dashboard.
 *
 * Starts watching when the screen mounts (only while `enabled` — the
 * Settings "location sharing" toggle), and stops on unmount or when
 * disabled. Holds the latest fix, the permission state, and the GPS
 * speed in km/h. Never crashes on denied / unavailable location.
 */
export type GpsStatus = 'off' | 'requesting' | 'granted' | 'denied' | 'undetermined';

export interface UserLocationState {
  /** Latest fix, null until the first one arrives. */
  coords: UserCoords | null;
  status: GpsStatus;
  /** False when the OS will no longer show the permission prompt. */
  canAskAgain: boolean;
  /** GPS speed in km/h, null when the device reports no speed yet. */
  speedKmh: number | null;
  /** Ask for permission again (used by the denied banner). */
  requestAgain: () => void;
}

export function useUserLocation(enabled: boolean): UserLocationState {
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [status, setStatus] = useState<GpsStatus>(enabled ? 'requesting' : 'off');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const stopRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const stopWatching = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const startWatching = useCallback(async () => {
    const id = ++requestIdRef.current;
    setStatus('requesting');
    const perm = await requestPermission();
    if (!mountedRef.current || requestIdRef.current !== id) return;
    setCanAskAgain(perm.canAskAgain);
    if (perm.status !== 'granted') {
      setStatus(perm.status === 'denied' ? 'denied' : 'undetermined');
      return;
    }
    setStatus('granted');
    // One quick fix first so the map can centre immediately, then live updates.
    const first = await getCurrentPosition();
    if (mountedRef.current && requestIdRef.current === id && first) setCoords(first);
    const stop = await watchPosition((c) => {
      if (mountedRef.current && requestIdRef.current === id) setCoords(c);
    });
    if (!mountedRef.current || requestIdRef.current !== id) {
      stop();
      return;
    }
    stopRef.current = stop;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      stopWatching();
      setStatus('off');
      return () => {
        mountedRef.current = false;
      };
    }
    void startWatching();
    return () => {
      mountedRef.current = false;
      stopWatching();
    };
  }, [enabled, startWatching, stopWatching]);

  const requestAgain = useCallback(() => {
    if (!enabled) return;
    void startWatching();
  }, [enabled, startWatching]);

  const speedKmh =
    coords?.speed != null && coords.speed >= 0 ? Math.round(coords.speed * 3.6) : null;

  return { coords, status, canAskAgain, speedKmh, requestAgain };
}
