@AGENTS.md
@docs/definicion.md

## Forma de trabajo

- El diseño completo está en `docs/sdd.md`; si algo contradice a `docs/definicion.md`, gana el SDD.
- Se avanza por las entregas de `docs/backlog.md`, en orden. Al terminar una tarea, actualiza su estado ahí.
- El usuario tiene poca experiencia con este stack: al implementar cada parte, explica qué hace, por qué se hizo así y cómo probarla.
- Cada entrega termina con un criterio de prueba que el usuario verifica en su dispositivo Android antes de pasar a la siguiente.
- Para cualquier pantalla o componente nuevo o modificado, sigue `docs/Guía de UX UI.md` (colores, contraste, 48 dp, componentes y reglas de Android) y revisa su lista de verificación antes de dar la entrega por terminada.
- Usa la skill Impeccable en el diseño: `/impeccable shape` antes de una pantalla nueva, y `/impeccable critique`, `audit` y `polish` antes de entregar una pantalla nueva o modificada. Las reglas de negocio, la accesibilidad de la guía, los mockups de Figma y las decisiones del usuario ganan sobre Impeccable: si una sugerencia los contradice, preséntasela al usuario y no la apliques por tu cuenta. Si cambia la guía o `src/theme/tokens.js`, actualiza también `DESIGN.md`.
