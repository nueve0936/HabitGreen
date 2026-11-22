import { useLocalSearchParams } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { Snackbar } from '@/components/ui/snackbar';
import { agregarAlPlan, pedirTextosIa, sugerenciasParaPlan } from '@/db/progression-repository';
import { guardarAjustes, leerAjustes, leerMinutosPorDia } from '@/db/settings-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { minutosPorDia } from '@/features/habits/domain/presupuesto';
import { es, formatear } from '@/i18n/es';
import type { HabitoPlan } from '@/schemas/plan';
import { colors } from '@/theme';
import { navegar } from '@/lib/navegar';

import { PlanHabitCard } from '../components/plan-habit-card';
import { paginaDeSugerencias, SUGERENCIAS_POR_PAGINA } from '../domain/plan-review';
import { excesoDeTiempo } from '../domain/tiempo-libre';

// «Agregar un hábito al plan» (decisión del usuario): las versiones del catálogo de cada meta libre
// de la misma área del plan (primero las más ligeras), de 4 en 4 con «Sugerir otros hábitos» como en
// el formulario. Las de nivel 2 o 3 avisan que empiezan un poco más retadoras. Al agregar se crea en el
// plan (funciona sin conexión) y se piden sus textos a la IA. Si no cabe en el tiempo diario, se
// avisa en la confirmación y el tiempo sube a lo necesario.

// Ventana del aviso flexible (momento «varía»), la misma que manda generate-plan (app_config).
const VENTANA_FLEXIBLE = { inicio: '17:00', fin: '20:00' };

export default function SugerenciasDelPlanScreen() {
  const t = es.perfil.detallePlan.sugerencias;
  const { planId = '' } = useLocalSearchParams<{ planId: string }>();
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const sugerencias = useLocalQuery(`sugerencias-plan-${planId}`, () =>
    sugerenciasParaPlan(userId, planId),
  );
  const ocupado = useLocalQuery('minutos-por-dia', leerMinutosPorDia);
  const ajustes = useLocalQuery(`ajustes-${userId}`, () => leerAjustes(userId));
  const [eligiendo, setEligiendo] = useState<HabitoPlan | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);

  const presupuesto = ajustes.data?.presupuestoMin ?? 0;
  const exceso = eligiendo
    ? excesoDeTiempo(ocupado.data ?? [], minutosPorDia([eligiendo]), presupuesto)
    : 0;

  const agregar = async (habito: HabitoPlan) => {
    const id = await agregarAlPlan(userId, planId, habito);
    if (id === null) {
      setAviso(t.sinLugar);
      return;
    }
    if (exceso > 0) await guardarAjustes(userId, { presupuesto_min: presupuesto + exceso });
    void pedirTextosIa(userId, id, 'nuevo', habito);
    navegar.back();
  };

  const lista = sugerencias.data ?? [];
  const visibles = paginaDeSugerencias(lista, pagina);

  return (
    <>
      <Screen scroll contentClassName="gap-6 pt-2 pb-8">
        <View className="-ml-4">
          <BackButton />
        </View>
        <View className="gap-2">
          <AppText variant="h2" accessibilityRole="header">
            {t.titulo}
          </AppText>
          <AppText tone="ink-soft">{t.subtitulo}</AppText>
        </View>

        {sugerencias.cargando && !sugerencias.data ? (
          <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
        ) : lista.length === 0 ? (
          <AppText tone="ink-soft">{t.vacio}</AppText>
        ) : (
          <View className="gap-4" accessibilityLiveRegion="polite">
            {visibles.map((habito) => (
              <PlanHabitCard
                key={`${habito.objetivo}-${habito.nivel}`}
                nota={habito.nivel > 1 ? t.masRetador : undefined}
                habito={habito}
                ventana={VENTANA_FLEXIBLE}
                acciones={[
                  {
                    label: t.agregar,
                    tone: 'confirmar',
                    accessibilityLabel: formatear(t.agregarEtiqueta, { titulo: habito.titulo }),
                    onPress: () => setEligiendo(habito),
                  },
                ]}
              />
            ))}
          </View>
        )}

        {lista.length > SUGERENCIAS_POR_PAGINA ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={es.onboarding.sugerencias.otras}
            onPress={() => setPagina((p) => p + 1)}
            className="min-h-14 flex-row items-center justify-center gap-2 rounded-card border-2 border-dashed border-divisor active:bg-accent-claro"
          >
            <RefreshCw size={20} color={colors.ink} />
            <AppText weight="semibold">{es.onboarding.sugerencias.otras}</AppText>
          </Pressable>
        ) : null}

        <ConfirmDialog
          visible={eligiendo !== null}
          tipo="confirmar"
          mensaje={[
            formatear(t.confirmar, { titulo: eligiendo?.titulo ?? '' }),
            exceso > 0 ? formatear(t.excede, { n: String(exceso) }) : null,
          ]
            .filter(Boolean)
            .join(' ')}
          cancelar={t.cancelar}
          confirmar={t.agregar}
          onCancelar={() => setEligiendo(null)}
          onConfirmar={() => {
            const habito = eligiendo;
            setEligiendo(null);
            if (habito) agregar(habito).catch(() => setAviso(es.perfil.detallePlan.error));
          }}
        />
      </Screen>
      <Snackbar mensaje={aviso} variant="error" onCerrar={() => setAviso(null)} />
    </>
  );
}
