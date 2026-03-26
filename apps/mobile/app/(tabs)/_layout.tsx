import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2563eb' }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarLabel: 'Home' }}
      />
      <Tabs.Screen
        name="work-items"
        options={{ title: 'Tasks', tabBarLabel: 'Tasks' }}
      />
      <Tabs.Screen
        name="time-tracking"
        options={{ title: 'Time', tabBarLabel: 'Time' }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'Alerts', tabBarLabel: 'Alerts' }}
      />
    </Tabs>
  );
}
