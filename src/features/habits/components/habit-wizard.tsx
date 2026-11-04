import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { BackHandler, Pressable, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { DateWheelDialog } from '@/components/ui/date-wheel-dialog';
import { DaySquares } from '@/components/ui/day-squares';
import { Field } from '@/components/ui/field';
import { OptionChip } from '@/components/ui/option-chip';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Screen } from '@/components/ui/screen';
import { SettingsRow } from '@/components/ui/settings-row';
import { es, formatear } from '@/i18n/es';
import {
  DESCRIPCION_MAX,
  habitoFormSchema,
  NOMBRE_MAX,
  type HabitoFormInput,
  type HabitoFormValues,
} from '@/schemas/habit';
import { AREAS } from '@/schemas/onboarding';
import { cardShadow, colors } from '@/theme';

import { ICONO_CATEGORIA } from '../categoria-icono';
import { textoFecha } from '../domain/fechas';
import { DurationDialog } from './duration-dialog';
import { ReminderDialog } from './reminder-dialog';

// Asistente de crear y editar hábito (mockups «Crear hábito #1–#3» y «Editar hábito #1–#3»):
// 1) nombre y descripción opcional; 2) categoría (fija al editar, definición 6); 3) días,
// recordatorio, duración y fechas de inicio y fin. Cada paso se valida al pulsar «Siguiente».

const TOTAL_PASOS = 3;
type Paso = 1 | 2 | 3;
type Dialogo = 'hora' | 'duracion' | 'inicio' | 'fin' | null;

export type HabitWizardProps = {
  titulo: string;
  textoFinal: string;
  valoresIniciales: HabitoFormInput;
  editando: boolean;
  /** Fecha local de hoy: la mínima para el inicio y el fin. */
  hoy: string;
  /** Al editar, la fecha de inicio solo cambia si el hábito todavía no empieza. */
  inicioEditable: boolean;
  enviando: boolean;
  error: boolean;
  onEnviar: (valores: HabitoFormValues) => void;
  onCerrar: () => void;
};

