import { CircleAlert, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';

import { es } from '@/i18n/es';
import { colors } from '@/theme';

import { AppText } from './app-text';

// Campo de texto del SDD 9.3: etiqueta siempre visible, alto 48 y error con icono + mensaje
// (nunca solo color). Con `password` agrega el botón para mostrar u ocultar la contraseña.

export type FieldProps = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  error?: string;
  password?: boolean;
};

export function Field({ label, error, password = false, ...inputProps }: FieldProps) {
  const [hidden, setHidden] = useState(password);
  const hasError = Boolean(error);

  return (
    <View className="gap-1">
      <AppText variant="small" weight="semibold">
        {label}
      </AppText>
      <View
        className={`h-12 flex-row items-center rounded-field border-2 px-3 ${
          hasError ? 'border-accent-oscuro bg-accent-claro' : 'border-ink-soft bg-campo'
        }`}
      >
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error}
          aria-invalid={hasError}
          placeholderTextColor={colors['ink-soft']}
          secureTextEntry={hidden}
          maxFontSizeMultiplier={1.3}
          className="h-full flex-1 font-sans text-body text-ink"
          {...inputProps}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? es.comun.mostrarContrasena : es.comun.ocultarContrasena}
            onPress={() => setHidden((value) => !value)}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center"
          >
            {hidden ? (
              <Eye size={22} color={colors.ink} />
            ) : (
              <EyeOff size={22} color={colors.ink} />
            )}
          </Pressable>
        ) : null}
      </View>
      {hasError ? (
        <View className="flex-row items-center gap-1" accessibilityLiveRegion="polite">
          <CircleAlert size={16} color={colors['accent-oscuro']} />
          <AppText variant="small" className="flex-1">
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
