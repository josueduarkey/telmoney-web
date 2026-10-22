// Datos estructurados (JSON-LD, schema.org) para que Google entienda qué es TelMoney:
// la empresa, el sitio, la página, la app con sus precios y las preguntas frecuentes.
// Todo sale de la misma fuente que la página (config.ts, data/faqs.ts): nada se inventa.
// Importante: no se incluyen calificaciones ni reseñas (aggregateRating) porque todavía no existen.
import { LAUNCHED, PLANS, SITE } from '../config';
import { faqsFor } from '../data/faqs';
import { absolute, seoFor } from './meta';

const id = (fragment: string) => `${SITE.url}/#${fragment}`;

/** Un plan mensual expresado como oferta con cobro recurrente. */
const plan = (name: string, price: number, description: string) => ({
  '@type': 'Offer',
  name,
  description,
  price: price.toFixed(2),
  priceCurrency: 'USD',
  // Antes del lanzamiento la app se puede reservar (lista de espera); después, está disponible.
  availability: LAUNCHED ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
  url: absolute('/#planes'),
  priceSpecification: {
    '@type': 'UnitPriceSpecification',
    price: price.toFixed(2),
    priceCurrency: 'USD',
    billingDuration: 1,
    unitCode: 'MON',
  },
});

/** En el inicio va todo; en las demás páginas (legales) solo la empresa, el sitio y la página. */
export function pageSchema(
  path = '/',
  { title, description, lang = 'es' }: { title?: string; description?: string; lang?: 'es' | 'en' } = {},
) {
  const SEO = seoFor(lang);
  title ??= SEO.title;
  description ??= SEO.description;
  const en = lang === 'en';
  const faqs = faqsFor(lang);
  const url = absolute(path);
  const home = path === '/' || path === '/en/' || path === '/en';
  const graph: Record<string, unknown>[] = [
      {
        '@type': 'Organization',
        '@id': id('organization'),
        name: SITE.name,
        url: SITE.url + '/',
        logo: { '@type': 'ImageObject', url: absolute('/favicon-512.png'), width: 512, height: 512 },
        email: SITE.email,
        sameAs: [SITE.instagram, SITE.tiktok],
        contactPoint: {
          '@type': 'ContactPoint',
          email: SITE.email,
          contactType: 'customer support',
          availableLanguage: ['Spanish'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': id('website'),
        url: SITE.url + '/',
        name: SITE.name,
        description: SEO.description,
        inLanguage: SEO.lang,
        publisher: { '@id': id('organization') },
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: SEO.lang,
        isPartOf: { '@id': id('website') },
        ...(home ? { about: { '@id': id('app') } } : {}),
        primaryImageOfPage: { '@type': 'ImageObject', url: absolute(SEO.image.path), width: SEO.image.width, height: SEO.image.height },
      },
  ];
  if (home) {
    graph.push(
      {
        '@type': 'SoftwareApplication',
        '@id': id('app'),
        name: SITE.name,
        description: SEO.description,
        url: SITE.url + '/',
        image: absolute(SEO.image.path),
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'WhatsApp (Android, iOS, Web)',
        inLanguage: SEO.lang,
        publisher: { '@id': id('organization') },
        featureList: en
          ? [
              'Log expenses by text, voice note or receipt photo',
              'How much you can spend today until your next payday',
              'Reminders before every bill and card payment',
              'Friendly reminders to collect what you are owed',
              'Daily summary with a financial health score',
              'Savings goals and spending limits',
              'Export to Excel, PDF and CSV',
            ]
          : [
              'Anotar gastos por texto, audio o foto del recibo',
              'Cuánto puedes gastar hoy hasta tu próximo pago',
              'Avisos antes de cada pago fijo y de la tarjeta',
              'Recordatorios amables para cobrar lo que te deben',
              'Resumen diario con puntaje de salud financiera',
              'Metas de ahorro y límites de gasto',
              'Exportación a Excel, PDF y CSV',
            ],
        offers: en
          ? [
              plan(PLANS.gratis.name, PLANS.gratis.monthly, 'Log the basics and know how much you can spend today, free.'),
              plan(PLANS.starter.name, PLANS.starter.monthly, 'Log everything, with a nightly report.'),
              plan(PLANS.pro.name, PLANS.pro.monthly, 'Everything above plus bill reminders, collections and AI insights.'),
            ]
          : [
              plan(PLANS.gratis.name, PLANS.gratis.monthly, 'Anota lo básico y sabe cuánto puedes gastar hoy, gratis.'),
              plan(PLANS.starter.name, PLANS.starter.monthly, 'Anota todo, con reporte de cada noche.'),
              plan(PLANS.pro.name, PLANS.pro.monthly, 'Todo lo anterior más avisos de pagos, cobros y análisis con IA.'),
            ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    );
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
