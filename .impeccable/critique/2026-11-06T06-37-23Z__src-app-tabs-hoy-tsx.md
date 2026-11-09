---
target: Hoy
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\santi\\OneDrive\\Escritorio\\AppMovil\\HabitGreen\\src\\app\\(tabs)\\hoy.tsx"
target_fingerprint: "sha256:7b3ba803f3da3a514ee1aa9c2b1b9ebb5c8ad493758de80977ea35ffeb18c64f"
target_path: "C:\\Users\\santi\\OneDrive\\Escritorio\\AppMovil\\HabitGreen\\src\\app\\(tabs)\\hoy.tsx"
timestamp: 2026-11-06T06-37-23Z
slug: src-app-tabs-hoy-tsx
---
Method: design review only (detector not applicable, native platform). Revisión del código, sin ver la pantalla.

## Design Health Score: 26/40, Aceptable

Estado visible 3, Lenguaje real 2, Control 3, Consistencia 3, Prevención de errores 2, Reconocer 3, Eficiencia 3, Minimalista 2, Recuperación 3, Ayuda 2.

## Priority Issues

1. [P1] Un aviso mueve las tarjetas mientras marcas. Solución: aviso flotante temporal que no empuje nada. Comando: /impeccable harden.
2. [P1] Hoy muestra un círculo verde llamado «Tu planta» (assets/illustrations/hoy.png). Solución: mostrar una planta real en su fase actual. Comando: /impeccable delight.
3. [P2] Con todo hecho sigue diciendo «Pendientes de hoy». Solución: cambiarlo por algo como «¡Todo listo por hoy!». Comando: /impeccable delight.
4. [P2] La parte fija ocupa unos 330 dp (cálculo). Solución: imagen más chica en pantallas bajas, conservando lo fijo. Comando: /impeccable layout.
5. [P2] «Tu árbol crece con cada micro-paso»: la app habla de plantas y viene del mockup; lo decide el usuario. Comando: /impeccable clarify.

## Minor Observations

- Los hábitos hechos no bajan: quedan mezclados con los pendientes.
