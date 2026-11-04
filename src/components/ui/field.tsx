import { Check, CircleAlert, Eye, EyeOff, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';

import { es } from '@/i18n/es';
import { colors } from '@/theme';

import { AppText } from './app-text';

// Campo de texto del SDD 9.3 con los estados de los mockups de login y registro:
// - enfocado: borde naranja (`surface`);
// - con error: borde rojo y una X dentro del campo; si hay `error`, además el mensaje debajo;
// - `valido`: una marca de verificación dentro del campo.
// Los estados nunca dependen solo del color. Con `password` agrega el botón para mostrar u
// ocultar la contraseña.

export type FieldProps = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  /** Mensaje de error debajo del campo. */
  error?: string;
  /** Marca el campo con error sin mensaje propio (el mensaje va en un aviso de la pantalla). */
  invalido?: boolean;
  /** Muestra la marca de verificación (por ejemplo, tras intentar enviar el formulario). */
  valido?: boolean;
  password?: boolean;
};

export function Field({
  label,
  error,
  invalido = false,
  valido = false,
  password = false,
  onFocus,
  onBlur,
  ...inputProps
}: FieldProps) {
  const [hidden, setHidden] = useState(password);
  const [enfocado, setEnfocado] = useState(false);
  const hasError = Boolean(error) || invalido;

  const borde = hasError ? 'border-accent-oscuro' : enfocado ? 'border-surface' : 'border-ink-soft';

  return (
    <View className="gap-1">
      <AppText variant="small" weight="semibold">
        {label}
      </AppText>
      <View
        className={`flex-row rounded-field border-2 bg-campo px-3 ${borde} ${
          inputProps.multiline ? 'min-h-32 items-start py-2' : 'h-12 items-center'
        }`}
      >
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error}
          aria-invalid={hasError}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={hidden}
          maxFontSizeMultiplier={2}
          textAlignVertical={inputProps.multiline ? 'top' : 'center'}
          className={`flex-1 font-sans text-body text-ink ${inputProps.multiline ? 'min-h-28' : 'h-full'}`}
          onFocus={(e) => {
            setEnfocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? es.comun.mostrarContrasena : es.comun.ocultarContrasena}
            onPress={() => setHidden((value) => !value)}
            hitSlop={8}
            className="h-12 w-12 items-center justify-center"
          >
            {hidden ? (
              <Eye size={22} color={colors.ink} />
            ) : (
              <EyeOff size={22} color={colors.ink} />
            )}
          </Pressable>
        ) : null}
        {hasError ? (
          <X size={22} color={colors['accent-oscuro']} strokeWidth={2.5} accessible={false} />
        ) : valido ? (
          <Check
            size={22}
            color={colors['alerta-exito-borde']}
            strokeWidth={2.5}
            accessible={false}
          />
        ) : null}
      </View>
      {error ? (
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
