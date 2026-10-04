import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#236b45",
        tabBarInactiveTintColor: "#77837b",
        tabBarStyle: {
          height: Platform.OS === "android" ? 64 : 80,
          paddingTop: 7,
          paddingBottom: Platform.OS === "android" ? 7 : 22,
          backgroundColor: "#fff",
          borderTopColor: "#e6ebe6",
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 19 }}>⌂</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="wifi"
        options={{
          title: "Jaringan",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>◉</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil & PIN",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>⚙</Text>
          ),
        }}
      />
    </Tabs>
  );
}
