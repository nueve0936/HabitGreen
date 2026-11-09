import { Image } from 'expo-image';
import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { Accesorio } from '@/db/rewards-repository';
import { es, formatear } from '@/i18n/es';
import { cardShadow, colors } from '@/theme';

import { estadoObjeto } from '../domain/estado-objeto';
import { imagenAccesorio } from '../imagenes';
import { CoinIcon } from './coin-icon';

// Tarjeta de un accesorio en la Tienda (mockup «Tienda #1»): imagen, nombre y precio. Lo que no
// alcanza dice cuánto falta y lo propio dice «Es tuyo»: el estado siempre va con texto. Al tocarla
// se abre la hoja de compra.

export function AccessoryCard({
  accesorio: a,
  saldo,
  onPress,
}: {
  accesorio: Accesorio;
  saldo: number;
  onPress: () => void;
}) {
  const t = es.tienda;
  const estado = estadoObjeto(a.precio, saldo, a.propioId !== null);
  const textoEstado =
    estado.tipo === 'tuyo'
      ? t.esTuyo
      : estado.tipo === 'faltan'
        ? formatear(t.faltan, { n: estado.faltan })
        : formatear(t.precioValor, { n: a.precio });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${a.nombre}. ${textoEstado}`}
      onPress={onPress}
      style={cardShadow}
      className="grow items-center gap-1 rounded-card bg-campo p-2 active:bg-accent-claro"
    >
      <Image
        source={imagenAccesorio(a.tipo, a.orden)}
        contentFit="contain"
        accessible={false}
        style={{ width: '80%', aspectRatio: 1 }}
      />
      <AppText variant="small" weight="semibold" className="text-center">
        {a.nombre}
      </AppText>
      {estado.tipo === 'tuyo' ? (
        <View className="flex-row items-center gap-1">
          <Check size={16} color={colors.accent} strokeWidth={3} />
          <AppText variant="small" weight="bold">
            {t.esTuyo}
          </AppText>
        </View>
      ) : (
        <>
          <View className="flex-row items-center gap-1 rounded-chip bg-moneda-fondo py-0.5 pl-1 pr-2">
            <CoinIcon size={16} />
            <AppText variant="small" weight="bold" tone="moneda">
              {a.precio.toLocaleString('es-MX')}
            </AppText>
          </View>
          {estado.tipo === 'faltan' ? (
            <AppText variant="small" tone="ink-soft" className="text-center">
              {textoEstado}
            </AppText>
          ) : null}
        </>
      )}
    </Pressable>
  );
}
