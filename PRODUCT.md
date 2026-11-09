# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Personas de 22 a 45 años que quieren crear hábitos, incluidas quienes batallan para empezar o sostenerlos. Muchas llegan después de haber dejado otros intentos, así que el desánimo es parte real de su situación.

Usan la app sobre todo en momentos cortos: la abren unos segundos varias veces al día para marcar sus hábitos, y hacen visitas más largas y tranquilas al jardín o a la tienda.

## Product Purpose

Habit Green ayuda a crear hábitos que duran, en 5 áreas: Salud Física, Trabajo / Estudio, Salud Mental, Finanzas y Social. Tiene dos modos: **guiado**, con un formulario de 7 preguntas que genera un plan de poca carga y se adapta con el tiempo, y **tradicional**, donde la persona crea y gestiona sus propios hábitos.

El éxito es que la persona siga volviendo: sostener hábitos reales, no acumular puntos ni rachas perfectas.

## Positioning

Combina dos ideas: un plan que empieza con pasos muy pequeños y se adapta sin culpa, y un jardín que crece como recompensa visible de la constancia. Cada área tiene su propia planta, que pasa por 3 fases, y las monedas compran accesorios para decorarla.

## Operating Context

- Uso con una mano, en un teléfono Android, varias veces al día y a menudo sin conexión.
- Ver y marcar hábitos, deshacer y equipar accesorios funcionan sin conexión. Comprar en la tienda y crear el plan la necesitan.
- La pantalla Hoy es el punto de entrada diario.

## Capabilities and Constraints

- **Pantallas:** Hoy, Hábitos, Progreso (estadísticas), Jardín y Perfil en la barra inferior; además, crear y editar hábito, Tienda y Detalles de la planta.
- **Stack:** Expo con React Native, Expo Router, NativeWind y SQLite con sincronización a Supabase.
- **Fuentes de verdad:** las reglas de negocio están en `docs/sdd.md` y `docs/definicion.md`. Las reglas visuales y de accesibilidad están en `docs/Guía de UX UI.md`.
- **Nunca se muestran** XP, niveles ni fases numéricas. Nunca se resta nada por fallar.
- **Fuera de la demo:** iOS, modo oscuro, tabletas, funciones sociales, pagos e insignias.

## Brand Commitments

- **Identidad fija:** dirección «Jardín alegre» elegida por el usuario (fondo casi blanco, un verde principal, tintes por área y dorado para monedas), con referencias de acabado en Finch y en Todoist o TickTick, sin copiar ninguna app. Tipografía Lexend Deca y solo tema claro. Material You, el modo oscuro y Roboto no se aplican.
- **Tema de Android:** Material guía la estructura, la navegación y el comportamiento; la identidad visual es la de esta marca.
- **Mockups de Figma:** mandan en el acomodo, salvo cuando rompen una regla de accesibilidad de la guía; entonces se aplica el ajuste mínimo y se anota. Sus colores ya no aplican a la app. Las pantallas de Figma solo se leen, nunca se modifican.
- **Voz:** español, de tú, cercana y sin culpa («La dejamos para la próxima»). No regaña.

## Evidence on Hand

- **Provisional:** el arte de plantas y accesorios es genérico, y los nombres de los 15 accesorios están por definirse.
- **No existen:** testimonios, usuarios reales, métricas ni resultados. No se deben inventar.

## Product Principles

1. **Empezar es lo más difícil.** Cada pantalla pide lo mínimo y hace fácil el siguiente paso.
2. **Sin culpa.** Fallar nunca castiga; la app ofrece otra oportunidad con un tono amable.
3. **El progreso se ve, no se mide.** La recompensa es la planta que crece, no los números.
4. **Marcar un hábito toma segundos.** La acción diaria va primero y responde al instante, con o sin conexión.
5. **Una acción principal por pantalla.**

## Accessibility & Inclusion

- WCAG 2.1 AA: texto de 4.5:1 y elementos no textuales de 3:1.
- Zonas táctiles de 48 dp como mínimo, letra del sistema hasta 2× y soporte de TalkBack.
- Ningún estado se comunica solo con color, y se respeta «reducir movimiento».
