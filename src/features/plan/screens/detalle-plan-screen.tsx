import { useLocalSearchParams } from 'expo-router';
import { Feather, LogOut, Plus } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { Snackbar } from '@/components/ui/snackbar';
import { leerHabitos, type HabitoConHorario } from '@/db/habits-repository';
import { sacarDelPlan, terminarPlan } from '@/db/plan-repository';
import {
  hacerMasLigero,
  leerDetallePlan,
  pedirTextosIa,
  type HabitoDelDetalle,
} from '@/db/progression-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { ICONO_CATEGORIA } from '@/features/habits/categoria-icono';
import { textoDuracion } from '@/features/habits/domain/formato';
import { useHabitActions } from '@/features/habits/use-habit-actions';
import { ProgressionCard } from '@/features/progression/components/progression-card';
import { useProgresion } from '@/features/progression/use-progresion';
import { es, formatear } from '@/i18n/es';
import { cardShadow, colors, tintes } from '@/theme';
import { navegar } from '@/lib/navegar';

import { PlanHabitRow } from '../components/plan-habit-row';
import { ResumenPlanCard } from '../components/resumen-plan-card';

// Detalle del plan (Perfil → Mis planes → un plan; decisión del usuario, acomodo «Secciones
// apiladas» ajustado tras el critique de Impeccable): la meta del plan, un «Resumen» (cómo vas y
// próxima revisión), los hábitos con su menú ⋮ (editar, hacerlo más ligero, sacar del plan, pausar,
// eliminar) y una sugerencia de «más ligero» si uno va por debajo del 50 %, agregar un hábito y,
// abajo del todo, «Terminar plan» como botón principal. Nunca muestra niveles ni XP. Todo se guarda
// en el teléfono y se sube con la cola: funciona sin conexión.

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <AppText variant="h3" accessibilityRole="header">
        {titulo}
      </AppText>
      {children}
    </View>
  );
}

/** «Caminar 15 min · 15 min» para el diálogo de «más ligero» (sin duración, solo el título). */
function conDuracion(titulo: string, minutos: number): string {
  return minutos > 0 ? `${titulo} · ${textoDuracion(minutos)}` : titulo;
}

