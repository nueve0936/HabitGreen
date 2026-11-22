import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { LogOut } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, Linking, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SettingsRow } from '@/components/ui/settings-row';
import { Snackbar } from '@/components/ui/snackbar';
import { avisarCambioLocal } from '@/db/db-version-store';
import { guardarAjustes, leerAjustesPerfil, type CambiosAjustes } from '@/db/settings-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { textoDuracion } from '@/features/habits/domain/formato';
import { MisPlanes } from '@/features/plan/components/mis-planes';
import { SecondNoticeToggle } from '@/features/plan/components/second-notice-toggle';
import { fechaDesdeHora, horaDesdeFecha } from '@/features/plan/domain/plan-review';
import { permisoConcedido } from '@/features/reminders/avisos';
import { BudgetDialog } from '@/features/reminders/components/budget-dialog';
import { StyleDialog } from '@/features/reminders/components/style-dialog';
import type { MomentoAviso } from '@/features/reminders/domain/planificar-avisos';
import { es, formatear } from '@/i18n/es';
import { cardShadow, colors } from '@/theme';

// Perfil (SDD 9.4): avisos, horas por momento, tiempo diario, mis planes y la cuenta. Cada cambio se guarda al
// momento en el teléfono y se sube con la cola, así que funciona sin conexión (SDD 3.4) y los avisos
// se recalculan solos. Las horas son las generales: cada hábito conserva la suya.

const MOMENTOS: Exclude<MomentoAviso, 'resumen_nocturno'>[] = [
  'manana',
  'mediodia',
  'tarde',
  'noche',
];

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

function Grupo({ children }: { children: ReactNode }) {
  return (
    <View style={cardShadow} className="overflow-hidden rounded-card bg-campo">
      {children}
    </View>
  );
}

