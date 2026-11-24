import { useEffect } from 'react';
import { useAppDispatch } from './useAppStore';
import { tick } from '../store/slices/membersSlice';

/**
 * Simulated live ride: every second advances the ride timer and jitters
 * speed / member positions, mirroring the HTML prototype's setInterval mocks.
 * In production this is driven by socketService location:update events
 * (GPS -> Socket -> Redux -> UI).
 */
export function useRideTimer(active: boolean) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => dispatch(tick()), 1000);
    return () => clearInterval(id);
  }, [active, dispatch]);
}
