/**
 * Client-side cookies: Secure + SameSite when on HTTPS.
 * HttpOnly is not available from JavaScript by design.
 */

const isSecureContext = () =>
  typeof window !== 'undefined' &&
  (window.isSecureContext || window.location.protocol === 'https:')

export function setClientCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
  path = '/'
): void {
  if (typeof document === 'undefined') return
  const secure = isSecureContext() ? '; Secure' : ''
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

export function getClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const key = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const t = part.trim()
    if (t.startsWith(key)) return decodeURIComponent(t.slice(key.length))
  }
  return null
}

export function deleteClientCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') return
  document.cookie = `${encodeURIComponent(name)}=; Path=${path}; Max-Age=0; SameSite=Lax`
}
