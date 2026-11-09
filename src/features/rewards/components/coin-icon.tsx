import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme';

// Moneda rellena: la recompensa se distingue de los iconos de línea de la interfaz. Es decorativa;
// quien la usa dice la cantidad al lector de pantalla.

export function CoinIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" accessibilityElementsHidden>
      <Circle cx={10} cy={10} r={9} fill={colors.moneda} />
      <Circle cx={10} cy={10} r={6.2} fill={colors['moneda-claro']} />
      <Path
        d="M10 6.2v7.6"
        stroke={colors['moneda-texto']}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
