import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to login - auth flow will handle session check
  return <Redirect href="/(auth)/login" />;
}