export function HabitWizard({
  titulo,
  textoFinal,
  valoresIniciales,
  editando,
  hoy,
  inicioEditable,
  enviando,
  error,
  onEnviar,
  onCerrar,
}: HabitWizardProps) {
  const t = es.habitForm;
  const areas = es.onboarding.formulario.areas;
  const [paso, setPaso] = useState<Paso>(1);
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<HabitoFormInput, unknown, HabitoFormValues>({
    resolver: zodResolver(habitoFormSchema),
    defaultValues: valoresIniciales,
  });
  const valores = useWatch({ control }) as HabitoFormInput;

  const siguiente = async () => {
    const campos = paso === 1 ? (['nombre', 'descripcion'] as const) : (['categoria'] as const);
    if (await trigger(campos)) setPaso((p) => (p + 1) as Paso);
  };
  const atras = () => (paso === 1 ? onCerrar() : setPaso((p) => (p - 1) as Paso));

  // El botón «atrás» del sistema regresa al paso anterior en vez de salir del asistente.
  useEffect(() => {
    if (paso === 1) return;
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      setPaso((p) => (p - 1) as Paso);
      return true;
    });
    return () => suscripcion.remove();
  }, [paso]);

  const textoRecordatorio = valores.notificar ? (valores.hora ?? t.flexible) : t.ninguno;
  const minimaFin = valores.fecha_inicio > hoy ? valores.fecha_inicio : hoy;
  const Atras = paso === 1 ? X : ArrowLeft;

  return (
    <Screen scroll contentClassName="gap-6 pt-2">
      <View className="flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paso === 1 ? t.cerrar : es.comun.volver}
          onPress={atras}
          className="-ml-3 h-12 w-12 items-center justify-center"
        >
          <Atras size={26} color={colors.ink} />
        </Pressable>
        <AppText variant="h3" className="flex-1 text-center">
          {titulo}
        </AppText>
        <View className="h-12 w-12" />
      </View>
      <ProgressSteps current={paso} total={TOTAL_PASOS} />

      {paso === 1 ? (
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
                placeholder={t.descripcionPlaceholder}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline
                maxLength={DESCRIPCION_MAX}
                error={errors.descripcion?.message}
              />
            )}
          />
        </View>
      ) : null}

      {paso === 2 ? (
        <View className="gap-4">
          <AppText weight="semibold" className="text-center">
            {t.categoriaTitulo}
          </AppText>
          {editando ? (
            <AppText variant="small" tone="ink-soft" className="text-center">
              {t.categoriaFija}
            </AppText>
          ) : null}
          <Controller
            control={control}
            name="categoria"
            render={({ field }) => (
              <View className="gap-3" accessibilityRole="radiogroup">
                {AREAS.filter((a) => !editando || a === field.value).map((area) => {
                  const Icono = ICONO_CATEGORIA[area];
                  return (
                    <OptionChip
                      key={area}
                      label={areas[area]}
                      selected={field.value === area}
                      icon={<Icono size={26} color={colors.ink} />}
                      onPress={() => {
                        if (!editando) field.onChange(area);
                      }}
                    />
                  );
                })}
              </View>
            )}
          />
          {errors.categoria?.message ? (
            <Alert variant="error" message={errors.categoria.message} />
          ) : null}
        </View>
      ) : null}

      {paso === 3 ? (
        <View className="gap-4">
          <AppText weight="bold">{t.frecuencia}</AppText>
          <Controller
            control={control}
            name="dias"
            render={({ field }) => (
              <DaySquares
                value={field.value}
                onChange={field.onChange}
                iniciales={t.iniciales}
                nombres={t.dias}
              />
            )}
          />
          {errors.dias?.message ? <Alert variant="error" message={errors.dias.message} /> : null}

          <View style={cardShadow} className="mt-2 overflow-hidden rounded-card bg-campo">
            <SettingsRow
              label={t.recordatorios}
              value={textoRecordatorio}
              onPress={() => setDialogo('hora')}
            />
            <SettingsRow
              label={t.duracion}
              value={formatear(t.minutos, { n: valores.duracion })}
              onPress={() => setDialogo('duracion')}
            />
            <SettingsRow
              label={t.fechaInicio}
              value={textoFecha(valores.fecha_inicio)}
              destacada
              onPress={!editando || inicioEditable ? () => setDialogo('inicio') : undefined}
            />
            <SettingsRow
              label={t.fechaFin}
              value={valores.fecha_fin ? textoFecha(valores.fecha_fin) : t.ninguno}
              onPress={() => setDialogo('fin')}
              ultima
            />
          </View>
          {editando && !inicioEditable ? (
            <AppText variant="small" tone="ink-soft">
              {t.inicioFijo}
            </AppText>
          ) : null}
          {errors.hora?.message ? <Alert variant="error" message={errors.hora.message} /> : null}
          {errors.fecha_fin?.message ? (
            <Alert variant="error" message={errors.fecha_fin.message} />
          ) : null}
          {error ? <Alert variant="error" message={t.errorGuardar} /> : null}
        </View>
      ) : null}

      <Button
        label={paso < TOTAL_PASOS ? t.siguiente : textoFinal}
        loading={enviando}
        // handleSubmit espera un evento web; en React Native se llama sin argumentos.
        onPress={() => (paso < TOTAL_PASOS ? void siguiente() : void handleSubmit(onEnviar)())}
        className="mt-auto"
      />

      {dialogo === 'hora' ? (
        <ReminderDialog
          hora={valores.hora}
          onElegir={(hora) => {
            setValue('hora', hora);
            setValue('notificar', true);
            setValue('flexible', false);
          }}
          onSinRecordatorio={() => setValue('notificar', false)}
          onCerrar={() => setDialogo(null)}
        />
      ) : null}
      {dialogo === 'duracion' ? (
        <DurationDialog
          valor={valores.duracion}
          onElegir={(minutos) => setValue('duracion', minutos)}
          onCerrar={() => setDialogo(null)}
        />
      ) : null}
      {dialogo === 'inicio' ? (
        <DateWheelDialog
          textos={t.dialogoFecha}
          valor={valores.fecha_inicio < hoy ? hoy : valores.fecha_inicio}
          minima={hoy}
          onCancelar={() => setDialogo(null)}
          onAceptar={(fecha) => {
            setValue('fecha_inicio', fecha);
            // Una fecha de fin anterior al nuevo inicio deja de tener sentido.
            if (valores.fecha_fin !== null && valores.fecha_fin < fecha)
              setValue('fecha_fin', null);
            setDialogo(null);
          }}
        />
      ) : null}
      {dialogo === 'fin' ? (
        <DateWheelDialog
          textos={t.dialogoFecha}
          valor={valores.fecha_fin ?? minimaFin}
          minima={minimaFin}
          onCancelar={() => setDialogo(null)}
          onAceptar={(fecha) => {
            setValue('fecha_fin', fecha);
            setDialogo(null);
          }}
          onQuitar={() => {
            setValue('fecha_fin', null);
            setDialogo(null);
          }}
        />
      ) : null}
    </Screen>
  );
}
