// Lista de espera de la beta. Envía JSON a /api/waitlist (o a PUBLIC_WAITLIST_URL si se define).

type Payload = {
  name: string;
  whatsapp: string; // E.164: +50370000000
  email: string | null;
  pains: string[]; // respuestas de "¿qué es lo que más te cuesta?" (opción múltiple)
  source: 'landing';
  utm: Record<string, string>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mensajes del formulario en el idioma de la página. */
const EN = typeof document !== 'undefined' && document.documentElement.lang === 'en';
const M = EN
  ? {
      sending: 'Sending…',
      name: 'Write your name.',
      nameBad: 'Check your name.',
      phone: 'Check the number: 8 digits, or with its country code if it is from another country.',
      email: "That email doesn't look complete. You can leave it empty.",
      slow: 'One moment, saving your details…',
      timeout: "It's taking longer than usual. Try again in a moment; if it went through, it won't be duplicated.",
      options: "We couldn't save your details. Uncheck the options and try again.",
      tooMany: 'We got several attempts from here. Wait a minute and try again.',
      failed: "We couldn't save your details. Check your connection and try again.",
    }
  : {
      sending: 'Enviando…',
      name: 'Escribe tu nombre.',
      nameBad: 'Revisa tu nombre.',
      phone: 'Revisa el número: son 8 dígitos, o con su código si es de otro país.',
      email: 'Ese correo no parece completo. Puedes dejarlo vacío.',
      slow: 'Un momento, estamos guardando tus datos…',
      timeout: 'Está tardando más de lo normal. Inténtalo otra vez en un momento; si ya quedó, no se duplica.',
      options: 'No pudimos guardar tus datos. Desmarca las opciones e inténtalo otra vez.',
      tooMany: 'Ya recibimos varios intentos desde aquí. Espera un minuto y vuelve a probar.',
      failed: 'No pudimos guardar tus datos. Revisa tu conexión e inténtalo otra vez.',
    };

class SubmitError extends Error {
  constructor(
    readonly status: number,
    readonly fields: string[],
  ) {
    super(`HTTP ${status}`);
  }
}

/** 8 dígitos = número salvadoreño (+503). Con "+" o 00 al inicio = otro país. */
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
  const endpoint = form.dataset.endpoint || '/api/waitlist';
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const done = document.querySelector<HTMLDialogElement>('[data-done]');
  const SUBMIT_LABEL = submit.textContent?.trim() || 'Unirme a la beta';

  // La base (Neon) se duerme tras unos minutos sin uso y el primer registro esperaba a que
  // despertara. Se despierta apenas la persona empieza a llenar el formulario: cuando envía, ya está.
  form.addEventListener('focusin', () => fetch(endpoint, { method: 'GET' }).catch(() => {}), { once: true });

  done?.addEventListener('close', () => {
    document.dispatchEvent(new Event('tm:scroll-unlock'));
    submit.focus();
  });

  const setStatus = (msg: string, tone: 'error' | 'info' = 'error') => {
    status.dataset.tone = tone;
    status.textContent = msg;
  };
  const setLoading = (on: boolean) => {
    submit.disabled = on;
    submit.toggleAttribute('data-loading', on);
    submit.textContent = on ? M.sending : SUBMIT_LABEL;
  };

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
    setStatus('');
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
    check('name', !name && M.name);
    check('whatsapp', !phone && M.phone);
    check('email', !!email && !EMAIL.test(email) && M.email);
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

    setLoading(true);
    // Si tarda, se dice; y nunca se queda esperando para siempre.
    const slow = setTimeout(() => setStatus(M.slow, 'info'), 2500);
    const abort = new AbortController();
    const giveUp = setTimeout(() => abort.abort(), 20000);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abort.signal,
      });
      // 201 = registro nuevo, 200 = ya estaba (se actualiza): las dos son éxito
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new SubmitError(res.status, Array.isArray(body?.fields) ? body.fields : []);
      }
      setStatus('');
      setLoading(false);
      form.reset();
      if (done) {
        document.dispatchEvent(new Event('tm:scroll-lock'));
        done.showModal();
      }
    } catch (err) {
      setLoading(false);
      setStatus('');
      if (abort.signal.aborted) {
        // Registrarse dos veces no duplica (se guarda por número), así que reintentar es seguro.
        setStatus(M.timeout);
        return;
      }
      if (err instanceof SubmitError && err.status === 422 && err.fields.length) {
        // el servidor dice qué campos no le gustaron: los marcamos igual que la validación local
        const msgs: Record<string, string> = {
          name: M.nameBad,
          whatsapp: M.phone,
          email: M.email,
        };
        const known = err.fields.filter((f) => msgs[f]);
        known.forEach((f) => setError(f, msgs[f]));
        if (known.length) {
          (form.elements.namedItem(known[0]) as HTMLInputElement)?.focus();
          return;
        }
        // el problema está en algo que no es un campo visible (por ejemplo, las opciones marcadas)
        setStatus(M.options);
        return;
      }
      setStatus(
        err instanceof SubmitError && err.status === 429
          ? M.tooMany
          : M.failed,
      );
    } finally {
      clearTimeout(slow);
      clearTimeout(giveUp);
    }
  });
}
