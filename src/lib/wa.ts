// Formato de WhatsApp a HTML: *negrita*, _cursiva_, saltos de línea.
// Solo se usa con textos propios (src/data), nunca con entrada del usuario.
const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function wa(text: string): string {
  return escape(text)
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br>');
}
