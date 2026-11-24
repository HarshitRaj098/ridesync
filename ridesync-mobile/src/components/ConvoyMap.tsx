/**
 * ConvoyMap — platform-resolved entry point.
 *
 * Metro picks `ConvoyMap.native.tsx` on iOS/Android (real react-native-maps)
 * and `ConvoyMap.web.tsx` on web (styled fallback). This generic file is
 * only a fallback for environments without platform resolution; it renders
 * the web placeholder so the app never crashes on a missing map.
 */
export { ConvoyMap } from './ConvoyMap.web';
