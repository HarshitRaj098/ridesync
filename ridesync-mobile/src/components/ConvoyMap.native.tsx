import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { MAP_CENTER, Member } from '../data/mockData';

/**
 * Native live map (iOS/Android device or emulator) — react-native-maps.
 *
 * This file is `ConvoyMap.native.tsx`: Metro/RN resolves it instead of
 * `ConvoyMap.tsx` on native platforms, and `ConvoyMap.web.tsx` on web, so
 * the native-only `react-native-maps` import is never evaluated or
 * bundled for web.
 *
 * No API key is bundled in this repo. In Expo Go the map uses Expo's own
 * built-in key; a key in app.json is only needed for a real
 * development/production build (see README). iOS uses Apple Maps by
 * default and needs no key.
 *
 * GPS: the map centres on the rider's real position (`userLocation`)
 * when one is known and follows it while `followUser` is true. Member
 * markers are only drawn for real members with coordinates — the list
 * starts empty (no seeded riders) and grows only when riders join on
 * this device. Dragging the map by hand calls `onUserMoved` so the
 * screen can pause following.
 */
import MapView, { Marker, Polyline } from 'react-native-maps';

const MARKER_COLORS: Record<Member['status'], string> = {
  online: colors.cyan,
  stopped: colors.warning,
  offline: colors.textFaint,
};

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface ConvoyMapHandle {
  /** Animate to the user's live position, north-up, zoomed in. No-op without a fix. */
  recenterToUser: () => void;
}

interface Props {
  members: Member[];
  satellite: boolean;
  userLocation: UserLocation | null;
  followUser: boolean;
  onUserMoved: () => void;
}

/** Zoom ~15 — close enough to ride by, wide enough to see the convoy. */
const FOLLOW_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };
const DEFAULT_DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

export const ConvoyMap = forwardRef<ConvoyMapHandle, Props>(function ConvoyMap(
  { members, satellite, userLocation, followUser, onUserMoved },
  ref,
) {
  const mapRef = useRef<MapView | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      recenterToUser() {
        if (!userLocation || !mapRef.current) return;
        mapRef.current.animateCamera(
          { center: userLocation, heading: 0, pitch: 0, zoom: 15 },
          { duration: 500 },
        );
      },
    }),
    [userLocation],
  );

  // Follow the rider: animate to each new fix while following is on.
  useEffect(() => {
    if (!followUser || !userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({ ...userLocation, ...FOLLOW_DELTA }, 800);
  }, [followUser, userLocation]);

  const visibleMembers = members.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
  const routeCoords = visibleMembers.map((m) => ({ latitude: m.lat, longitude: m.lng }));

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...(userLocation ?? MAP_CENTER), ...DEFAULT_DELTA }}
      mapType={satellite ? 'satellite' : 'standard'}
      showsUserLocation
      showsCompass={false}
      onPanDrag={onUserMoved}
    >
      {routeCoords.length >= 2 && (
        <Polyline coordinates={routeCoords} strokeColor={colors.cyan} strokeWidth={3} lineDashPattern={[1, 10]} />
      )}
      {visibleMembers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          title={`${m.name}${m.role === 'leader' ? ' — Leader' : ''}`}
          description={m.position}
          pinColor={m.role === 'leader' ? colors.primary : MARKER_COLORS[m.status]}
        />
      ))}
    </MapView>
  );
});
