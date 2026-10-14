# Plan de funciones: que Pro se pague solo

*Octubre 2026. Decisión de Josué: empezar por la fase 1. En la beta solo hay planes individuales (Starter y Pro): el plan Familia queda fuera.*

## La idea

La gente no paga por funciones («avisos de pagos fijos»), paga por resultados: no pagar mora, llegar a fin de mes, no tener que pensar en eso. Cada fase agrega algo que **ahorra o resuelve un problema concreto**, y el bot lo **muestra en dólares** para que pagar Pro sea obvio.

**Regla para la página:** solo se anuncia lo que el bot ya hace. Cada función nueva entra a la web cuando el bot la tenga en producción, no antes.

## Fase 0: la página habla de resultados (hecha)

- **Web:** las tarjetas de funciones y la lista de Pro dicen lo que la persona gana («Adiós a la mora», «Recupera lo que te deben»). Solo con lo que el bot ya hace hoy.
- **Bot:** nada.

## Fase 1: Pro se paga solo

| Función | Para quién | Plan | Qué resuelve |
|---|---|---|---|
| **«Este mes te ahorré $X»** | Todos | Pro (en la prueba también, para que lo vean) | Al cierre de cada mes, un mensaje con lo que TelMoney le ahorró: recargos evitados, suscripciones encontradas, gasto hormiga reducido. Es la razón para renovar. |
| **Tarjeta de crédito sin sorpresas** | Todos | Pro | Fecha de corte y de pago, aviso antes de pagar, y cuánto cuesta pagar solo el mínimo («si pagas $25 en vez de $300, pagas ~$X de intereses»). |
| **Detector de suscripciones y gastos hormiga** | Jóvenes sobre todo | Pro | «Pagas 3 servicios de streaming», «Netflix te cobró dos veces», «$47 este mes en cafés, $15 más que el anterior». |

**Bot:**
- Tarjeta: en las cuentas de tipo tarjeta, día de corte, día de pago, límite, y una tasa de interés (opcional, con un valor típico por defecto). El aviso usa la plantilla de recordatorio que ya existe.
- Suscripciones: detectar cargos que se repiten cada mes (mismo comercio y monto parecido) y cargos duplicados en pocos días. El usuario confirma o descarta cada uno, y el bot aprende.
- Gastos hormiga: categorías con muchos gastos chicos y su comparación con el mes anterior.
- «Te ahorré»: una tabla de ahorros con tipo (`mora_evitada`, `suscripcion_cancelada`, `hormiga_reducida`…), monto estimado y mes, que se llena cuando pasa cada cosa. El mensaje del día 1 la resume. Montos **conservadores**: es mejor quedarse corto que inflar el número.
- Registro de uso por función (qué función, quién, cuándo), para saber cuáles hacen que la gente pague.

**Web (cuando el bot lo tenga):**
- Tarjetas nuevas: «Nunca pagues intereses por descuido» y «Encuentra el dinero que se te escapa».
- Precios: el ahorro como argumento principal («Pro cuesta $9.99; en promedio te ahorra $X»), con el promedio real cuando haya datos.
- Panel: el ahorro mostrado a cada usuario, el uso por función y cuántos pasan de la prueba a Pro después de ver su primer «te ahorré».

## Fase 2: jóvenes

| Función | Plan | Qué resuelve |
|---|---|---|
| **La «vaca» (gastos compartidos)** | Starter: dividir · Pro: cobrar y dar seguimiento | «Pagué $60 de la cena, éramos 4» → cuánto debe cada uno y el cobro listo para cada amigo. Usa los cobros que ya existen. |
| **Rachas y retos** | Starter | Días seguidos anotando, reto de 52 semanas, logros. Usa el puntaje diario que ya existe. |
| **Primer sueldo** | Starter | Al detectar el primer ingreso grande: cuánto apartar, cuánto gastar y cuánto ahorrar, con fecha. |

- **Bot:** grupos de división (participantes, monto por persona, pagado o pendiente), rachas en la foto diaria y catálogo de retos.
- **Web:** sección o tarjetas para jóvenes, y una conversación de ejemplo con la «vaca» en el teléfono de la página.

## Fase 3: personas mayores

| Función | Plan | Qué resuelve |
|---|---|---|
| **Respuestas por voz** | Starter | Quien prefiere audio recibe la respuesta en nota de voz. |
| **Alerta de estafas** | Todos | «Me pidieron depositar $200 para cobrar un premio» → «Eso suena a estafa, no lo hagas». |
| **Remesas** | Starter | Registrar lo que llega del extranjero y cuánto queda de lo que mandó la familia. |

- **Bot:** texto a voz, reglas y modelo para detectar estafas, y categoría y cuenta de remesas.
- **Web:** tarjetas o sección para personas mayores (todo por audio, alerta de estafas, remesas).

**Fuera de la beta:** el modo familiar (un hijo o hija ve, con permiso, el resumen y los avisos de sus papás) sería un plan Familia aparte. En la beta solo hay planes individuales; se retoma después.

## Fase 4: facturas y renta

| Función | Plan | Qué resuelve |
|---|---|---|
| **Factura electrónica (DTE)** | Pro | Con una foto del QR o el archivo de la factura electrónica, registra el gasto exacto con comercio, fecha y monto. |
| **Gastos deducibles para la renta** | Pro | Junta los gastos médicos y de colegiatura que la ley permite deducir, listos para la declaración (campaña en marzo y abril). |

- **Bot:** leer el QR o el JSON del DTE y consultarlo si hace falta, y marcar los gastos deducibles con sus comprobantes. **Confirmar con un contador** qué se puede deducir y los topes vigentes antes de anunciarlo.
- **Web:** campaña de temporada de renta.

## La app

Es un extra de Pro (gráficas, historial completo, búsqueda), no la razón para pagar. La promesa sigue siendo «no necesitas una app».

## Orden y cómo se mide

1. Fase 1 completa. Se mide la conversión de prueba a Pro antes y después.
2. Fase 2 o 3, según qué público responda mejor en la beta.
3. Fase 4, a tiempo para la temporada de renta.

En cada fase, el bot registra el uso por función y el panel lo muestra, para decidir con datos qué sigue.
