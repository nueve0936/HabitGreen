import { Image } from 'expo-image';
import { Check, Coins } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Accesorio } from '@/db/rewards-repository';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

import { imagenAccesorio } from '../imagenes';

// Tarjeta de un accesorio en la tienda: imagen, nombre, precio y su estado («Es tuyo», «Te
// faltan N monedas» o el botón «Comprar»). El estado siempre va con texto, no solo con color.

export function AccessoryCard({
  accesorio: a,
  saldo,
  comprando,
  onComprar,
}: {
  accesorio: Accesorio;
  saldo: number;
  comprando: boolean;
  onComprar: () => void;
}) {
  const t = es.tienda;
  const faltan = a.precio - saldo;

  return (
    <Card className="gap-2 p-3">
      <View className="aspect-square w-full overflow-hidden rounded-field border-2 border-ink bg-bg-claro">
        <Image
          source={imagenAccesorio(a.tipo, a.orden)}
          contentFit="contain"
          accessible={false}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <AppText weight="semibold">{a.nombre}</AppText>
      <View
        accessible
        accessibilityLabel={formatear(es.hoy.monedas, { n: a.precio })}
        className="flex-row items-center gap-1"
      >
        <Coins size={16} color={colors.ink} />
        <AppText variant="small" weight="semibold">
          {a.precio}
        </AppText>
      </View>
      {a.propioId !== null ? (
        <View className="min-h-12 flex-row items-center gap-1">
          <Check size={18} color={colors.ink} strokeWidth={3} />
          <AppText weight="bold">{t.esTuyo}</AppText>
        </View>
      ) : faltan > 0 ? (
        <AppText variant="small" className="min-h-12">
          {formatear(t.faltan, { n: faltan })}
        </AppText>
      ) : (
        <Button
          variant="secondary"
          label={t.comprar}
          accessibilityLabel={formatear(t.comprarEtiqueta, { nombre: a.nombre, n: a.precio })}
          loading={comprando}
          onPress={onComprar}
          className="bg-bg-claro px-2"
        />
      )}
    </Card>
  );
}
