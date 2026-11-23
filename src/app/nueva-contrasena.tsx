import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { authErrorMessage } from '@/features/auth/domain/auth-error-message';
import {
  newPasswordSchema,
  type NewPasswordInput,
  type NewPasswordValues,
  PASSWORD_MAX,
} from '@/features/auth/domain/auth-schemas';
import { useSession } from '@/features/auth/session-context';
import { es } from '@/i18n/es';
import { supabase } from '@/lib/supabase';

// Se abre después de escribir el código de recuperación: ya hay sesión, pero antes de entrar a la
// app el usuario crea su nueva contraseña.

export default function NuevaContrasenaScreen() {
  const t = es.auth;
  const { finishRecovery } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput, unknown, NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // handleSubmit espera un evento web; en React Native se llama sin argumentos.
  const onSubmit = () => void submit();
  const submit = handleSubmit(async ({ password }) => {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    setSaved(true);
  });

  return (
    <Screen scroll>
      <AuthHeader title={t.nuevaContrasenaPantalla.titulo} />

      {saved ? (
        <View className="gap-6">
          <Alert variant="exito" message={t.nuevaContrasenaPantalla.exito} />
          <Button label={es.comun.continuar} onPress={finishRecovery} />
        </View>
      ) : (
        <View className="gap-4">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label={t.nuevaContrasena}
                password
                maxLength={PASSWORD_MAX}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                autoComplete="new-password"
                textContentType="newPassword"
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label={t.confirmarContrasena}
                password
                maxLength={PASSWORD_MAX}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
            )}
          />

          {serverError ? <Alert variant="error" message={serverError} /> : null}

          <Button
            label={t.nuevaContrasenaPantalla.boton}
            loading={isSubmitting}
            onPress={onSubmit}
            className="mt-4"
          />
        </View>
      )}
    </Screen>
  );
}
