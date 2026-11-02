import * as Linking from 'expo-linking';

// URL a la que Supabase regresa desde los correos. En Expo Go queda como
// exp://<ip>:8081/--/auth-callback y en la development build o el APK como
// habitgreen://auth-callback. Ambas deben estar en las Redirect URLs de Supabase.
export function authRedirectUrl(): string {
  return Linking.createURL('auth-callback');
}
