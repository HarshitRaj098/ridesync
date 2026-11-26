import { useEffect } from 'react';
import { useAppDispatch } from './useAppStore';
import { tick } from '../store/slices/membersSlice';

/**
 * Ride clock: every second advances `rideSeconds` by one while a real
 * trip is live (`active`). It moves nothing else — no member movement,
 * no fake speed. In production this is driven by socketService
 * location:update events (GPS -> Socket -> Redux -> UI).
 */
export function useRideTimer(active: boolean) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => dispatch(tick()), 1000);
    return () => clearInterval(id);
  }, [active, dispatch]);
}
