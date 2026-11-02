import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'bienvenida',
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
