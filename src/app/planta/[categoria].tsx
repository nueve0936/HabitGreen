import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { equiparAccesorio, leerJardin, type Accesorio } from '@/db/rewards-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { PlantPanel } from '@/features/rewards/components/plant-panel';
import type { TipoAccesorio } from '@/features/rewards/domain/equipar';
import { es, formatear } from '@/i18n/es';
import { AREAS, type Area } from '@/schemas/onboarding';
import { colors } from '@/theme';

// Equipar accesorios en una planta (SDD 9.1 y 6.4). Cada planta lleva uno por tipo; ponerle uno
// que está en otra planta lo mueve. Funciona sin conexión: se guarda en el teléfono y se sube al
// sincronizar.

const TIPOS: TipoAccesorio[] = ['sombrero', 'lentes', 'maceta'];

export default function PlantaScreen() {
  const t = es.planta;
  const areas = es.onboarding.formulario.areas;
  const { categoria } = useLocalSearchParams<{ categoria: string }>();
  const area = (AREAS as readonly string[]).includes(categoria) ? (categoria as Area) : null;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const jardin = useLocalQuery(`jardin-${userId}`, () => leerJardin(userId));
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const planta = jardin.data?.plantas.find((p) => p.area === area);
  const propios = (jardin.data?.accesorios ?? []).filter((a) => a.propioId !== null);
  const nombreDe = (categoryId: string) => {
    const otra = jardin.data?.plantas.find((p) => p.categoryId === categoryId);
    return otra ? areas[otra.area] : '';
  };

  const equipar = async (accesorio: Accesorio, destino: string | null) => {
    setOcupado(accesorio.id);
    setAviso(null);
    try {
      const { movidoDe } = await equiparAccesorio(userId, accesorio, destino);
      if (movidoDe !== null && area) {
        setAviso({ tipo: 'exito', texto: formatear(t.movido, { categoria: areas[area] }) });
      }
    } catch {
      setAviso({ tipo: 'error', texto: t.error });
    } finally {
      setOcupado(null);
    }
  };

  return (
    <Screen scroll contentClassName="gap-6 pt-2">
      <View className="flex-row items-center gap-4">
        <View className="-ml-4">
          <BackButton />
        </View>
        <AppText variant="h2" className="flex-1">
          {area ? formatear(t.titulo, { categoria: areas[area] }) : ''}
        </AppText>
      </View>

      {jardin.cargando && !jardin.data ? (
        <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
      ) : !planta ? (
        <Alert variant="error" message={es.jardin.error} />
      ) : (
        <>
          <View className="w-2/3 self-center">
            <PlantPanel planta={planta} conDetalle={false} />
          </View>

          {aviso ? <Alert variant={aviso.tipo} message={aviso.texto} /> : null}

          {propios.length === 0 ? (
            <View className="gap-4">
              <AppText tone="ink-soft" className="text-center">
                {t.sinAccesorios}
              </AppText>
              <Button label={es.jardin.tienda} onPress={() => router.push('/tienda')} />
            </View>
          ) : (
            TIPOS.map((tipo) => {
              const delTipo = propios.filter((a) => a.tipo === tipo);
              if (delTipo.length === 0) return null;
              return (
                <View key={tipo} className="gap-3">
                  <AppText variant="h3" accessibilityRole="header">
                    {t.tipos[tipo]}
                  </AppText>
                  {delTipo.map((a) => {
                    const puesto = a.categoriaEquipada === planta.categoryId;
                    const estado = puesto
                      ? t.puesto
                      : a.categoriaEquipada
                        ? formatear(t.enOtra, { categoria: nombreDe(a.categoriaEquipada) })
                        : null;
                    return (
                      <Card key={a.id} className="flex-row items-center gap-3">
                        <View className="flex-1 gap-1">
                          <AppText weight="semibold">{a.nombre}</AppText>
                          {estado ? <AppText variant="small">{estado}</AppText> : null}
                        </View>
                        <Button
                          variant={puesto ? 'tertiary' : 'secondary'}
                          label={puesto ? t.quitar : t.ponerselo}
                          accessibilityLabel={`${puesto ? t.quitar : t.ponerselo}: ${a.nombre}`}
                          loading={ocupado === a.id}
                          onPress={() => equipar(a, puesto ? null : planta.categoryId)}
                        />
                      </Card>
                    );
                  })}
                </View>
              );
            })
          )}
        </>
      )}
    </Screen>
  );
}
