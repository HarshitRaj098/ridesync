import React from 'react';
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
 * A Google Maps API key is required for full maps on Android — put it in
 * app.json under android.config.googleMaps.apiKey (see README). No key is
 * bundled in this repo. iOS uses Apple Maps by default and needs no key.
 */
import MapView, { Marker, Polyline } from 'react-native-maps';

const MARKER_COLORS: Record<Member['status'], string> = {
  online: colors.cyan,
  stopped: colors.warning,
  offline: colors.textFaint,
};

interface Props {
  members: Member[];
  satellite: boolean;
}

export function ConvoyMap({ members, satellite }: Props) {
  const routeCoords = members.map((m) => ({ latitude: m.lat, longitude: m.lng }));

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...MAP_CENTER, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      mapType={satellite ? 'satellite' : 'standard'}
      showsUserLocation
      showsCompass={false}
    >
      <Polyline coordinates={routeCoords} strokeColor={colors.cyan} strokeWidth={3} lineDashPattern={[1, 10]} />
      {members.map((m) => (
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
}
