import type { Metadata } from "next";

const SITE_URL = "https://cutout.vercel.app"; // अपना डोमेन यहाँ डालें

// 1. All-Domain Aggressive Metadata Engine
export const globalSEOConfig: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CUTOUT — AI Background Remover | UPSC, SSC, Bank, YouTube Studio",
    template: "%s | CUTOUT Studio",
  },
  description:
    "100% Free & Private In-Browser AI Cutout. Instantly remove backgrounds, generate official UPSC / SSC / IBPS Bank passport photos, LTI thumb impressions, clean signatures, and YouTube thumbnail cutouts without cloud upload.",
  applicationName: "CUTOUT AI Studio",
  keywords: [
    // Govt Exams & Jobs
    "UPSC OTR photo resizer",
    "UPSC passport photo size 35x45",
    "SSC CGL photo and signature resizer",
    "SSC CHSL background white tool",
    "IBPS PO thumb impression size",
    "SBI Clerk photo dimension converter",
    "NEET passport and postcard size photo",
    "Railway RRB photo background remover",
    "Sarkari Result photo resizer free",
    
    // Creators & Social Media
    "YouTube thumbnail cutout maker",
    "MrBeast style thumbnail cutout",
    "transparent PNG maker without loss",
    "Instagram PFP background remover",
    "Reels cover cutout free",
    
    // Core AI & Utility Keywords
    "remove background online free hd",
    "background remover zero upload",
    "local AI background eraser",
    "offline background remover web",
    "signature cleaner for online forms",
    "LTI thumb impression binarizer",
    "Otsu threshold document scanner",
  ],
  authors: [{ name: "OnePersonAI", url: SITE_URL }],
  creator: "OnePersonAI",
  publisher: "OnePersonAI",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CUTOUT — Ultra-Fast AI Cutout & Biometric Studio",
    description:
      "Zero Cloud Upload. 100% Client-Side. Cutout backgrounds for UPSC, SSC, Bank forms, and YouTube thumbnails in under 1 second.",
    url: SITE_URL,
    siteName: "CUTOUT Studio",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "CUTOUT AI Studio - Biometric and Content Creator Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CUTOUT — Free Local AI Background Remover",
    description:
      "Instant, private, client-side cutouts for Sarkari forms and YouTube thumbnails.",
    creator: "@OnePersonAI",
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// 2. Structured JSON-LD Aggressive Domination Schema
export const structuredSchemaData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      "name": "CUTOUT Studio",
      "url": SITE_URL,
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All modern browsers (Chrome, Edge, Safari, Firefox)",
      "browserRequirements": "Requires WebAssembly and HTML5 Canvas.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
      },
      "description":
        "Military-grade, 100% private client-side image isolation engine for official government exams and digital content production.",
      "featureList": [
        "Zero server upload - 100% local processing",
        "One-click UPSC, SSC, IBPS, and NEET dimensions",
        "Biometric LTI Thumb Impression Otsu binarization",
        "Digital signature cleaning with transparent export",
        "High-definition YouTube thumbnail subject clipping",
      ],
    },
    {
      "@type": "HowTo",
      "name": "How to create compliant UPSC and SSC passport photos for free",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Upload Photo",
          "text": "Select your portrait image directly in the browser.",
        },
        {
          "@type": "HowToStep",
          "name": "Auto-Process",
          "text": "The local AI automatically removes the background and isolates the portrait.",
        },
        {
          "@type": "HowToStep",
          "name": "Select Preset and Download",
          "text": "Click UPSC or SSC preset to apply official framing and download under 50KB.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is my photo sent to any server?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. All computations run in-browser via WebAssembly. Your photos never leave your device.",
          },
        },
        {
          "@type": "Question",
          "name": "Does CUTOUT support UPSC, SSC, and Banking portal specs?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, standard presets exist for UPSC OTR, SSC CGL/CHSL, IBPS, and NEET with correct dimensions and strict file size restrictions.",
          },
        },
      ],
    },
  ],
};