import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/theme';

import { AppText } from './app-text';

// Alerta del SDD 9.3: siempre icono + texto. El texto va en ink sobre todos los fondos.

export type AlertVariant = 'error' | 'advertencia' | 'exito' | 'info';

const STYLES: Record<AlertVariant, { container: string; iconColor: string }> = {
  error: { container: 'bg-error-claro border-error', iconColor: colors.error },
  advertencia: {
    container: 'bg-alerta-advertencia border-alerta-advertencia-borde',
    iconColor: colors['alerta-advertencia-borde'],
  },
  exito: {
    container: 'bg-alerta-exito border-alerta-exito-borde',
    iconColor: colors['alerta-exito-borde'],
  },
  info: {
    container: 'bg-alerta-info border-alerta-info-borde',
    iconColor: colors['alerta-info-borde'],
  },
};

const ICONS = {
  error: CircleAlert,
  advertencia: TriangleAlert,
  exito: CircleCheck,
  info: Info,
} as const;

export type AlertProps = {
  variant: AlertVariant;
  message: string;
};

export function Alert({ variant, message }: AlertProps) {
  const Icon = ICONS[variant];
  const { container, iconColor } = STYLES[variant];

  return (
    <View
      accessibilityRole={variant === 'error' ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
      className={`flex-row items-start gap-2 rounded-field border-2 p-3 ${container}`}
    >
      <Icon size={20} color={iconColor} />
      <AppText variant="small" className="flex-1">
        {message}
      </AppText>
    </View>
  );
}
