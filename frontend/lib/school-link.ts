/** The student school is a separate application; never carry credentials in links. */
export function schoolOrigin(value = process.env.NEXT_PUBLIC_SCHOOL_URL): string {
  try {
    const url = new URL(value || 'https://neumoshka.ru');
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid school URL');
    return url.origin;
  } catch { return 'https://neumoshka.ru'; }
}
