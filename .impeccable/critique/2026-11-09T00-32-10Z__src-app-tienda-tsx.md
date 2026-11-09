---
target: Tienda
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:C:\\Users\\santi\\OneDrive\\Escritorio\\AppMovil\\HabitGreen\\src\\app\\tienda.tsx"
target_fingerprint: "sha256:86da6632967cdc1002bbd55c8e8eded2a0b5975721778f14d4be5779b4f52b0f"
target_path: "C:\\Users\\santi\\OneDrive\\Escritorio\\AppMovil\\HabitGreen\\src\\app\\tienda.tsx"
timestamp: 2026-11-09T00-32-10Z
slug: src-app-tienda-tsx
---
Method: design review only (detector not applicable, native platform)

Revisión de código y captura del usuario (teléfono físico, letra normal, saldo 0).

| # | Heurística | Puntos | Nota |
|---|---|---|---|
| 1 | Estado del sistema | 4 | Saldo fijo y estado por tarjeta |
| 2 | Mundo real | 4 | Lenguaje cercano |
| 3 | Control y libertad | 3 | Hoja con «Ahora no» |
| 4 | Consistencia | 3 | Encabezado fijo como Jardín |
| 5 | Prevención de errores | 3 | Sin saldo no hay botón de compra |
| 6 | Reconocer, no recordar | 4 | Imagen, nombre y precio visibles |
| 7 | Flexibilidad | 2 | Sin filtros, innecesarios con 15 objetos |
| 8 | Minimalismo | 2 | Con saldo 0, «Te faltan N» repite el precio en cada tarjeta |
| 9 | Recuperación de errores | 3 | Sin conexión avisa y no cobra |
| 10 | Ayuda | 2 | Sin ayuda contextual |
| Total | | 30/40 | Bueno |

## Sin abrir

- P3: con saldo 0, «Te faltan N monedas» repite el precio en todas las tarjetas. Sigue el mockup «Tienda #1»; decisión del usuario.
