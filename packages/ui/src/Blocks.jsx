/**
 * Renders the typed block array used by articles and events.
 * Blocks are data, never HTML strings, so nothing from the content API can
 * inject markup into the page.
 */
export default function Blocks({ blocks = [] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        const key = `${b.type}-${i}`
        if (b.type === 'h') return <h2 key={key}>{b.text}</h2>
        if (b.type === 'quote') return <blockquote key={key}><p>{b.text}</p></blockquote>
        if (b.type === 'list') {
          return <ul key={key}>{b.items.map((it, j) => <li key={it} style={{ '--j': j }}>{it}</li>)}</ul>
        }
        return <p key={key}>{b.text}</p>
      })}
    </div>
  )
}
