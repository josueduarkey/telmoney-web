// Opciones de «¿qué es lo que más te cuesta?» en el formulario de la beta.
// Las usan el formulario (Waitlist.astro) y quien lo guarda (pages/api/waitlist.ts); la base solo
// acepta estos textos, así que si cambia uno, el viejo se agrega a PAIN_ALIASES.
export const PAINS = [
  'Saber en qué se me va',
  'Llegar a fin de mes con dinero',
  'Acordarme de los pagos',
  'Cobrar lo que me deben',
  'Ahorrar',
] as const;

/** Textos viejos (una página abierta desde antes del cambio): se guardan con el texto nuevo. */
export const PAIN_ALIASES: Record<string, (typeof PAINS)[number]> = {
  'Llegar a fin de mes con pisto': 'Llegar a fin de mes con dinero',
};
