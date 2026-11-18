import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoicePill } from '@/components/ui/choice-pill';
import { Dialog } from '@/components/ui/dialog';
import { es } from '@/i18n/es';

import { diaCorto } from '../domain/texto-dia';

// «Elegir otro día»: los días libres de la propuesta (fuera del patrón del hábito, dentro de los
// próximos 7 y sin pasar del tiempo diario). Tocar uno lo elige y cierra.

export type DayDialogProps = {
  dias: readonly string[];
  hoy: string;
  onElegir: (fecha: string) => void;
  onCerrar: () => void;
};

export function DayDialog({ dias, hoy, onElegir, onCerrar }: DayDialogProps) {
  const t = es.reprogramar;
  return (
    <Dialog visible titulo={t.dialogoTitulo} onCerrar={onCerrar}>
      <View className="flex-row flex-wrap justify-center gap-2">
        {dias.map((fecha) => (
          <ChoicePill
            key={fecha}
            kind="button"
            label={diaCorto(fecha, hoy)}
            selected={false}
            onPress={() => {
              onElegir(fecha);
              onCerrar();
            }}
          />
        ))}
      </View>
      <Button variant="tertiary" label={t.cancelar} onPress={onCerrar} />
    </Dialog>
  );
}
