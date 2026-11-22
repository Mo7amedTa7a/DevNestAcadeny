import { Helmet } from 'react-helmet-async';

/**
 * Reusable SEO component for DevNest Academy.
 * Strictly adheres to `seo-performance` skill:
 * - Dynamic Title, Description, Canonical URL
 * - Open Graph (og:locale="ar_EG", og:image, og:url, og:site_name)
 * - Twitter Cards (summary_large_image)
 * - robots meta (noindex, nofollow for private routes)
 * - Structured Data (JSON-LD schemas)
 * - Fully resolves relative image/page URLs to absolute URLs required by social scrapers (Facebook, WhatsApp, LinkedIn, X).
 */
export default function SEO({
  title = 'DevNest Academy — أكاديمية تعليم وتطوير الويب الحديث',
  description = 'معسكر تدريبي مكثف لإعداد مهندسي واجهات أمامية محترفين (Front-End Developers) لسوق العمل الحقيقي مع مشاريع عملية وتوجيه أسبوعي مباشر.',
  canonicalUrl = 'https://devnest.academy',
  ogImage = '/logo.png',
  ogType = 'website',
  noIndex = false,
  keywords = 'DevNest Academy, معسكر برمجة, كورس فرونت إند, Front-End Bootcamp, React, JavaScript, HTML5, CSS3, Bootstrap 5, تعلم البرمجة من الصفر',
  schemas = [],
}) {
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://devnest.academy';

  const resolvedUrl = canonicalUrl.startsWith('http')
    ? canonicalUrl
    : `${origin}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`;

  const resolvedImage = ogImage.startsWith('http')
    ? ogImage
    : `${origin}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;

  return (
    <Helmet>
      {/* Standard Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="DevNest Academy" />
      <meta name="theme-color" content="#0047AB" />
      <link rel="canonical" href={resolvedUrl} />

      {/* Crawlability */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph / Facebook / WhatsApp / LinkedIn */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="DevNest Academy" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:url" content={resolvedUrl} />
      <meta property="og:locale" content="ar_EG" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@DevNestAcademy" />
      <meta name="twitter:creator" content="@DevNestAcademy" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />
      <meta name="twitter:image:alt" content={title} />

      {/* JSON-LD Structured Data */}
      {schemas.map((schema, index) => (
        <script key={`schema-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
