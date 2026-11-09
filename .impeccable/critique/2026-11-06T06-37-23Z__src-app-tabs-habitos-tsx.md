---
target: Hábitos
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\santi\\OneDrive\\Escritorio\\AppMovil\\HabitGreen\\src\\app\\(tabs)\\habitos.tsx"
target_fingerprint: "sha256:9fdbed1d219b5d02d0975c19b67cfe9bf7708f246d262dc981ba1d650540446c"
target_path: "C:\\Users\\santi\\OneDrive\\Escritorio\\AppMovil\\HabitGreen\\src\\app\\(tabs)\\habitos.tsx"
timestamp: 2026-11-06T06-37-23Z
slug: src-app-tabs-habitos-tsx
---
Method: design review only (detector not applicable, native platform). Revisión del código, sin ver la pantalla.

## Design Health Score: 26/40, Aceptable

Estado visible 3, Lenguaje real 3, Control 3, Consistencia 2, Prevención de errores 2, Reconocer 3, Eficiencia 2, Minimalista 3, Recuperación 3, Ayuda 2.

## Priority Issues

1. [P1] Un aviso mueve las tarjetas mientras marcas. Solución: aviso flotante temporal que no empuje nada. Comando: /impeccable harden.
2. [P2] «+» se va al desplazar. Solución: fijar el encabezado como en Hoy. Comando: /impeccable layout.
3. [P2] Con lector de pantalla, la tarjeta anuncia solo el título; falta comprobar con TalkBack la casilla y el ⋮. Comando: /impeccable harden.
4. [P2] El menú ⋮ mide 168 dp fijos: con letra al 200 % «Reanudar» podría partirse. Comando: /impeccable harden.

## Minor Observations

- El estado vacío solo tiene texto, mientras Hoy ofrece un botón claro.
