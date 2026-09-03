"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function HeaderNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      style={{
        width: "100%",
        borderBottom: "1px solid #1a1f26",
        backgroundColor: "#0d0f12",
        padding: "16px 24px",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 50,
      }}
    >
      <style>{`
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .mobile-menu-btn {
          display: none;
        }
        @media (max-width: 960px) {
          .desktop-nav {
            display: none;
          }
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
        >
          <img
            src="/favicon.ico"
            alt="CUTOUT Logo"
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              objectFit: "cover",
              display: "block",
              boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
          <span
            style={{
              fontSize: "22px",
              fontWeight: 900,
              letterSpacing: "-0.5px",
              color: "#ffffff",
              textTransform: "uppercase",
            }}
          >
            CUTOUT
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="desktop-nav">
          <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#cbd5e1",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 4,
                border: "1px solid #232a36",
                backgroundColor: "#161922",
                letterSpacing: "0.5px",
              }}
            >
              PASSPORT STUDIO
            </Link>
            <Link
              href="/signature"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#ff5500",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 4,
                border: "1px solid #332014",
                backgroundColor: "rgba(255, 85, 0, 0.08)",
                letterSpacing: "0.5px",
              }}
            >
              SIGNATURE CLEANER
            </Link>
            <Link
              href="/lti"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#00e5ff",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 4,
                border: "1px solid #10344a",
                backgroundColor: "rgba(0, 229, 255, 0.08)",
                letterSpacing: "0.5px",
              }}
            >
              THUMB IMPRESSION (LTI)
            </Link>
          </nav>

          <a
            href="https://t.me/onepersonaiofficial"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#000000",
              backgroundColor: "#ff5500",
              padding: "8px 16px",
              textDecoration: "none",
              borderRadius: 4,
              letterSpacing: "0.5px",
            }}
          >
            JOIN TELEGRAM
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: "#161922",
            border: "1px solid #262f3d",
            color: "#ffffff",
            padding: "8px",
            cursor: "pointer",
            borderRadius: 6,
          }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            backgroundColor: "#0d0f12",
            borderBottom: "1px solid #1a1f26",
            padding: "16px 20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#f8fafc",
              textDecoration: "none",
              padding: "12px 16px",
              background: "#161922",
              border: "1px solid #232a36",
              borderRadius: 4,
            }}
          >
            PASSPORT STUDIO
          </Link>
          <Link
            href="/signature"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#ff5500",
              textDecoration: "none",
              padding: "12px 16px",
              background: "rgba(255, 85, 0, 0.08)",
              border: "1px solid #332014",
              borderRadius: 4,
            }}
          >
            SIGNATURE CLEANER
          </Link>
          <Link
            href="/lti"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#00e5ff",
              textDecoration: "none",
              padding: "12px 16px",
              background: "rgba(0, 229, 255, 0.08)",
              border: "1px solid #10344a",
              borderRadius: 4,
            }}
          >
            THUMB IMPRESSION (LTI)
          </Link>
          <a
            href="https://t.me/onepersonaiofficial"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "#000000",
              backgroundColor: "#ff5500",
              padding: "12px 16px",
              textAlign: "center",
              textDecoration: "none",
              borderRadius: 4,
            }}
          >
            JOIN TELEGRAM
          </a>
        </div>
      )}
    </header>
  );
}