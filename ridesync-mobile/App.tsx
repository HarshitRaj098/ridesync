import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

/**
 * RideSync mobile entry point.
 *
 * NOTE on fonts: the design system calls for Poppins. No Poppins .ttf files
 * are bundled in this scaffold (no font files were supplied), so the app
 * uses the system font. To use Poppins, drop Poppins-Regular/Medium/
 * SemiBold/Bold/ExtraBold .ttf files into src/assets/fonts/ and load them
 * with expo-font (see theme/typography.ts for the family names).
 */
export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AppNavigator />
      </QueryClientProvider>
    </Provider>
  );
}
