import { zodResolver } from '@hookform/resolvers/zod';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Clock } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FilterChip } from '@/components/ui/filter-chip';
import { OptionChip } from '@/components/ui/option-chip';
import { SwitchRow } from '@/components/ui/switch-row';
import { fechaDesdeHora, horaDesdeFecha } from '@/features/plan/domain/plan-review';
import { es, formatear } from '@/i18n/es';
import {
  habitoFormSchema,
  NOMBRE_MAX,
  type HabitoFormInput,
  type HabitoFormValues,
} from '@/schemas/habit';
import { AREAS } from '@/schemas/onboarding';
import { colors } from '@/theme';

import { ICONO_CATEGORIA } from '../categoria-icono';

// Formulario de crear y editar hábito (mockup «Crear hábito» + campos del SDD 6.5): nombre,
// descripción, categoría, frecuencia, duración, hora y «Avisarme». Al editar, la categoría se
// muestra pero no se puede cambiar (definición 6).

export const HORA_POR_DEFECTO = '08:00';

export type HabitFormProps = {
  valoresIniciales: HabitoFormInput;
  editando: boolean;
  enviando: boolean;
  error: boolean;
  textoBoton: string;
  onEnviar: (valores: HabitoFormValues) => void;
  /** Acciones extra al pie (pausar, eliminar) en la edición. */
  pie?: ReactNode;
};

export function HabitForm({
  valoresIniciales,
  editando,
  enviando,
  error,
  textoBoton,
  onEnviar,
  pie,
}: HabitFormProps) {
  const t = es.habitForm;
  const areas = es.onboarding.formulario.areas;
  const {
    control,
    handleSubmit,

    formState: { errors },
  } = useForm<HabitoFormInput, unknown, HabitoFormValues>({
    resolver: zodResolver(habitoFormSchema),
    defaultValues: valoresIniciales,
  });
  const frecuencia = useWatch({ control, name: 'frecuencia' });

  return (
    <View className="gap-6">
      <Controller
        control={control}
        name="nombre"
        render={({ field }) => (
          <Field
            label={t.nombre}
            placeholder={t.nombrePlaceholder}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={NOMBRE_MAX}
            error={errors.nombre?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="descripcion"
        render={({ field }) => (
          <Field
            label={t.descripcion}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.descripcion?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="categoria"
        render={({ field }) => (
          <View className="gap-2">
            <AppText variant="small" weight="semibold">
              {t.categoria}
            </AppText>
            {editando ? (
              <AppText variant="small" tone="ink-soft">
                {t.categoriaFija}
              </AppText>
            ) : null}
            <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
              {AREAS.filter((a) => !editando || a === field.value).map((area) => {
                const Icono = ICONO_CATEGORIA[area];
                return (
                  <FilterChip
                    key={area}
                    label={areas[area]}
                    selected={field.value === area}
                    icon={<Icono size={18} color={colors.ink} />}
                    onPress={() => {
                      if (!editando) field.onChange(area);
                    }}
                  />
                );
              })}
            </View>
            {errors.categoria?.message ? (
              <Alert variant="error" message={errors.categoria.message} />
            ) : null}
          </View>
        )}
      />

      <View className="gap-2">
        <AppText variant="small" weight="semibold">
          {t.frecuencia}
        </AppText>
        <Controller
          control={control}
          name="frecuencia"
          render={({ field }) => (
            <View className="gap-2" accessibilityRole="radiogroup">
              <OptionChip
                label={t.todosLosDias}
                selected={field.value === 'todos'}
                onPress={() => field.onChange('todos')}
              />
              <OptionChip
                label={t.semana}
                selected={field.value === 'semana'}
                onPress={() => field.onChange('semana')}
              />
            </View>
          )}
        />
        {frecuencia === 'semana' ? (
          <Controller
            control={control}
            name="dias"
            render={({ field }) => (
              <View className="gap-2">
                <View className="flex-row flex-wrap gap-2">
                  {t.dias.map((nombre, i) => {
                    const dia = i + 1;
                    const marcado = field.value.includes(dia);
                    return (
                      <FilterChip
                        key={nombre}
                        kind="checkbox"
                        label={nombre}
                        selected={marcado}
                        onPress={() =>
                          field.onChange(
                            marcado ? field.value.filter((d) => d !== dia) : [...field.value, dia],
                          )
                        }
                      />
                    );
                  })}
                </View>
                {errors.dias?.message ? (
                  <Alert variant="error" message={errors.dias.message} />
                ) : null}
              </View>
            )}
          />
        ) : null}
      </View>

      <Controller
        control={control}
        name="duracion"
        render={({ field }) => (
          <Field
            label={t.duracion}
            keyboardType="number-pad"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={3}
            error={errors.duracion?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="hora"
        render={({ field }) => {
          const texto = field.value ?? t.horaFlexible;
          return (
            <View className="gap-1">
              <AppText variant="small" weight="semibold">
                {t.hora}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={formatear(t.cambiarHora, { hora: texto })}
                onPress={() =>
                  DateTimePickerAndroid.open({
                    value: fechaDesdeHora(field.value ?? HORA_POR_DEFECTO),
                    mode: 'time',
                    is24Hour: true,
                    onValueChange: (_evento, fecha) => field.onChange(horaDesdeFecha(fecha)),
                  })
                }
                className="h-12 flex-row items-center gap-2 rounded-field border-2 border-ink-soft bg-campo px-3 active:bg-bg-claro"
              >
                <Clock size={20} color={colors.ink} />
                <AppText>{texto}</AppText>
              </Pressable>
              {errors.hora?.message ? (
                <Alert variant="error" message={errors.hora.message} />
              ) : null}
            </View>
          );
        }}
      />

      <Controller
        control={control}
        name="avisarme"
        render={({ field }) => (
          <SwitchRow
            label={t.avisarme}
            help={t.avisarmeAyuda}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      {error ? <Alert variant="error" message={t.errorGuardar} /> : null}

      {/* handleSubmit espera un evento web; en React Native se llama sin argumentos. */}
      <Button label={textoBoton} loading={enviando} onPress={() => void handleSubmit(onEnviar)()} />
      {pie}
    </View>
  );
}
