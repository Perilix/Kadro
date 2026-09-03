import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';
import { attachPushNavigation, registerPush } from '../lib/push';
import { connectRealtime, disconnectRealtime } from '../lib/realtime';
import { useTheme } from '../lib/theme';

function SessionEffects() {
  const { user } = useAuth();
  const userId = user?.id;
  const role = user?.role;
  useEffect(() => {
    if (!userId || !role) {
      disconnectRealtime();
      return;
    }
    connectRealtime();
    void registerPush();
    return attachPushNavigation(role);
  }, [userId, role]);
  return null;
}

export default function RootLayout() {
  const t = useTheme();
  return (
    <AuthProvider>
      <SessionEffects />
      <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
        }}
      />
    </AuthProvider>
  );
}
