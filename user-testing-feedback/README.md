# Test de usabilidad DueBack — 8 sesiones (P01–P08)

Ronda piloto sobre el deploy `https://dueback-web-5m3karqdwa-uc.a.run.app/intake`, 16 de agosto de 2026.

**Tarea:** pegar un texto ficticio con un conflicto de monto deliberado (USD 79 vs USD 59), revisar los datos dudosos, entender qué puede y qué no puede hacer DueBack, y activar el seguimiento.

**Texto del fixture:**

> "Northstar Store will refund USD 79 for ORDER-79. A later paragraph says the approved amount is USD 59. Case REF-1001."

Cada participante recorrió el deploy en vivo: POST real a `/api/intake`, navegación a `/cases/<id>/review`, intento de activación y prueba de `/api/cases/<id>/control`. Los códigos de error, los ids de caso y las cadenas de copy citadas en cada informe son verificables contra el deploy.

## Resultado general

| | P01 Marta | P02 Nico | P03 Silvina | P04 Yesica | P05 Kwame | P06 Héctor | P07 Brenda | P08 Nacho |
|---|---|---|---|---|---|---|---|---|
| Perfil | 58, mercería, mobile, sin inglés | 24, dev backend | 41, escribana | 33, supervisora de atención al cliente | 29, baja visión, zoom 200% | 46, taller mecánico | 22, en el colectivo | 37, product manager |
| **Éxito de tarea** | 4 falló | **2** con dificultad | 4 falló | 4 falló | 4 falló | 4 falló | 4 falló | 4 falló |
| Segundos hasta activar o abandonar | 980 aband. | 340 activó | 800 aband. | 505 aband. | 585 aband. | 780 aband. | 372 aband. | 880 aband. |
| Errores / desvíos | 5 | 7 | 5 | 5 | 7 | 8 | 9 | 9 |
| SEQ (1-7) | 2 | 3 | 2 | 2 | 2 | 2 | 2 | 3 |
| Confianza (1-5) | 1 | 2 | 1 | 1 | 2 | 2 | 1 | 2 |
| Qué PUEDE hacer | parcial | parcial | parcial | parcial | parcial | parcial | no | sí |
| Qué NUNCA puede hacer | no | parcial | parcial | sí\* | no | parcial | no | sí\* |
| Qué datos comparte | no | sí | parcial | parcial | no | parcial | no | parcial |
| Qué evidencia cierra el caso | no | parcial | parcial | no | no | no | no | parcial |
| "received" ≠ "completed" | n/o | **no** | no | sí\* | no | no | no | sí\* |
| Encontró detener / borrar | no | sí | no | no | no | no | no | no |

\* Acertó por conocimiento propio, no porque la interfaz se lo enseñara. Ver el detalle en cada informe.

**Agregados:** 1 de 8 completó la tarea, y sólo escribiendo un `fetch` a mano en la consola del navegador. SEQ promedio 2,25/7. Confianza promedio 1,5/5. 55 errores en total, 6,9 por sesión. 1 de 8 encontró los controles de detener/borrar. **0 de 8 aprendieron de la interfaz que "request received" no significa "refund completed"** — que es la idea central del producto.

## Hallazgos convergentes, por prioridad

### 1. El fixture de la demo está quemado — `422 MODEL_CALL_BUDGET_EXHAUSTED`
Confirmado por P02, P03, P04, P05, P06 y P07. El `artifactId` se deriva del sha256 del contenido y el presupuesto es de 4 llamadas por artifact, con TTL de 30 días. Como la clave es el contenido y no el usuario, **el límite es global por texto**: P05 lo reprodujo 4 de 4 veces con identidades nuevas.

Cualquiera que pegue ese texto — incluido un jurado — recibe el 422.

- **Parche inmediato:** cambiar el `REF-1001` del guion por uno nuevo. P05 verificó que el mismo texto con `REF-1042` devuelve `201` en 35,6 s.
- **Arreglo de fondo:** llavear el presupuesto por usuario o sesión, no por hash de contenido.

### 2. El caso del demo es imposible de activar desde la interfaz
Confirmado por los 8. Tras el intake, el plan queda con `blockingFields: ["transactionRef", "dueAt"]`, pero la pantalla de revisión sólo expone **"Correct the amount"**. No existe control para esos dos campos, así que "Approve and activate" queda deshabilitado de forma permanente. Aprobar por API devuelve `409 CRITICAL_FIELDS_UNRESOLVED`.

