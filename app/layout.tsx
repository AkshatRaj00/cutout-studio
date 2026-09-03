import React from "react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { HeaderNav } from "./HeaderNav";

export const viewport: Viewport = {
  themeColor: "#07080a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cutout.onepersonai.in"),

  title: {
    default: "CUTOUT — Free AI Background Remover | UPSC, SSC, Bank & YouTube Studio",
    template: "%s | CUTOUT by OnePersonAI",
  },

  description:
    "Official 100% private, client-side background remover and biometric studio by OnePersonAI & Akshat Raj. Zero server upload. Create compliant UPSC, SSC, IBPS passport photos, signature cleanups, LTI thumb impressions, and HD YouTube cutouts instantly.",

  keywords: [
    // Brand & Identity
    "CUTOUT",
    "OnePersonAI",
    "Akshat Raj",
    "CUTOUT Studio",
    "OnePersonAI CUTOUT",
    
    // Govt Exams, Portals & Biometrics
    "passport photo maker online",
    "signature cleaner for exam forms",
    "thumb impression LTI generator",
    "upsc photo signature resize",
    "ssc photo background remover",
    "UPSC OTR photo resizer",
    "UPSC passport photo size 35x45",
    "SSC CGL photo and signature resizer",
    "SSC CHSL white background tool",
    "IBPS PO thumb impression size 20kb to 50kb",
    "SBI Clerk photo dimension converter",
    "NEET passport and postcard size photo maker",
    "Railway RRB photo signature compressor",
    "Sarkari Result photo resizer free online",
    "Otsu threshold document cleaner",
    "biometric thumb impression enhancer",
    
    // Content Creators, Thumbnails & Social Media
    "YouTube thumbnail cutout maker",
    "MrBeast style thumbnail cutout free",
    "transparent PNG maker without quality loss",
    "Instagram PFP background remover",
    "Reels cover subject cutout online",
    "gaming thumbnail sticker cutout generator",
    "high resolution cutout download without watermark",
    
    // Core AI & Tech
    "remove background online free hd",
    "background remover zero server upload",
    "in browser client side AI background eraser",
    "offline background remover web app",
    "free alternative to remove bg",
    "photoroom free alternative offline",
  ],

  authors: [
    {
      name: "Akshat Raj",
      url: "https://www.linkedin.com/in/onepersonai-in-197644426/",
    },
    {
      name: "OnePersonAI",
      url: "https://onepersonai.in",
    },
  ],

  creator: "Akshat Raj",
  publisher: "OnePersonAI",
  applicationName: "CUTOUT Studio",
  category: "Utilities & Web Applications",

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

  alternates: {
    canonical: "https://cutout.onepersonai.in",
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://cutout.onepersonai.in",
    siteName: "CUTOUT by OnePersonAI",
    title: "CUTOUT — AI Background Remover & Biometric Studio (100% Private)",
    description:
      "Engineered by Akshat Raj under OnePersonAI. Zero cloud storage. Clean signatures, generate LTI thumb impressions, UPSC/SSC passport photos, and HD YouTube cutouts in milliseconds.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CUTOUT Studio by Akshat Raj - Biometric & Content Creator Suite",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "CUTOUT — AI Background Remover & Biometric Studio",
    description:
      "100% private in-browser passport photo, signature, LTI thumb impression, and YouTube cutout utility by Akshat Raj.",
    creator: "@onepersonai_in",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const socialLinks = [
  { label: "Telegram", href: "https://t.me/onepersonaiofficial" },
  { label: "X", href: "https://x.com/onepersonai_in" },
  { label: "YouTube", href: "https://www.youtube.com/@OnePersonAI_Official" },
  { label: "Instagram", href: "https://www.instagram.com/onepersonaiofficial/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/onepersonai-in-197644426/" },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61592496011767" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": "https://onepersonai.in/#akshatraj",
        name: "Akshat Raj",
        jobTitle: "Founder & Software Engineer",
        worksFor: {
          "@type": "Organization",
          "@id": "https://onepersonai.in/#organization",
          name: "OnePersonAI",
          url: "https://onepersonai.in",
        },
        sameAs: [
          "https://www.linkedin.com/in/onepersonai-in-197644426/",
          "https://x.com/onepersonai_in",
          "https://www.youtube.com/@OnePersonAI_Official",
          "https://www.instagram.com/onepersonaiofficial/",
          "https://www.facebook.com/profile.php?id=61592496011767",
          "https://t.me/onepersonaiofficial",
        ],
      },
      {
        "@type": "Organization",
        "@id": "https://onepersonai.in/#organization",
        name: "OnePersonAI",
        url: "https://onepersonai.in",
        founder: {
          "@id": "https://onepersonai.in/#akshatraj",
        },
        brand: ["CUTOUT", "KB Fixer"],
        sameAs: [
          "https://x.com/onepersonai_in",
          "https://www.youtube.com/@OnePersonAI_Official",
          "https://www.instagram.com/onepersonaiofficial/",
          "https://www.facebook.com/profile.php?id=61592496011767",
        ],
      },
      {
        "@type": "WebApplication",
        "@id": "https://cutout.onepersonai.in/#app",
        name: "CUTOUT",
        url: "https://cutout.onepersonai.in",
        applicationCategory: "PhotoEditorApplication",
        operatingSystem: "All modern browsers (Chrome, Edge, Safari, Firefox)",
        browserRequirements: "Requires WebAssembly and HTML5 Canvas.",
        creator: {
          "@id": "https://onepersonai.in/#akshatraj",
        },
        publisher: {
          "@id": "https://onepersonai.in/#organization",
        },
        description:
          "Military-grade, 100% private client-side image isolation engine for official government exam forms (UPSC, SSC, IBPS, NEET) and digital content creators.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
        featureList: [
          "Zero server upload - 100% local in-browser computation",
          "One-click official UPSC, SSC, IBPS & NEET dimensions",
          "Biometric LTI Thumb Impression Otsu binarization",
          "Signature cleaning with transparent background export",
          "YouTube thumbnail character cutout generation",
        ],
      },
      {
        "@type": "HowTo",
        "name": "How to create compliant UPSC and SSC passport photos for free",
        "step": [
          {
            "@type": "HowToStep",
            "name": "Upload Photo",
            "text": "Select your photo directly in the browser. It never uploads to any server.",
          },
          {
            "@type": "HowToStep",
            "name": "Auto-Process",
            "text": "The local engine automatically removes the background and isolates the subject.",
          },
          {
            "@type": "HowToStep",
            "name": "Select Preset and Download",
            "text": "Select UPSC, SSC, or NEET preset to frame, add name/date stamp, and download under 50KB.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Are my photos uploaded to any server or cloud?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. All background removal and image processing happens 100% inside your browser using client-side WebAssembly and Canvas. Your private photos never leave your device.",
            },
          },
          {
            "@type": "Question",
            "name": "Does CUTOUT support UPSC OTR, SSC, and Banking specifications?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. It features built-in presets for UPSC OTR, SSC CGL/CHSL, IBPS, and NEET with exact dimensions (35x45mm) and strict under-50KB compression.",
            },
          },
          {
            "@type": "Question",
            "name": "Can I use CUTOUT for YouTube thumbnails and social media?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. It exports clean, high-resolution transparent PNG cutouts perfect for YouTube thumbnails, gaming avatars, and Instagram Reels without compression loss.",
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en" style={{ margin: 0, padding: 0, backgroundColor: "#07080a" }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      </head>

      <body
        style={{
          minHeight: "100dvh",
          margin: 0,
          padding: 0,
          overflowX: "hidden",
          color: "#f8fafc",
          backgroundColor: "#07080a",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
          {/* Header Navigation with Passport, Signature & LTI */}
          <HeaderNav />

          <main style={{ width: "100%", flex: "1 0 auto" }}>{children}</main>

          {/* Clean Original Footer */}
          <footer
            style={{
              width: "100%",
              flex: "0 0 auto",
              borderTop: "1px solid #1a1f26",
              backgroundColor: "#0d0f12",
              padding: "24px 20px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                maxWidth: 1240,
                margin: "0 auto",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src="/favicon.ico"
                  alt="CUTOUT"
                  style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 900, color: "#ffffff", letterSpacing: "0.5px" }}>
                    CUTOUT
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: 2 }}>
                    A Product by <strong style={{ color: "#94a3b8" }}>OnePersonAI</strong> • Engineered by <strong style={{ color: "#ff5500" }}>onepersonai.in</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1", textDecoration: "none" }}
                  >
                    {social.label.toUpperCase()}
                  </a>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}