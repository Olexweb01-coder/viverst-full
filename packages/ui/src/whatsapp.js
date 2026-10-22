/**
 * WhatsApp click-to-chat. Opens a chat with the business number and a message
 * already typed, so the team can see at once that the person came from the
 * website, which site, and what they want. Nothing is sent until the visitor
 * presses send in WhatsApp themselves.
 */

/* wa.me wants the full international number as digits only: no +, spaces or
   leading 0. Anything else and the link opens WhatsApp without a chat. */
export const waDigits = (number) => String(number || '').replace(/\D/g, '')

export function whatsappUrl(number, text = '') {
  const base = `https://wa.me/${waDigits(number)}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

const host = (site) => String(site || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')

/**
 * The message the visitor sends.
 *   whatsappMessage({ business: 'Viverst Agro', site: 'https://agro.viverst.com',
 *                     name, email, topic, message })
 * With nothing filled in it opens the conversation and leaves the cursor
 * after "I would like to ask about:" for the visitor to finish.
 * `say` is one ready sentence that follows the greeting, for links that
 * already know what the visitor wants (a product, a food package).
 */
export function whatsappMessage({ business, site, name = '', email = '', topic = '', message = '', say = '' }) {
  const intro = `Hello ${business}, I am contacting you from your website (${host(site)}).`
  if (say.trim()) return `${intro}\n\n${say.trim()}`
  const n = name.trim(); const e = email.trim(); const t = topic.trim(); const m = message.trim()
  if (!n && !m) return `${intro}\n\nI would like to ask about: `
  const lines = [intro, '']
  if (n) lines.push(`Name: ${n}`)
  if (e) lines.push(`Email: ${e}`)
  if (t) lines.push(`About: ${t}`)
  if (m) lines.push('', `What I need: ${m}`)
  return lines.join('\n')
}