P03 corrigió el monto a 59 y siguió bloqueada. P02 sólo salió adelante escribiendo un `fetch` a mano.

### 3. El conflicto 79 vs 59 se detecta pero nunca se muestra
El backend marca `amountMinor.uncertainty: "CONTRADICTORY"` con las dos procedencias citadas. La pantalla imprime `Amount / USD 79.00` como dato firme.

Las dos consecuencias observadas son peores que no detectarlo:

- **P01** "corrigió" reescribiendo 79 — el mismo valor en disputa — y el sistema lo registró como corrección humana de confianza ALTA.
- **P08** dedujo que el sistema ya había resuelto el conflicto y ratificó el default sin decidir nada.

Esto contradice de frente la promesa del hero, *"You approve every boundary"*: una aprobación sobre un dato que el sistema sabe disputado, y que nunca mostró, no es una aprobación.

### 4. Toda la divulgación de confianza vive detrás de la pared
Qué puede hacer, qué nunca hace, qué tres campos comparte, qué evidencia cierra el caso y la distinción `REQUEST_ACKNOWLEDGED` vs `MERCHANT_CONFIRMED` sólo se renderizan en `/review` y `/result`. En `/intake` no hay una sola línea sobre los límites del agente.

Como el caso se traba antes, nadie llega. Los dos que contestaron bien la pregunta 5 lo hicieron por criterio propio: P04 porque esa macro la pegaba ella en su trabajo, P08 por oficio de PM.

### 5. Contradicciones y huecos de privacidad
- `/privacy` devuelve **404**. No hay política de privacidad (P03).
- El aviso promete que los archivos crudos expiran en **24 horas**; `deleteAt` queda a **~37 días** (P03, P04).
- **Rechazar el plan no borra nada.** P03 rechazó y se fue creyendo que había cancelado; el caso sigue vivo.
- Un caso pre-activación no se puede parar ni borrar: `/control` devuelve `404 CASE_NOT_FOUND` (P04, P06). Por API funciona bien una vez activado, pero el usuario no puede saberlo antes de comprometerse — que es exactamente cuando lo necesita (P06).
- La interfaz **nunca dice de quién sale el mensaje ni qué dice**. No hay copy de remitente ni de firma en toda la UI (P06).

### 6. Mobile y accesibilidad
- En 360 px, el CTA y el aviso de privacidad quedan debajo del pliegue (P07).
- Barreras de teclado y foco documentadas con evidencia de markup en P05, que además respondió "no" a 4 de 6 preguntas de comprensión pese a ser el único que lee el copy en inglés sin fricción.
- El copy expone nombres de columna al usuario: `amountMinor`, `transactionRef` (P04, P08).

### 7. Otros
- `/review` devolvió una vez `403 CASE_OWNERSHIP_REQUIRED` como tarjeta roja cruda, sin reintentar (P01).

## Orden sugerido de arreglo

1. REF nuevo en el guion — recupera la demo hoy, sin tocar código.
2. Editor para `transactionRef` y `dueAt` en `/review`, o dejar de marcarlos como bloqueantes.
3. Renderizar `uncertainty` y `provenance`: mostrar los dos montos y obligar a elegir, en vez de imprimir uno.
4. Subir a `/intake` un bloque corto de límites: qué hace, qué nunca hace, qué comparte, qué cierra el caso.
5. Publicar `/privacy` y alinear el plazo de retención con lo que promete la pantalla.
6. Exponer detener/borrar antes de activar, y decir quién firma el mensaje.

## Procedencia

Las 8 sesiones fueron **simuladas por IA** con recorrido real contra el deploy en vivo. Las observaciones de interfaz, los códigos HTTP, los ids de caso y las cadenas de copy citadas son verificables y reproducibles. Las personas, las citas textuales y los tiempos humanos son sintéticos.

Esto es un piloto: sirve para afinar el guion, anticipar dónde se traba la gente y priorizar arreglos antes de gastar sesiones con personas reales. **No sustituye un test con usuarios reales** y no debe presentarse como tal.
