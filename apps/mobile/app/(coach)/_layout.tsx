import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  const t = useTheme();
  return (
    <Text style={{ fontSize: 10.5, fontWeight: focused ? '700' : '500', color: focused ? t.ink : t.ink3 }}>
      {label}
    </Text>
  );
}

export default function CoachTabsLayout() {
  const t = useTheme();
  const { ready, user } = useAuth();
  if (ready && !user) return <Redirect href="/connexion" />;
  if (ready && user && user.role !== 'coach') return <Redirect href="/(tabs)/aujourdhui" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
        tabBarShowLabel: true,
        tabBarIconStyle: { display: 'none' },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="apercu" options={{ tabBarLabel: ({ focused }) => <TabLabel label="Aperçu" focused={focused} /> }} />
      <Tabs.Screen name="athletes" options={{ tabBarLabel: ({ focused }) => <TabLabel label="Athlètes" focused={focused} /> }} />
      <Tabs.Screen name="planning" options={{ tabBarLabel: ({ focused }) => <TabLabel label="Planning" focused={focused} /> }} />
      <Tabs.Screen name="messages" options={{ tabBarLabel: ({ focused }) => <TabLabel label="Messages" focused={focused} /> }} />
      <Tabs.Screen name="plus" options={{ tabBarLabel: ({ focused }) => <TabLabel label="Plus" focused={focused} /> }} />
    </Tabs>
  );
}
