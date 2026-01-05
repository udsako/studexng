// src/components/SEO.tsx
// Dynamic SEO component for client-side meta tag injection
"use client";

import { useEffect } from "react";
import Head from "next/head";
import { PageMetadata, defaultMetadata } from "@/lib/metadata";

interface SEOProps {
  metadata?: Partial<PageMetadata>;
  structuredData?: object;
}

export default function SEO({ metadata, structuredData }: SEOProps) {
  const meta = {
    ...defaultMetadata,
    ...metadata,
  };

  const fullTitle = metadata?.title
    ? `${metadata.title} | StudEx`
    : defaultMetadata.title;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", meta.description);
    }

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", fullTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute("content", meta.description);
    }
  }, [fullTitle, meta.description]);

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={meta.description} />
      {meta.keywords && (
        <meta name="keywords" content={meta.keywords.join(", ")} />
      )}
      {meta.noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      {meta.canonicalUrl && <link rel="canonical" href={meta.canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={meta.ogType || "website"} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={meta.description} />
      {meta.ogImage && <meta property="og:image" content={meta.ogImage} />}
      <meta property="og:site_name" content="StudEx" />
      <meta property="og:locale" content="en_NG" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={meta.description} />
      {meta.ogImage && <meta property="twitter:image" content={meta.ogImage} />}

      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#7C3AED" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="StudEx" />

      {/* Favicons */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </Head>
  );
}
