import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { es, formatear } from '@/i18n/es';

import { CoinIcon } from './coin-icon';

// Saldo de monedas en el encabezado de una pantalla, en una píldora dorada. `children` permite sumar
// la moneda animada.

export type CoinBalanceProps = {
  saldo: number;
  children?: ReactNode;
};

export function CoinBalance({ saldo, children }: CoinBalanceProps) {
  return (
    <View
      accessible
      accessibilityLabel={formatear(es.hoy.monedas, { n: saldo })}
      className="flex-row items-center gap-1 rounded-chip bg-moneda-fondo py-1 pl-1 pr-3"
    >
      <CoinIcon />
      <AppText weight="bold" tone="moneda">
        {saldo.toLocaleString('es-MX')}
      </AppText>
      {children}
    </View>
  );
}
