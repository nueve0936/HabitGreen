import { View } from 'react-native';

import { Dialog } from '@/components/ui/dialog';
import { OptionChip } from '@/components/ui/option-chip';
import { es } from '@/i18n/es';
import { ACOMPANAMIENTOS, type Acompanamiento } from '@/schemas/onboarding';

// Estilo de los avisos en Perfil: las mismas opciones de la pregunta 7 del formulario (SDD 7.1).

export type StyleDialogProps = {
  valor: Acompanamiento;
  onElegir: (estilo: Acompanamiento) => void;
  onCerrar: () => void;
};

export function StyleDialog({ valor, onElegir, onCerrar }: StyleDialogProps) {
  const opciones = es.onboarding.formulario.acompanamiento;
  return (
    <Dialog visible titulo={es.perfil.estiloTitulo} onCerrar={onCerrar}>
      <View className="gap-3" accessibilityRole="radiogroup">
        {ACOMPANAMIENTOS.map((estilo) => (
          <OptionChip
            key={estilo}
            label={opciones[estilo]}
            selected={estilo === valor}
            onPress={() => {
              onElegir(estilo);
              onCerrar();
            }}
          />
        ))}
      </View>
    </Dialog>
  );
}
