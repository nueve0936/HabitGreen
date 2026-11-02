import { SwitchRow } from '@/components/ui/switch-row';
import { es } from '@/i18n/es';

// Interruptor «Segundo aviso» de la revisión del plan (SDD 5.6).

export function SecondNoticeToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = es.onboarding.revision;
  return (
    <SwitchRow
      label={t.segundoAviso}
      help={t.segundoAvisoAyuda}
      value={value}
      onChange={onChange}
    />
  );
}
