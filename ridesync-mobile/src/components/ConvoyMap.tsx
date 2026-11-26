/**
 * ConvoyMap — platform-resolved entry point.
 *
 * Metro picks `ConvoyMap.native.tsx` on iOS/Android (real react-native-maps)
 * and `ConvoyMap.web.tsx` on web (styled fallback). This generic file is
 * only a fallback for environments without platform resolution; it renders
 * the web placeholder so the app never crashes on a missing map.
 *
 * Both platform components accept the same props (including the GPS
 * props) — the web fallback simply ignores them, because live GPS
 * following is device-only. The handle type is re-exported from the
 * native file as a type only, so it is erased at build time and never
 * pulls react-native-maps into the web bundle.
 */
export { ConvoyMap } from './ConvoyMap.web';
export type { ConvoyMapHandle, UserLocation } from './ConvoyMap.native';
