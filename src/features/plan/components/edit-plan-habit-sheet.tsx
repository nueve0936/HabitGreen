import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ChoicePill } from '@/components/ui/choice-pill';
import { Field } from '@/components/ui/field';
import { es, formatear } from '@/i18n/es';
import { NOMBRE_MAX, NOMBRE_MIN, TODOS_LOS_DIAS } from '@/schemas/habit';
import type { HabitoPlan } from '@/schemas/plan';
import { colors } from '@/theme';

import type { CambiosHabitoPlan } from '../domain/plan-review';
import { fechaDesdeHora, horaDesdeFecha } from '../domain/plan-review';

// «Editar hábito» de la revisión del plan (mockup «Encuesta Inicial: Editar hábito»): nombre,
// frecuencia y hora del recordatorio. La hora se elige con el reloj de Android (sujeto a cambio).
// «Cada cierto tiempo» no aparece: el plan solo guarda días de la semana (SDD 6.5).

export type EditPlanHabitSheetProps = {
  habito: HabitoPlan;
  /** Hora inicial del reloj para un hábito flexible. */
  horaPorDefecto: string;
  onCerrar: () => void;
  onGuardar: (cambios: CambiosHabitoPlan) => void;
};

export function EditPlanHabitSheet({
  habito,
  horaPorDefecto,
  onCerrar,
  onGuardar,
}: EditPlanHabitSheetProps) {
  const t = es.onboarding.revision.edicion;
  const errores = es.habitForm.errores;
  const insets = useSafeAreaInsets();
  const [titulo, setTitulo] = useState(habito.titulo);
  const [todos, setTodos] = useState(habito.dias_semana.length === 7);
  const [dias, setDias] = useState(habito.dias_semana.length === 7 ? [] : habito.dias_semana);
  const [hora, setHora] = useState<string | null>(null);
  const [notificar, setNotificar] = useState(habito.notificar);
  const [intentado, setIntentado] = useState(false);

  const nombre = titulo.trim();
  const errorNombre =
    nombre.length < NOMBRE_MIN
      ? errores.nombreCorto
      : nombre.length > NOMBRE_MAX
        ? errores.nombreLargo
        : null;
  const errorDias = !todos && dias.length === 0 ? errores.dias : null;
  const horaVisible = hora ?? (habito.flexible ? null : habito.hora);

  // Tocar la hora vuelve a activar el recordatorio y abre el reloj para cambiarla.
  const elegirHora = () => {
    setNotificar(true);
    DateTimePickerAndroid.open({
      value: fechaDesdeHora(horaVisible ?? horaPorDefecto),
      mode: 'time',
      is24Hour: true,
      onValueChange: (_evento, fecha) => setHora(horaDesdeFecha(fecha)),
    });
  };

  const guardar = () => {
    setIntentado(true);
    if (errorNombre || errorDias) return;
    onGuardar({ titulo: nombre, dias_semana: todos ? TODOS_LOS_DIAS : dias, hora, notificar });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.cerrar}
        onPress={onCerrar}
        className="flex-1 bg-ink/40"
      />
      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="gap-4 rounded-t-card bg-campo px-6 pt-4"
      >
        <View className="h-1 w-10 self-center rounded-chip bg-divisor" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.cerrar}
          onPress={onCerrar}
          className="-ml-2 h-12 w-12 items-center justify-center"
        >
          <X size={24} color={colors.ink} />
        </Pressable>
        <AppText variant="h3" accessibilityRole="header">
          {t.titulo}
        </AppText>

        <Field
          label={t.nombre}
          value={titulo}
          onChangeText={setTitulo}
          maxLength={NOMBRE_MAX}
          error={intentado && errorNombre ? errorNombre : undefined}
        />

        <View className="gap-2">
          <AppText variant="small" weight="semibold">
            {t.frecuencia}
          </AppText>
          <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
            <ChoicePill label={t.todosLosDias} selected={todos} onPress={() => setTodos(true)} />
            <ChoicePill
              label={t.diasEspecificos}
              selected={!todos}
              onPress={() => setTodos(false)}
            />
          </View>
          {todos ? null : (
            <View className="flex-row flex-wrap gap-2">
              {es.onboarding.revision.dias.map((nombreDia, i) => {
                const dia = i + 1;
                const marcado = dias.includes(dia);
                return (
                  <ChoicePill
                    key={nombreDia}
                    kind="checkbox"
                    label={nombreDia}
                    accessibilityLabel={es.habitForm.dias[i]}
                    selected={marcado}
                    onPress={() =>
                      setDias((d) => (marcado ? d.filter((x) => x !== dia) : [...d, dia]))
                    }
                  />
                );
              })}
            </View>
          )}
          {intentado && errorDias ? <Alert variant="error" message={errorDias} /> : null}
        </View>

        <View className="gap-2">
          <AppText variant="small" weight="semibold">
            {t.hora}
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            <ChoicePill
              kind="button"
              label={horaVisible ?? t.flexible}
              accessibilityLabel={formatear(t.cambiarHora, { hora: horaVisible ?? t.flexible })}
              selected={notificar}
              onPress={elegirHora}
            />
            <ChoicePill
              label={t.sinRecordatorio}
              selected={!notificar}
              onPress={() => setNotificar(false)}
            />
          </View>
        </View>

        <Button label={t.guardar} onPress={guardar} className="mt-2" />
      </View>
    </Modal>
  );
}
