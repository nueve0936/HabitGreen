import {
  Banknote,
  Brain,
  HeartPulse,
  NotebookPen,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import type { Area } from '@/schemas/onboarding';

// Icono de línea de cada categoría, parecido a los del mockup de «Crear hábito».

export const ICONO_CATEGORIA: Record<Area, LucideIcon> = {
  salud_fisica: HeartPulse,
  trabajo: NotebookPen,
  salud_mental: Brain,
  finanzas: Banknote,
  social: Users,
};