export default function PerfilScreen() {
  const t = es.perfil;
  const { session, signOut } = useSession();
  const userId = session?.user.id ?? '';
  const perfil = useLocalQuery(`perfil-${userId}`, () => leerAjustesPerfil(userId));
  const [signingOut, setSigningOut] = useState(false);
  const [dialogo, setDialogo] = useState<'estilo' | 'tiempo' | null>(null);
  const [errorGuardar, setErrorGuardar] = useState(false);
  const [avisosActivos, setAvisosActivos] = useState(true);

  // Al volver de los ajustes de Android, el estado del permiso puede haber cambiado.
  useEffect(() => {
    const revisar = () => {
      permisoConcedido()
        .then(setAvisosActivos)
        .catch(() => setAvisosActivos(true));
    };
    revisar();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') revisar();
    });
    return () => suscripcion.remove();
  }, []);

  const ajustes = perfil.data?.ajustes ?? null;

  const guardar = (cambios: CambiosAjustes) => {
    setErrorGuardar(false);
    guardarAjustes(userId, cambios).catch(() => setErrorGuardar(true));
  };

  const elegirHora = (momento: MomentoAviso) => {
    if (!ajustes) return;
    DateTimePickerAndroid.open({
      value: fechaDesdeHora(ajustes.horas[momento]),
      mode: 'time',
      is24Hour: true,
      onValueChange: (_evento, fecha) =>
        guardar({ horas_por_momento: { ...ajustes.horas, [momento]: horaDesdeFecha(fecha) } }),
    });
  };

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const minutosDia = perfil.data?.minutosDiaMasCargado ?? 0;

  return (
    <>
      <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
        <AppText variant="h1">{es.tabs.perfil}</AppText>

        {perfil.cargando && !perfil.data ? (
          <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
        ) : perfil.error && !perfil.data ? (
          <View className="gap-4">
            <Alert variant="error" message={t.errorLeer} />
            <Button variant="secondary" label={es.comun.reintentar} onPress={avisarCambioLocal} />
          </View>
        ) : ajustes === null ? (
          <Alert variant="info" message={t.sinAjustes} />
        ) : (
          <>
            <Seccion titulo={t.avisos}>
              {avisosActivos ? null : (
                <View className="gap-2">
                  <Alert variant="advertencia" message={t.avisosApagados} />
                  <Button
                    variant="secondary"
                    label={t.abrirAjustes}
                    onPress={() => void Linking.openSettings()}
                  />
                </View>
              )}
              <Grupo>
                <SettingsRow
                  label={t.estilo}
                  value={t.estilos[ajustes.estilo]}
                  onPress={() => setDialogo('estilo')}
                  ultima={ajustes.estilo === 'resumen_nocturno'}
                />
                {/* El segundo aviso solo existe con avisos por hábito (SDD 5.6). */}
                {ajustes.estilo === 'resumen_nocturno' ? null : (
                  <View className="px-4 py-2">
                    <SecondNoticeToggle
                      value={ajustes.segundoAviso}
                      onChange={(activo) => guardar({ segundo_aviso: activo })}
                    />
                  </View>
                )}
              </Grupo>
            </Seccion>

            <Seccion titulo={t.horas}>
              <Grupo>
                {MOMENTOS.map((momento, i) => (
                  <SettingsRow
                    key={momento}
                    label={es.onboarding.formulario.momento[momento]}
                    value={ajustes.horas[momento]}
                    onPress={() => elegirHora(momento)}
                    ultima={i === MOMENTOS.length - 1 && ajustes.estilo !== 'resumen_nocturno'}
                  />
                ))}
                {ajustes.estilo === 'resumen_nocturno' ? (
                  <SettingsRow
                    label={t.resumen}
                    value={ajustes.horas.resumen_nocturno}
                    onPress={() => elegirHora('resumen_nocturno')}
                    ultima
                  />
                ) : null}
              </Grupo>
              <AppText variant="small" tone="ink-soft">
                {t.horasNota}
              </AppText>
            </Seccion>

            <Seccion titulo={t.tiempo}>
              <Grupo>
                <SettingsRow
                  label={t.tiempoAlDia}
                  value={textoDuracion(ajustes.presupuestoMin)}
                  onPress={() => setDialogo('tiempo')}
                  ultima
                />
              </Grupo>
              {/* Se permite bajarlo: solo se avisa, nunca se tocan los hábitos (SDD 6.5). */}
              {minutosDia > ajustes.presupuestoMin ? (
                <Alert
                  variant="advertencia"
                  message={formatear(t.tiempoCorto, { n: textoDuracion(minutosDia) })}
                />
              ) : null}
            </Seccion>
          </>
        )}

        <Seccion titulo={t.planes.titulo}>
          <MisPlanes userId={userId} />
        </Seccion>

        <Seccion titulo={t.cuenta}>
          <Card className="gap-1">
            <AppText variant="small">{t.sesionIniciada}</AppText>
            <AppText variant="body" weight="semibold">
              {session?.user.email ?? ''}
            </AppText>
          </Card>
        </Seccion>

        <View className="mt-auto">
          <Button
            variant="secondary"
            label={t.cerrarSesion}
            loading={signingOut}
            onPress={onSignOut}
            icon={<LogOut size={20} color={colors.ink} />}
          />
        </View>

        {ajustes && dialogo === 'estilo' ? (
          <StyleDialog
            valor={ajustes.estilo}
            onElegir={(estilo) => guardar({ estilo_notificaciones: estilo })}
            onCerrar={() => setDialogo(null)}
          />
        ) : null}
        {ajustes && dialogo === 'tiempo' ? (
          <BudgetDialog
            valor={ajustes.presupuestoMin}
            minutosDia={minutosDia}
            onElegir={(minutos) => guardar({ presupuesto_min: minutos })}
            onCerrar={() => setDialogo(null)}
          />
        ) : null}
      </Screen>
      {/* Flota sobre la pantalla: se ve aunque el cambio se haya hecho al final de la lista. */}
      <Snackbar
        mensaje={errorGuardar ? t.errorGuardar : null}
        variant="error"
        onCerrar={() => setErrorGuardar(false)}
      />
    </>
  );
}
