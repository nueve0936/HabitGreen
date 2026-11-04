import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { fechaDesdeHora, horaDesdeFecha } from '@/features/plan/domain/plan-review';
import { es } from '@/i18n/es';

import { HORA_POR_DEFECTO } from '../domain/valores-formulario';

// «Hora del recordatorio» (mockup «Crear hábito #3.1»): elegir la hora con el reloj de Android
// (sujeto a cambio) o quedarse sin recordatorio.

export type ReminderDialogProps = {
  hora: string | null;
  onElegir: (hora: string) => void;
  onSinRecordatorio: () => void;
  onCerrar: () => void;
};

export function ReminderDialog({
  hora,
  onElegir,
  onSinRecordatorio,
  onCerrar,
}: ReminderDialogProps) {
  const t = es.habitForm.dialogoHora;

  const elegir = () => {
    onCerrar();
    DateTimePickerAndroid.open({
      value: fechaDesdeHora(hora ?? HORA_POR_DEFECTO),
      mode: 'time',
      is24Hour: true,
      onValueChange: (_evento, fecha) => onElegir(horaDesdeFecha(fecha)),
    });
  };

  return (
    <Dialog visible titulo={t.titulo} onCerrar={onCerrar}>
      <Button variant="secondary" label={t.elegir} onPress={elegir} />
      <Button
        variant="secondary"
        label={t.sinRecordatorio}
        onPress={() => {
          onSinRecordatorio();
          onCerrar();
        }}
      />
      <Button variant="tertiary" label={t.cancelar} onPress={onCerrar} />
    </Dialog>
  );
}
