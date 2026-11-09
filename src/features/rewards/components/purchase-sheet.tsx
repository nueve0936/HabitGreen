import { Image } from 'expo-image';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, type AlertVariant } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import type { Accesorio } from '@/db/rewards-repository';
import { es, formatear } from '@/i18n/es';
import { cardShadow } from '@/theme';

import { estadoObjeto } from '../domain/estado-objeto';
import { imagenAccesorio } from '../imagenes';

// Hoja inferior de la Tienda (mockups «Tienda #2» y «#3»). Según el objeto: comprarlo, decir cuánto
// falta, o, si ya es tuyo, ofrecer «Equipar ahora». Se cierra tocando fuera o con «atrás».

export type PurchaseSheetProps = {
  accesorio: Accesorio;
  saldo: number;
  /** Se acaba de comprar: cambia el texto y el saldo, aunque aún no llegue al teléfono. */
  recienComprado: boolean;
  ocupado: boolean;
  aviso: { tipo: AlertVariant; texto: string } | null;
  onComprar: () => void;
  onEquipar: () => void;
  onCerrar: () => void;
};

function Fila({
  etiqueta,
  valor,
  ultima = false,
}: {
  etiqueta: string;
  valor: string;
  ultima?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between gap-3 py-2 ${
        ultima ? '' : 'border-b border-divisor'
      }`}
    >
      <AppText variant="small" tone="ink-soft" className="flex-1">
        {etiqueta}
      </AppText>
      <AppText variant="small" weight="bold">
        {valor}
      </AppText>
    </View>
  );
}

const numero = (n: number) => n.toLocaleString('es-MX');

export function PurchaseSheet({
  accesorio: a,
  saldo,
  recienComprado,
  ocupado,
  aviso,
  onComprar,
  onEquipar,
  onCerrar,
}: PurchaseSheetProps) {
  const t = es.tienda;
  const insets = useSafeAreaInsets();
  const estado = estadoObjeto(a.precio, saldo, recienComprado || a.propioId !== null);
  const esTuyo = estado.tipo === 'tuyo';
  const texto = recienComprado
    ? formatear(t.tuyoRecien, { nombre: a.nombre })
    : esTuyo
      ? t.tuyoYa
      : t.comprarTexto;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.cerrar}
        onPress={onCerrar}
        className="flex-1 bg-ink/40"
      />
      <View
        accessibilityViewIsModal
        style={[cardShadow, { paddingBottom: insets.bottom + 16 }]}
        className="items-center gap-4 rounded-t-card bg-campo px-6 pt-6"
      >
        <View className="h-20 w-20 items-center justify-center rounded-chip bg-accent-claro">
          <Image
            source={imagenAccesorio(a.tipo, a.orden)}
            contentFit="contain"
            accessible={false}
            style={{ width: 56, height: 56 }}
          />
        </View>

        <View className="gap-1">
          <AppText variant="h3" accessibilityRole="header" className="text-center">
            {esTuyo ? t.tuyoTitulo : formatear(t.comprarTitulo, { nombre: a.nombre })}
          </AppText>
          <AppText variant="small" tone="ink-soft" className="text-center">
            {texto}
          </AppText>
        </View>

        <View className="w-full rounded-field bg-bg px-4 py-1">
          {esTuyo ? (
            <Fila etiqueta={t.saldoAhora} valor={numero(saldo)} ultima />
          ) : (
            <>
              <Fila etiqueta={t.precio} valor={formatear(t.precioValor, { n: numero(a.precio) })} />
              <Fila etiqueta={t.tuSaldo} valor={numero(saldo)} />
              {estado.tipo === 'comprable' ? (
                <Fila etiqueta={t.teQuedaran} valor={numero(estado.quedan)} ultima />
              ) : estado.tipo === 'faltan' ? (
                <Fila etiqueta={t.teFaltan} valor={numero(estado.faltan)} ultima />
              ) : null}
            </>
          )}
        </View>

        {aviso ? (
          <View className="w-full">
            <Alert variant={aviso.tipo} message={aviso.texto} />
          </View>
        ) : null}

        <View className="w-full gap-3">
          {esTuyo ? (
            <>
              <Button label={t.equipar} loading={ocupado} onPress={onEquipar} />
              <Button variant="secondary" label={t.seguir} onPress={onCerrar} />
            </>
          ) : (
            <>
              {estado.tipo === 'comprable' ? (
                <Button
                  label={formatear(t.comprarPor, { n: numero(a.precio) })}
                  loading={ocupado}
                  onPress={onComprar}
                />
              ) : null}
              <Button variant="secondary" label={t.ahoraNo} onPress={onCerrar} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
