import { Stack } from 'expo-router';

// Crear un plan desde la app (Perfil → Mis planes): formulario, generación, revisión y
// sugerencias, con las mismas pantallas que la bienvenida.

export default function PlanNuevoLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
