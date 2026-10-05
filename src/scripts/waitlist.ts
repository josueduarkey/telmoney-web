// Lista de espera de la beta. Envía JSON a PUBLIC_WAITLIST_URL.
// Sin endpoint configurado (desarrollo), simula el éxito y lo deja en la consola.

type Payload = {
  name: string;
  whatsapp: string; // E.164: +50370000000
  email: string | null;
  pains: string[]; // respuestas de «¿qué es lo que más te cuesta?» (opción múltiple)
  source: 'landing';
  utm: Record<string, string>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class SubmitError extends Error {
  constructor(
    readonly status: number,
    readonly fields: string[],
  ) {
    super(`HTTP ${status}`);
  }
}

/** 8 dígitos = número salvadoreño (+503). Con «+» o 00 al inicio = otro país. */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (/^(\+|00)/.test(trimmed)) {
    const intl = trimmed.startsWith('00') ? digits.slice(2) : digits;
    return intl.length >= 8 && intl.length <= 15 ? `+${intl}` : null;
  }
  if (digits.length === 8 && /^[267]/.test(digits)) return `+503${digits}`;
  if (digits.length === 11 && digits.startsWith('503')) return `+${digits}`;
  return null;
}

export function initWaitlist(form: HTMLFormElement) {
  const endpoint = form.dataset.endpoint ?? '';
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const done = document.querySelector<HTMLElement>('[data-done]');

  const setError = (name: string, msg: string) => {
    const input = form.elements.namedItem(name);
    const err = form.querySelector<HTMLElement>(`[data-err-for="${name}"]`);
    if (!err || !(input instanceof HTMLInputElement)) return;
    err.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) {
      err.id = `wl-err-${name}`;
      input.setAttribute('aria-errormessage', err.id);
    }
  };

  form.querySelectorAll('input').forEach((i) => i.addEventListener('input', () => setError(i.name, '')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const data = new FormData(form);
    if (data.get('company')) return; // bot

    const name = String(data.get('name') ?? '').trim();
    const phone = normalizePhone(String(data.get('whatsapp') ?? ''));
    const email = String(data.get('email') ?? '').trim();

    let firstInvalid: string | null = null;
    const check = (field: string, msg: string | false) => {
      setError(field, msg || '');
      if (msg && !firstInvalid) firstInvalid = field;
    };
    check('name', !name && 'Escribe tu nombre.');
    check('whatsapp', !phone && 'Revisa el número: son 8 dígitos, o con su código si es de otro país.');
    check('email', !!email && !EMAIL.test(email) && 'Ese correo no parece completo. Puedes dejarlo vacío.');
    if (firstInvalid) {
      (form.elements.namedItem(firstInvalid) as HTMLInputElement).focus();
      return;
    }

    const params = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    params.forEach((v, k) => k.startsWith('utm_') && (utm[k] = v));

    const payload: Payload = {
      name,
      whatsapp: phone!,
      email: email || null,
      pains: data.getAll('pains').map(String),
      source: 'landing',
      utm,
    };

    submit.disabled = true;
    submit.textContent = 'Enviando…';
    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        // 201 = registro nuevo, 200 = ya estaba (se actualiza): las dos son éxito
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new SubmitError(res.status, Array.isArray(body?.fields) ? body.fields : []);
        }
      } else {
        console.info('[waitlist] PUBLIC_WAITLIST_URL vacío: modo demo, no se envió nada.', payload);
        await new Promise((r) => setTimeout(r, 600));
      }
      form.hidden = true;
      if (done) {
        done.hidden = false;
        done.focus();
      }
    } catch (err) {
      submit.disabled = false;
      submit.textContent = 'Unirme a la beta';
      if (err instanceof SubmitError && err.status === 422 && err.fields.length) {
        // el servidor dice qué campos no le gustaron: los marcamos igual que la validación local
        const msgs: Record<string, string> = {
          name: 'Revisa tu nombre.',
          whatsapp: 'Revisa el número: son 8 dígitos, o con su código si es de otro país.',
          email: 'Ese correo no parece completo. Puedes dejarlo vacío.',
        };
        err.fields.forEach((f) => msgs[f] && setError(f, msgs[f]));
        (form.elements.namedItem(err.fields.find((f) => msgs[f]) ?? 'name') as HTMLInputElement)?.focus();
        return;
      }
      status.textContent =
        err instanceof SubmitError && err.status === 429
          ? 'Ya recibimos varios intentos desde aquí. Espera un minuto y vuelve a probar.'
          : 'No pudimos guardar tus datos. Revisa tu conexión e inténtalo otra vez.';
    }
  });
}