export default function DetallePlanScreen() {
  const t = es.perfil.detallePlan;
  const tPlanes = es.perfil.planes;
  const areas = es.onboarding.formulario.areas;
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const userId = session?.user.id ?? '';

  const detalle = useLocalQuery(`detalle-plan-${id}`, () => leerDetallePlan(userId, id));
  const habitos = useLocalQuery('habitos', leerHabitos);
  const progresion = useProgresion(userId, { planId: id, revisar: false });
  const [masLigero, setMasLigero] = useState<HabitoDelDetalle | null>(null);
  const [sacando, setSacando] = useState<HabitoDelDetalle | null>(null);
  const [terminando, setTerminando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(null);

  const plan = detalle.data;
  const delDetalle = new Map((plan?.habitos ?? []).map((h) => [h.habito.id, h]));

  const acciones = useHabitActions(userId, undefined, {
    extras: (item: HabitoConHorario) => {
      const h = delDetalle.get(item.habito.id);
      if (!h) return [];
      return [
        ...(h.masLigero
          ? [{ icono: Feather, label: t.menu.masLigero, onPress: () => setMasLigero(h) }]
          : []),
        { icono: LogOut, label: t.menu.sacar, onPress: () => setSacando(h) },
      ];
    },
  });

  const fallo = () => setAviso({ texto: t.error, error: true });

  if (detalle.cargando && !plan) {
    return (
      <Screen contentClassName="items-center justify-center">
        <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
      </Screen>
    );
  }

  if (!plan) {
    return (
      <Screen contentClassName="gap-6 pt-2">
        <View className="-ml-4">
          <BackButton />
        </View>
        <AppText>{t.noActivo}</AppText>
        <Button variant="secondary" label={t.volver} onPress={() => navegar.back()} />
      </Screen>
    );
  }

  const Icono = ICONO_CATEGORIA[plan.area];
  const items = (habitos.data ?? []).filter((item) => delDetalle.has(item.habito.id));
  const desde = formatear(t.desde, {
    dia: String(Number(plan.inicio.slice(8, 10))),
    mes: es.estadisticas.meses[Number(plan.inicio.slice(5, 7)) - 1] ?? '',
  });
  const propuesta = progresion.actual ? (
    <ProgressionCard
      tarjeta={progresion.actual}
      indice={progresion.indice}
      total={progresion.total}
      ocupado={progresion.ocupado}
      onAceptar={progresion.aceptar}
      onCerrar={progresion.cerrar}
      onMantener={progresion.mantener}
      onIrAPerfil={progresion.irAPerfil}
    />
  ) : null;
  const mensajeAviso = aviso?.texto ?? progresion.aviso ?? progresion.error ?? null;
  const nombresMetas = plan.objetivos.map((o) => es.onboarding.formulario.objetivos[o]);
  const meta =
    nombresMetas.length === 0
      ? null
      : nombresMetas.length === 1
        ? formatear(t.meta, { metas: nombresMetas[0] ?? '' })
        : formatear(t.metas, {
            metas: formatear(t.metasY, {
              a: nombresMetas.slice(0, -1).join(', '),
              b: nombresMetas.at(-1) ?? '',
            }),
          });

  return (
    <>
      <Screen scroll contentClassName="grow gap-6 pt-2 pb-6">
        <View className="-ml-4">
          <BackButton />
        </View>

        <View className="flex-row items-center gap-4">
          <View
            style={{ backgroundColor: tintes[plan.area] }}
            className="h-14 w-14 items-center justify-center rounded-card"
          >
            <Icono size={28} color={colors.ink} />
          </View>
          <View className="flex-1 gap-1">
            <AppText variant="h2" accessibilityRole="header">
              {formatear(tPlanes.planDe, { area: areas[plan.area] })}
            </AppText>
            <AppText variant="small" tone="ink-soft">
              {desde}
            </AppText>
            {meta ? (
              <AppText variant="small" weight="semibold">
                {meta}
              </AppText>
            ) : null}
          </View>
        </View>

        <Seccion titulo={t.resumen}>
          <ResumenPlanCard avance={plan.avance} dias={plan.diasParaRevision} />
          {propuesta}
        </Seccion>

        <Seccion titulo={t.habitos}>
          {items.length === 0 ? (
            <AppText tone="ink-soft">{t.sinHabitos}</AppText>
          ) : (
            <View style={cardShadow} className="overflow-hidden rounded-card bg-campo">
              {items.map((item, i) => {
                const h = delDetalle.get(item.habito.id);
                return (
                  <PlanHabitRow
                    key={item.habito.id}
                    titulo={item.habito.titulo}
                    diasSemana={item.horario?.dias_semana ?? []}
                    hora={item.horario?.notificar ? item.horario.hora : null}
                    duracionMin={item.habito.duracion_min}
                    racha={h?.racha ?? 0}
                    enPausa={!item.habito.activo}
                    menuAbierto={acciones.menuAbiertoDe === item.habito.id}
                    onPress={() =>
                      navegar.push({ pathname: '/habit/[id]', params: { id: item.habito.id } })
                    }
                    onOpciones={(ancla) => acciones.abrirMenu(item, ancla)}
                    onMasLigero={
                      h?.sugerirMasLigero && item.habito.activo ? () => setMasLigero(h) : undefined
                    }
                    conDivisor={i > 0}
                  />
                );
              })}
            </View>
          )}
          {plan.puedeAgregar ? (
            <Button
              variant="secondary"
              label={t.agregar}
              icon={<Plus size={20} color={colors.ink} />}
              onPress={() =>
                navegar.push({ pathname: '/detalle-plan/sugerencias', params: { planId: plan.id } })
              }
            />
          ) : null}
        </Seccion>

        {/* Abajo del todo y como botón principal (decisión del usuario): terminar no borra nada,
            los hábitos se quedan como propios; por eso va en verde y se confirma. */}
        <View className="mt-auto pt-2">
          <Button
            label={tPlanes.terminar}
            accessibilityLabel={formatear(tPlanes.terminarEtiqueta, { area: areas[plan.area] })}
            onPress={() => setTerminando(true)}
          />
        </View>

        {acciones.capas}

        <ConfirmDialog
          visible={masLigero !== null && masLigero.masLigero !== null}
          tipo="confirmar"
          mensaje={formatear(t.masLigeroPregunta, {
            antes: masLigero
              ? conDuracion(masLigero.habito.titulo, masLigero.habito.duracion_min)
              : '',
            despues: masLigero?.masLigero
              ? conDuracion(masLigero.masLigero.titulo, masLigero.masLigero.duracion_min)
              : '',
          })}
          cancelar={t.cancelar}
          confirmar={t.masLigeroConfirmar}
          onCancelar={() => setMasLigero(null)}
          onConfirmar={() => {
            const h = masLigero;
            setMasLigero(null);
            if (!h) return;
            hacerMasLigero(userId, h.habito.id)
              .then((resultado) => {
                if (!resultado) return;
                setAviso({
                  texto: formatear(t.listoMasLigero, { titulo: resultado.despues.titulo }),
                  error: false,
                });
                void pedirTextosIa(userId, h.habito.id, 'bajar', {
                  ...resultado.despues,
                  objetivo: resultado.objetivo,
                });
              })
              .catch(fallo);
          }}
        />

        <ConfirmDialog
          visible={sacando !== null}
          tipo="peligro"
          mensaje={formatear(t.sacarPregunta, { titulo: sacando?.habito.titulo ?? '' })}
          cancelar={t.cancelar}
          confirmar={t.sacarConfirmar}
          onCancelar={() => setSacando(null)}
          onConfirmar={() => {
            const h = sacando;
            setSacando(null);
            if (!h) return;
            // Si era el último hábito, el plan se termina: se vuelve a Perfil.
            const eraElUltimo = plan.habitos.length <= 1;
            sacarDelPlan(userId, h.habito.id)
              .then(() => {
                if (eraElUltimo) navegar.back();
                else
                  setAviso({
                    texto: formatear(t.listoSacar, { titulo: h.habito.titulo }),
                    error: false,
                  });
              })
              .catch(fallo);
          }}
        />

        <ConfirmDialog
          visible={terminando}
          tipo="confirmar"
          mensaje={formatear(tPlanes.terminarPregunta, { area: areas[plan.area] })}
          cancelar={tPlanes.cancelar}
          confirmar={tPlanes.terminarConfirmar}
          onCancelar={() => setTerminando(false)}
          onConfirmar={() => {
            setTerminando(false);
            terminarPlan(userId, plan.id)
              .then(() => navegar.back())
              .catch(fallo);
          }}
        />
      </Screen>

      {acciones.aviso}
      <Snackbar
        mensaje={mensajeAviso}
        variant={aviso?.error || (!aviso && progresion.error) ? 'error' : 'exito'}
        onCerrar={() => {
          setAviso(null);
          progresion.cerrarAvisos();
        }}
      />
    </>
  );
}
