import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { useAppSelector } from '../hooks/useAppStore';
import { socketService } from '../socket/socketService';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateTripScreen } from '../screens/CreateTripScreen';
import { JoinTripScreen } from '../screens/JoinTripScreen';
import { TripLobbyScreen } from '../screens/TripLobbyScreen';
import { ConvoyDashboardScreen } from '../screens/ConvoyDashboardScreen';
import { LeaderDashboardScreen } from '../screens/LeaderDashboardScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  HomeTab: '🏠',
  ConvoyTab: '🗺',
  NotificationsTab: '🔔',
  ProfileTab: '👤',
};

function MainTabs() {
  const unread = useAppSelector((s) => s.notifications.items.filter((n) => n.unread).length);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0A0D14', borderTopColor: colors.border, height: 64, paddingBottom: 8 },
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{TAB_ICONS[route.name]}</Text>,
        tabBarBadge: route.name === 'NotificationsTab' && unread > 0 ? unread : undefined,
        tabBarBadgeStyle: { backgroundColor: colors.danger },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="ConvoyTab" component={ConvoyDashboardScreen} options={{ title: 'Trips' }} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [splashDone, setSplashDone] = useState(false);

  // Start the (mock) socket when the app mounts; disconnect on unmount.
  useEffect(() => {
    socketService.connect();
    return () => socketService.disconnect();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {!splashDone ? (
          <Stack.Screen name="Splash">
            {() => <SplashScreen onDone={() => setSplashDone(true)} />}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
            <Stack.Screen name="JoinTrip" component={JoinTripScreen} />
            <Stack.Screen name="TripLobby" component={TripLobbyScreen} />
            <Stack.Screen name="ConvoyDashboard" component={ConvoyDashboardScreen} />
            <Stack.Screen name="LeaderDashboard" component={LeaderDashboardScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
