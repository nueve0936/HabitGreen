import { Bell, LogOut, Sprout, Timer } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MenuRow } from '@/components/ui/menu-row';
import { Screen } from '@/components/ui/screen';
import { Snackbar } from '@/components/ui/snackbar';
import { avisarCambioLocal } from '@/db/db-version-store';
import { leerMisPlanes } from '@/db/plan-repository';
import { guardarAjustes, leerAjustesPerfil } from '@/db/settings-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { textoDuracion } from '@/features/habits/domain/formato';
import { BudgetDialog } from '@/features/reminders/components/budget-dialog';
import { useAvisosActivos } from '@/features/reminders/use-avisos-activos';
import { es, formatear } from '@/i18n/es';
import { navegar } from '@/lib/navegar';
import { cardShadow, colors } from '@/theme';

// Perfil (SDD 9.4; decisión del usuario, «índice con pantallas»): arriba la cuenta; debajo una
// tarjeta con tres filas que resumen y abren lo suyo («Mis planes» y «Avisos y horas» abren su
// pantalla; «Tiempo diario», su diálogo de ruedas) y al final «Cerrar sesión». Cabe en una sola
// pantalla. Cada cambio se guarda en el teléfono y se sube con la cola: funciona sin conexión.

export default function PerfilScreen() {
  const t = es.perfil;
  const { session, signOut } = useSession();
  const userId = session?.user.id ?? '';
  const correo = session?.user.email ?? '';
  const perfil = useLocalQuery(`perfil-${userId}`, () => leerAjustesPerfil(userId));
  const planes = useLocalQuery(`mis-planes-${userId}`, () => leerMisPlanes(userId));
  const avisosActivos = useAvisosActivos();
  const [signingOut, setSigningOut] = useState(false);
  // Sin conexión y con cambios sin subir: se pregunta antes de cerrar sesión (se perderían).
  const [conPendientes, setConPendientes] = useState(false);
  const [eligiendoTiempo, setEligiendoTiempo] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(false);

  const ajustes = perfil.data?.ajustes ?? null;
  const minutosDia = perfil.data?.minutosDiaMasCargado ?? 0;
  const cuantos = planes.data?.length ?? 0;
  const textoPlanes =
    cuantos === 0
      ? t.indice.sinPlanes
      : cuantos === 1
        ? t.indice.unPlan
        : formatear(t.indice.planes, { n: String(cuantos) });

  const onSignOut = async (forzar = false) => {
    setSigningOut(true);
    try {
      const resultado = await signOut({ revisarPendientes: !forzar });
      if (resultado === 'pendientes') setConPendientes(true);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
        <AppText variant="h1">{es.tabs.perfil}</AppText>

        <View
          accessible
          accessibilityLabel={formatear(t.indice.cuentaA11y, { correo })}
          className="flex-row items-center gap-3"
        >
          <View className="h-12 w-12 items-center justify-center rounded-chip bg-accent-claro">
            <AppText variant="h3" tone="acento">
              {(correo[0] ?? '?').toUpperCase()}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText variant="small" tone="ink-soft">
              {t.sesionIniciada}
            </AppText>
            <AppText weight="semibold" numberOfLines={1}>
              {correo}
            </AppText>
          </View>
        </View>

        {perfil.cargando && !perfil.data ? (
          <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
        ) : perfil.error && !perfil.data ? (
          <View className="gap-4">
            <Alert variant="error" message={t.errorLeer} />
            <Button variant="secondary" label={es.comun.reintentar} onPress={avisarCambioLocal} />
          </View>
        ) : (
          <View className="gap-3">
            <View style={cardShadow} className="overflow-hidden rounded-card bg-campo">
              <MenuRow
                icono={Sprout}
                titulo={t.planes.titulo}
                valor={textoPlanes}
                onPress={() => navegar.push('/mis-planes')}
              />
              <MenuRow
                icono={Bell}
                titulo={t.indice.avisosHoras}
                resumen={
                  !avisosActivos
                    ? t.indice.avisosApagados
                    : ajustes
                      ? t.estilos[ajustes.estilo]
                      : undefined
                }
                alerta={!avisosActivos}
                onPress={() => navegar.push('/avisos-horas')}
              />
              {ajustes ? (
                <MenuRow
                  icono={Timer}
                  titulo={t.tiempo}
                  valor={textoDuracion(ajustes.presupuestoMin)}
                  onPress={() => setEligiendoTiempo(true)}
                  ultima
                />
              ) : null}
            </View>
            {ajustes === null ? <Alert variant="info" message={t.sinAjustes} /> : null}
            {/* Se permite bajarlo: solo se avisa, nunca se tocan los hábitos (SDD 6.5). */}
            {ajustes && minutosDia > ajustes.presupuestoMin ? (
              <Alert
                variant="advertencia"
                message={formatear(t.tiempoCorto, { n: textoDuracion(minutosDia) })}
              />
            ) : null}
          </View>
        )}

        <View className="mt-auto">
          <Button
            variant="secondary"
            label={t.cerrarSesion}
            loading={signingOut}
            onPress={() => void onSignOut()}
            icon={<LogOut size={20} color={colors.ink} />}
          />
        </View>

        <ConfirmDialog
          visible={conPendientes}
          tipo="peligro"
          mensaje={t.pendientes.mensaje}
          cancelar={t.pendientes.cancelar}
          confirmar={t.pendientes.cerrar}
          onCancelar={() => setConPendientes(false)}
          onConfirmar={() => {
            setConPendientes(false);
            void onSignOut(true);
          }}
        />

        {ajustes && eligiendoTiempo ? (
          <BudgetDialog
            valor={ajustes.presupuestoMin}
            minutosDia={minutosDia}
            onElegir={(minutos) => {
              setErrorGuardar(false);
              guardarAjustes(userId, { presupuesto_min: minutos }).catch(() =>
                setErrorGuardar(true),
              );
            }}
            onCerrar={() => setEligiendoTiempo(false)}
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
