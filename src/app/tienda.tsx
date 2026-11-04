import { Coins } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert as AlertNativo, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { avisarCambioLocal } from '@/db/db-version-store';
import { comprarAccesorio, leerJardin, type Accesorio } from '@/db/rewards-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { AccessoryCard } from '@/features/rewards/components/accessory-card';
import type { TipoAccesorio } from '@/features/rewards/domain/equipar';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

// Tienda (SDD 6.4 y 9.4): los 15 accesorios con su precio. Lo que no alcanza dice cuánto falta
// (no solo se atenúa). Comprar necesita conexión, porque el servidor revisa el saldo real.

const TIPOS: TipoAccesorio[] = ['sombrero', 'lentes', 'maceta'];

type Aviso = { tipo: 'exito' | 'error' | 'info'; texto: string };

export default function TiendaScreen() {
  const t = es.tienda;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const tienda = useLocalQuery(`jardin-${userId}`, () => leerJardin(userId));
  const [comprando, setComprando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const saldo = tienda.data?.saldo ?? 0;

  const comprar = async (a: Accesorio) => {
    setComprando(a.id);
    setAviso(null);
    const resultado = await comprarAccesorio(a.id);
    setComprando(null);
    if (resultado === 'comprado') setAviso({ tipo: 'exito', texto: t.comprado });
    else if (resultado === 'sin_conexion') setAviso({ tipo: 'info', texto: t.sinConexion });
    else setAviso({ tipo: 'error', texto: t.errorComprar });
  };

  const confirmar = (a: Accesorio) =>
    AlertNativo.alert(
      formatear(t.confirmarTitulo, { nombre: a.nombre }),
      formatear(t.confirmarMensaje, { n: a.precio }),
      [
        { text: t.cancelar, style: 'cancel' },
        { text: t.comprar, onPress: () => void comprar(a) },
      ],
    );

  return (
    <Screen scroll contentClassName="gap-6 pt-2">
      <View className="flex-row items-center gap-4">
        <View className="-ml-4">
          <BackButton />
        </View>
        <AppText variant="h2" className="flex-1">
          {t.titulo}
        </AppText>
        <View
          accessible
          accessibilityLabel={formatear(es.hoy.monedas, { n: saldo })}
          className="min-h-12 flex-row items-center gap-1"
        >
          <Coins size={22} color={colors['accent-oscuro']} />
          <AppText weight="bold">{saldo}</AppText>
        </View>
      </View>

      {aviso ? <Alert variant={aviso.tipo} message={aviso.texto} /> : null}

      {tienda.cargando && !tienda.data ? (
        <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
      ) : tienda.error && !tienda.data ? (
        <View className="gap-4">
          <Alert variant="error" message={t.error} />
          <Button variant="secondary" label={es.comun.reintentar} onPress={avisarCambioLocal} />
        </View>
      ) : tienda.data ? (
        TIPOS.map((tipo) => (
          <View key={tipo} className="gap-3">
            <AppText variant="h3" accessibilityRole="header">
              {t.tipos[tipo]}
            </AppText>
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {tienda.data?.accesorios
                .filter((a) => a.tipo === tipo)
                .map((a) => (
                  <View key={a.id} className="w-[48%]">
                    <AccessoryCard
                      accesorio={a}
                      saldo={saldo}
                      comprando={comprando === a.id}
                      onComprar={() => confirmar(a)}
                    />
                  </View>
                ))}
            </View>
          </View>
        ))
      ) : null}
    </Screen>
  );
}
