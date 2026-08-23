import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4BE39A',
        tabBarInactiveTintColor: '#6F817B',
        tabBarStyle: {
          backgroundColor: '#0B1714',
          borderTopColor: '#18332B',
          height: 90,
          paddingTop: 10,
          paddingBottom: 22,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Sleep',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="moon-o" size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}