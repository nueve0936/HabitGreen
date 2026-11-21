import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert as AlertNativo, View } from 'react-native';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { crearHabito } from '@/db/habits-repository';
import { leerAjustesLocales } from '@/db/settings-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import {
  borrarBorradorHabito,
  guardarBorradorHabito,
  leerBorradorHabito,
} from '@/features/habits/borrador-habito-store';
import { HabitWizard } from '@/features/habits/components/habit-wizard';
import type { PasoAsistente } from '@/features/habits/domain/borrador-habito';
import { textoDuracion } from '@/features/habits/domain/formato';
import { valoresNuevos } from '@/features/habits/domain/valores-formulario';
import { es, formatear } from '@/i18n/es';
import { fechaLocal } from '@/lib/dates';
import type { HabitoFormInput, HabitoFormValues } from '@/schemas/habit';
import { AREAS, type Area } from '@/schemas/onboarding';
import { colors } from '@/theme';

// Crear un hábito manual (SDD 6.5, mockups «Crear hábito #1–#3»). Se guarda en el teléfono y se
// sube al sincronizar, así que funciona sin conexión. Al terminar se vuelve a la pestaña Hábitos;
// si el tiempo diario se queda corto, se avisa con suavidad y sube. Lo escrito se guarda como
// borrador; si quedó uno sin terminar (por ejemplo, Android cerró la app), se pregunta si seguir.

type Decision = 'preguntar' | 'seguir' | 'nuevo';

export default function NuevoHabitoScreen() {
  const t = es.habitForm;
  const { categoria } = useLocalSearchParams<{ categoria?: string }>();
  const area = (AREAS as readonly string[]).includes(categoria ?? '') ? (categoria as Area) : null;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const ajustes = useLocalQuery(`ajustes-${userId}`, () => leerAjustesLocales(userId));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);
  const hoy = fechaLocal();
  const [borrador] = useState(() => leerBorradorHabito(userId, hoy));
  const [decision, setDecision] = useState<Decision>(borrador ? 'preguntar' : 'nuevo');
  // Al guardar o salir ya no se escribe el borrador, aunque quede un cambio pendiente de guardarse.
  const terminado = useRef(false);

  const guardarBorrador = useCallback(
    (valores: HabitoFormInput, paso: PasoAsistente) => {
      if (!terminado.current) guardarBorradorHabito({ userId, fecha: hoy, paso, valores });
    },
    [userId, hoy],
  );

  const salir = () => {
    terminado.current = true;
    borrarBorradorHabito();
    router.back();
  };

  const crear = async (valores: HabitoFormValues) => {
    setEnviando(true);
    setError(false);
    try {
      const { presupuestoNuevo } = await crearHabito(userId, valores);
      terminado.current = true;
      borrarBorradorHabito();
      if (presupuestoNuevo !== null) {
        AlertNativo.alert(
          t.crearTitulo,
          formatear(es.habitos.presupuestoSubio, { n: textoDuracion(presupuestoNuevo) }),
        );
      }
      // Desde Detalles de una planta se regresa ahí; si no, a la pestaña Hábitos, aunque se haya
      // llegado desde Hoy.
      if (area) {
        router.back();
      } else {
        router.dismissAll();
        router.navigate('/habitos');
      }
    } catch (causa) {
      console.warn('No se pudo crear el hábito', causa);
      setError(true);
      setEnviando(false);
    }
  };

  if (ajustes.cargando && !ajustes.data) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
        </View>
      </Screen>
    );
  }

  const retomar = decision === 'seguir' && borrador !== null;

  return (
    <>
      <HabitWizard
        // Al elegir «Seguir» se vuelve a crear con lo escrito y el paso del borrador.
        key={retomar ? 'borrador' : 'nuevo'}
        titulo={t.crearTitulo}
        textoFinal={t.crear}
        valoresIniciales={retomar ? borrador.valores : valoresNuevos(hoy, area)}
        pasoInicial={retomar ? borrador.paso : 1}
        conCambios={retomar}
        onBorrador={decision === 'preguntar' ? undefined : guardarBorrador}
        horaInicial={ajustes.data?.horaManana}
        permitirSinDuracion
        editando={false}
        hoy={hoy}
        inicioEditable
        enviando={enviando}
        error={error}
        onEnviar={(valores) => void crear(valores)}
        onCerrar={salir}
      />
      {/* «Atrás» cierra sin decidir: el borrador se queda para la próxima vez. */}
      <ConfirmDialog
        visible={decision === 'preguntar'}
        tipo="confirmar"
        mensaje={t.borrador.pregunta}
        cancelar={t.borrador.cancelar}
        confirmar={t.borrador.seguir}
        onCancelar={() => {
          borrarBorradorHabito();
          setDecision('nuevo');
        }}
        onConfirmar={() => setDecision('seguir')}
        onCerrar={() => router.back()}
      />
    </>
  );
}
