# Planes: Cora, Pisto y Billete

*16 de octubre de 2026. Decisión de Josué: agregar un plan gratis con límites; los de pago no cambian de precio. Se revisa según la cantidad de usuarios.*

| Plan (clave interna) | Precio | Para quién |
|---|---|---|
| **Cora** (`gratis`) | $0 | Empezar a ordenarse sin pagar |
| **Pisto** (`starter`) | $4.99/mes · $49.90/año | Anotar todo, con reporte de cada noche |
| **Billete** (`pro`) | $9.99/mes · $99.90/año | Avisos de pagos, cobros, puntaje, Excel/PDF |

El anual sigue siendo 10 meses (2 gratis). Al escribir por primera vez: 7 días con todo, gratis. Después, quien no paga pasa a Cora (ya no queda en silencio).

Los nombres viven en `src/config.ts` (`PLANS`). Las claves `gratis`, `starter` y `pro` son las del bot y de los pagos: no cambian.

## Límites de Cora

| | Cora | Pisto | Billete |
|---|---|---|---|
| Interacciones al día | **10** | 30 | sin tope (techo anti-abuso) |
| Preguntas libres al día | **2** | 5 | sin límite |
| Anotar por texto, foto y audio | ✅ | ✅ | ✅ |
| Cuánto puedes gastar hoy | ✅ | ✅ | ✅ |
| Cuentas, metas y deudas | ✅ | ✅ | ✅ |
| Resumen | semanal (domingo) | cada noche | cada noche + puntaje |
| Límites de gasto | — | ✅ | ✅ |
| Gastos fijos con aviso, cobros, Excel/PDF/gráficas | — | — | ✅ |
| Exportar CSV | ✅ | ✅ | ✅ |

## Por qué 10 al día

Costos que usa el bot (`telmoney-bot/docs/precios-y-pagos.md`): cada respuesta por WhatsApp ~$0.0113 (Meta, El Salvador) y cada llamada a Gemini ~$0.001. Una interacción con respuesta escrita: **~$0.0123**. Si se confirma con reacción ✅ y Meta no la cobra: **~$0.001**. Las fotos y audios gastan algo más de Gemini (sin medir todavía).

| Usuario de Cora | Si las reacciones no se cobran | Si se cobran |
|---|---|---|
| Típico: 3 anotaciones + 1 pregunta al día, resumen semanal | ~$0.51 al mes | ~$1.52 al mes |
| Al tope: 8 anotaciones + 2 preguntas todos los días | ~$1.03 al mes | ~$3.74 al mes |

Los primeros 1,000 mensajes al mes por número son gratis en Meta: con pocos usuarios, Cora casi no cuesta.

Un usuario de Cora es una apuesta: cuesta entre $0.50 y $1.50 al mes y se paga si 1 de cada 5 a 10 pasa a Pisto. **Lo que hay que medir:** cuántos de Cora pasan a un plan de pago y cuánto cuesta de verdad cada uno (el comando **mensajes** del bot dice si Meta cobra las reacciones).

**Ojo con Billete:** sin tope diario, alguien de 20 interacciones al día cuesta ~$7.70 al mes (más que en Pisto) y uno de 30 al día, más que los $9.99. Conviene un uso justo de ~50 al día.

## Lo que falta en el bot

1. Al terminar la prueba o vencer un plan pagado, pasar a Cora en vez de quedar en silencio.
2. Los límites de Cora de la tabla, configurables en `.env`.
3. Usar los nombres Cora, Pisto y Billete en los mensajes.
4. `/me`: si es gratis, `plan.nivel = "gratis"`. La web solo pone botón de pago a los planes con monto mayor que 0.
5. Opcional: uso justo de Billete (~50 al día).
