import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SettingsRow } from '@/components/ui/settings-row';
import { Snackbar } from '@/components/ui/snackbar';
import { guardarAjustes, leerAjustesPerfil, type CambiosAjustes } from '@/db/settings-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { SecondNoticeToggle } from '@/features/plan/components/second-notice-toggle';
import { fechaDesdeHora, horaDesdeFecha } from '@/features/plan/domain/plan-review';
import { es } from '@/i18n/es';
import { cardShadow, colors } from '@/theme';

import { StyleDialog } from '../components/style-dialog';
import type { MomentoAviso } from '../domain/planificar-avisos';
import { useAlarmasExactas, useAvisosActivos } from '../use-avisos-activos';
import { pedirAlarmasExactas } from '../avisos';

// «Avisos y horas» (Perfil → Avisos y horas; decisión del usuario, Perfil como índice): el estilo
// de avisos, el segundo aviso y las horas por momento. Cada cambio se guarda al momento en el
// teléfono y se sube con la cola (funciona sin conexión) y los avisos se recalculan solos. Las
// horas son las generales: cada hábito conserva la suya.

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

export default function AvisosHorasScreen() {
  const t = es.perfil;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const perfil = useLocalQuery(`perfil-${userId}`, () => leerAjustesPerfil(userId));
  const avisosActivos = useAvisosActivos();
  const exactas = useAlarmasExactas();
  const [eligiendoEstilo, setEligiendoEstilo] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(false);
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

  return (
    <>
      <Screen scroll contentClassName="gap-6 pt-2 pb-8">
        <View className="-ml-4">
          <BackButton />
        </View>
        <AppText variant="h2" accessibilityRole="header">
          {t.indice.avisosHoras}
        </AppText>

        {perfil.cargando && !perfil.data ? (
          <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
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
              {/* Sin alarmas exactas, Android puede retrasar los avisos hasta 1 hora. */}
              {!avisosActivos || exactas ? null : (
                <View className="gap-2">
                  <Alert variant="advertencia" message={t.horaExactaApagada} />
                  <Button
                    variant="secondary"
                    label={t.permitirHoraExacta}
                    onPress={() => void pedirAlarmasExactas().catch(() => {})}
                  />
                </View>
              )}
              <Grupo>
                <SettingsRow
                  label={t.estilo}
                  value={t.estilos[ajustes.estilo]}
                  onPress={() => setEligiendoEstilo(true)}
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
          </>
        )}

        {ajustes && eligiendoEstilo ? (
          <StyleDialog
            valor={ajustes.estilo}
            onElegir={(estilo) => guardar({ estilo_notificaciones: estilo })}
            onCerrar={() => setEligiendoEstilo(false)}
          />
        ) : null}
      </Screen>
      <Snackbar
        mensaje={errorGuardar ? t.errorGuardar : null}
        variant="error"
        onCerrar={() => setErrorGuardar(false)}
      />
    </>
  );
}
