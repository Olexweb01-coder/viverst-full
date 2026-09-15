/**
 * Per-route SEO. React 19 hoists <title>, <meta> and <link> rendered anywhere
 * in the tree into <head>, so no helmet library is needed.
 *
 * `jsonLd` renders structured data for the specific page (an article, an
 * event). The site-wide Organization graph lives in index.html instead, so a
 * crawler still gets it without executing JavaScript.
 */
export default function Seo({
  title,
  description,
  path = '/',
  type = 'website',
  image = 'https://www.viverst.com/og-image.png',
  jsonLd,
}) {
  const url = `https://www.viverst.com${path}`
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  )
}
