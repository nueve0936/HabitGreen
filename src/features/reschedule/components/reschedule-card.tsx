import { CalendarArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { hacerMasLigero, pedirTextosIa } from '@/db/progression-repository';
import { leerContextoQuePaso } from '@/db/que-paso-repository';
import { guardarAjustes } from '@/db/settings-repository';
import { es, formatear } from '@/i18n/es';
import { navegar } from '@/lib/navegar';
import { colors } from '@/theme';

import { CAUSAS, sugerir, type Causa, type ContextoQuePaso } from '../domain/que-paso';
import type { Propuesta } from '../domain/reprogramar';
import { destinoDia } from '../domain/texto-dia';

// Tarjeta de reprogramación en Hoy (SDD 6.2): arriba de la lista y dentro de lo que se desplaza,
// para no quitarle espacio fijo a los hábitos. Tono neutro: «Movimos… Puedes cambiarlo». Los
// botones van con borde (secundarios) para no competir con marcar los hábitos; si no caben en un
// renglón (letra grande), se apilan. Sin día libre, solo se avisa con «Entendido».
//
// «¿Qué pasó?» (ajustes, decisiones del usuario del 22 nov) es opcional: un enlace junto a «Dejarlo»
// despliega 4 causas y la app sugiere un solo ajuste que se aplica con un toque o se ignora. La
// respuesta no se guarda. Las opciones son filas de radio sin sombra: dentro de la tarjeta, otra
// tarjeta sería una tarjeta anidada.

export type RescheduleCardProps = {
  userId: string;
  propuesta: Propuesta;
  hoy: string;
  /** Posición entre las propuestas de hoy («1 de 2»); no se muestra si hay una sola. */
  indice: number;
  total: number;
  ocupado: boolean;
  onAceptar: () => void;
  onOtroDia: () => void;
  onDejar: () => void;
};

export function RescheduleCard({
  userId,
  propuesta,
  hoy,
  indice,
  total,
  ocupado,
  onAceptar,
  onOtroDia,
  onDejar,
}: RescheduleCardProps) {
  const t = es.reprogramar;
  const habito = propuesta.habito.titulo;
  const mensaje =
    propuesta.diaPropuesto === null
      ? formatear(t.sinDia, { habito })
      : formatear(t.propuesta, { habito, destino: destinoDia(propuesta.diaPropuesto, hoy) });

  return (
    <Card className="gap-4">
      <View className="flex-row gap-3">
        <View
          importantForAccessibility="no-hide-descendants"
          className="h-10 w-10 items-center justify-center rounded-chip bg-accent-claro"
        >
          <CalendarArrowRight size={22} color={colors.accent} />
        </View>
        <View className="flex-1 gap-1">
          <AppText>{mensaje}</AppText>
          {total > 1 ? (
            <AppText variant="small" tone="ink-soft">
              {formatear(t.contador, { n: indice, total })}
            </AppText>
          ) : null}
        </View>
      </View>

      {propuesta.diaPropuesto === null ? (
        <Button variant="secondary" label={t.entendido} disabled={ocupado} onPress={onDejar} />
      ) : (
        <View className="gap-1">
          <View className="flex-row flex-wrap gap-3">
            <Button
              variant="secondary"
              label={t.otroDia}
              disabled={ocupado}
              onPress={onOtroDia}
              className="grow"
            />
            <Button
              variant="secondary"
              label={t.aceptar}
              disabled={ocupado}
              onPress={onAceptar}
              className="grow"
            />
          </View>
          {/* La key reinicia la pregunta al pasar a la siguiente propuesta. */}
          <QuePaso
            key={`${propuesta.habito.id}-${propuesta.fechaOriginal}`}
            userId={userId}
            habitId={propuesta.habito.id}
            ocupado={ocupado}
            onDejar={onDejar}
            onOtroDia={onOtroDia}
          />
        </View>
      )}
    </Card>
  );
}

type QuePasoProps = {
  userId: string;
  habitId: string;
  ocupado: boolean;
  onDejar: () => void;
  onOtroDia: () => void;
};

function QuePaso({ userId, habitId, ocupado, onDejar, onOtroDia }: QuePasoProps) {
  const t = es.reprogramar.quePaso;
  const [abierto, setAbierto] = useState(false);
  const [contexto, setContexto] = useState<ContextoQuePaso | null>(null);
  const [causa, setCausa] = useState<Causa | null>(null);
  const [aplicando, setAplicando] = useState(false);
  const [resultado, setResultado] = useState<{ texto: string; error: boolean } | null>(null);

  const alternar = () => {
    const abrir = !abierto;
    setAbierto(abrir);
    // El contexto se lee la primera vez que se abre; si falla, se sugiere lo más simple.
    if (abrir && contexto === null) {
      leerContextoQuePaso(userId, habitId)
        .then(setContexto)
        .catch(() =>
          setContexto({
            masLigero: false,
            conDuracion: false,
            recordatorio: true,
            segundoAviso: true,
            segundoAvisoDisponible: false,
          }),
        );
    }
  };

  const sugerencia = causa && contexto ? sugerir(causa, contexto) : null;

  const elegir = (nueva: Causa) => {
    setCausa(nueva);
    setResultado(null);
    if (contexto) {
      AccessibilityInfo.announceForAccessibility(t.sugerencias[sugerir(nueva, contexto).tipo]);
    }
  };

  const aplicar = async (accion: () => Promise<string | null>) => {
    setAplicando(true);
    try {
      const texto = await accion();
      if (texto) {
        setResultado({ texto, error: false });
        AccessibilityInfo.announceForAccessibility(texto);
      }
    } catch {
      setResultado({ texto: t.error, error: true });
    } finally {
      setAplicando(false);
    }
  };

  const accion = () => {
    switch (sugerencia?.tipo) {
      case 'mas_ligero':
        void aplicar(async () => {
          const r = await hacerMasLigero(userId, habitId);
          if (!r) return null;
          void pedirTextosIa(userId, habitId, 'bajar', { ...r.despues, objetivo: r.objetivo });
          return formatear(t.listoMasLigero, { titulo: r.despues.titulo });
        });
        break;
      case 'segundo_aviso':
        void aplicar(async () => {
          await guardarAjustes(userId, { segundo_aviso: true });
          return t.listoSegundoAviso;
        });
        break;
      case 'editar_duracion':
      case 'recordatorio':
        navegar.push({ pathname: '/habit/[id]', params: { id: habitId } });
        break;
      case 'otro_dia':
        onOtroDia();
        break;
      default:
        break;
    }
  };

  const etiquetaAccion = sugerencia ? t.acciones[sugerencia.tipo] : null;

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap items-center justify-center gap-x-6">
        <Button
          variant="tertiary"
          label={es.reprogramar.dejar}
          disabled={ocupado}
          onPress={onDejar}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.enlace}
          accessibilityState={{ expanded: abierto, disabled: ocupado }}
          disabled={ocupado}
          onPress={alternar}
          className="min-h-12 flex-row items-center justify-center gap-1 px-2 active:opacity-70"
        >
          <AppText weight="semibold" tone={ocupado ? 'ink-soft' : 'ink'} className="underline">
            {t.enlace}
          </AppText>
          {abierto ? (
            <ChevronUp size={20} color={colors.ink} />
          ) : (
            <ChevronDown size={20} color={colors.ink} />
          )}
        </Pressable>
      </View>

      {abierto ? (
        <View className="gap-3">
          <View accessibilityRole="radiogroup" accessibilityLabel={t.enlace} className="gap-1">
            {CAUSAS.map((c) => (
              <OpcionCausa
                key={c}
                label={t.causas[c]}
                elegida={causa === c}
                onPress={() => elegir(c)}
              />
            ))}
          </View>

          {sugerencia && resultado === null ? (
            <View className="gap-3">
              <AppText>{t.sugerencias[sugerencia.tipo]}</AppText>
              {etiquetaAccion ? (
                <Button
                  variant="secondary"
                  label={etiquetaAccion}
                  loading={aplicando}
                  disabled={ocupado}
                  onPress={accion}
                />
              ) : null}
            </View>
          ) : null}

          {resultado ? (
            <Alert variant={resultado.error ? 'error' : 'exito'} message={resultado.texto} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type OpcionCausaProps = { label: string; elegida: boolean; onPress: () => void };

/** Fila de radio de 48 dp: círculo con marca al elegirla y texto en negrita (no solo color). */
function OpcionCausa({ label, elegida, onPress }: OpcionCausaProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: elegida, selected: elegida }}
      onPress={onPress}
      className={`min-h-12 flex-row items-center gap-3 rounded-field px-3 ${
        elegida ? 'bg-accent-claro' : 'active:bg-accent-claro'
      }`}
    >
      <View
        className={`h-6 w-6 items-center justify-center rounded-chip border-2 ${
          elegida ? 'border-accent bg-accent' : 'border-borde'
        }`}
      >
        {elegida ? <Check size={16} color={colors.blanco} strokeWidth={3} /> : null}
      </View>
      <AppText weight={elegida ? 'semibold' : 'regular'} className="flex-1">
        {label}
      </AppText>
    </Pressable>
  );
}
