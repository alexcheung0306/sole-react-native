import { Redirect } from 'expo-router';
export default function Page() {
  // Redirect to the protected user home screen
  return <Redirect href="/(protected)/(user)/home" />;
}

