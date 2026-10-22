// Idiomas del sitio: español (/, el principal) e inglés (/en/). Lo configura astro.config.mjs (i18n).
// Cada componente sabe en qué idioma está con `langOf(Astro.currentLocale)` y tiene sus textos al lado
// (`const t = { es: {...}, en: {...} }[lang]`). Lo que no es la página de inicio (cuenta, panel, legales)
// sigue solo en español.
//
// El bot habla español: la página en inglés lo dice claro (no promete un bot en inglés).
export type Lang = 'es' | 'en';
export const LANGS: Lang[] = ['es', 'en'];

export const langOf = (locale: string | undefined): Lang => (locale === 'en' ? 'en' : 'es');

/** La página de inicio de cada idioma. */
export const homeOf = (lang: Lang) => (lang === 'en' ? '/en/' : '/');

/** Etiquetas del selector de idioma. */
export const LANG_LABEL: Record<Lang, { short: string; name: string }> = {
  es: { short: 'ES', name: 'Español' },
  en: { short: 'EN', name: 'English' },
};
