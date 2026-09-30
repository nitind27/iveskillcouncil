"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type VerifyDoc = {
  type?: string;
  certificateNumber?: string;
  status?: string;
  issueDate?: string;
  courseName?: string | null;
  studentName?: string;
  enrollmentNo?: string | null;
  centreName?: string | null;
  centreCode?: string | null;
};

type VerifyPayload = {
  verified: boolean;
  reason?: string;
  message?: string;
  query?: { type?: string; enr?: string | null; id?: string | null };
  document?: VerifyDoc;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const type = (searchParams?.get("type") || "ms").toLowerCase();
  const enr = searchParams?.get("enr") || "";
  const id = searchParams?.get("id") || "";

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<VerifyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enr && !id) {
        setLoading(false);
        setPayload({
          verified: false,
          reason: "MISSING_PARAMS",
          message:
            "Scan a valid QR code from an IVESDC certificate or marksheet, or enter enrollment and certificate numbers.",
        });
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("type", type === "cert" ? "cert" : "ms");
        if (enr) qs.set("enr", enr);
        if (id) qs.set("id", id);
        const res = await fetch(`/api/certificates/verify?${qs.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setError(json.error || "Verification failed");
          setPayload(null);
        } else {
          setPayload(json.data as VerifyPayload);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to reach the verification service. Please try again.");
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [type, enr, id]);

  const verified = payload?.verified === true;
  const docTypeLabel =
    (payload?.document?.type || type) === "cert"
      ? "Certificate"
      : "Statement of Marks";

  return (
    <div className="verify-page">
      <style jsx global>{`
        .verify-page {
          --ink: #0c1a2e;
          --navy: #132a4a;
          --gold: #b8922a;
          --cream: #f7f3ea;
          --ok: #1b7a4a;
          --ok-bg: #e8f6ee;
          --bad: #a32020;
          --bad-bg: #fceceb;
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184, 146, 42, 0.18), transparent 55%),
            linear-gradient(165deg, #f4efe4 0%, #ebe4d4 45%, #e2d9c6 100%);
          color: var(--ink);
          font-family: "Segoe UI", system-ui, sans-serif;
        }
        .verify-shell {
          max-width: 560px;
          margin: 0 auto;
          padding: 28px 18px 48px;
        }
        .verify-brand {
          text-align: center;
          margin-bottom: 22px;
        }
        .verify-brand img {
          height: 56px;
          width: auto;
          object-fit: contain;
        }
        .verify-brand h1 {
          margin: 10px 0 4px;
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--navy);
        }
        .verify-brand p {
          margin: 0;
          font-size: 0.82rem;
          color: #5a6578;
        }
        .verify-card {
          background: rgba(255, 252, 246, 0.92);
          border: 1px solid rgba(19, 42, 74, 0.12);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(12, 26, 46, 0.1);
          overflow: hidden;
        }
        .verify-banner {
          padding: 22px 20px;
          text-align: center;
          border-bottom: 1px solid rgba(12, 26, 46, 0.08);
        }
        .verify-banner.ok {
          background: var(--ok-bg);
        }
        .verify-banner.bad {
          background: var(--bad-bg);
        }
        .verify-banner.pending {
          background: #f0ece3;
        }
        .verify-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 12px;
          border-radius: 50%;
          display: grid;
          place-items: center;
        }
        .verify-banner.ok .verify-icon {
          background: var(--ok);
          color: #fff;
        }
        .verify-banner.bad .verify-icon {
          background: var(--bad);
          color: #fff;
        }
        .verify-banner.pending .verify-icon {
          background: var(--navy);
          color: #fff;
        }
        .verify-banner h2 {
          margin: 0 0 6px;
          font-size: 1.25rem;
          font-weight: 700;
        }
        .verify-banner.ok h2 {
          color: var(--ok);
        }
        .verify-banner.bad h2 {
          color: var(--bad);
        }
        .verify-banner p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.45;
          color: #3d4656;
        }
        .verify-body {
          padding: 20px;
        }
        .verify-meta {
          display: grid;
          gap: 10px;
        }
        .verify-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 8px;
          font-size: 0.88rem;
          padding: 8px 0;
          border-bottom: 1px dashed rgba(19, 42, 74, 0.1);
        }
        .verify-row:last-child {
          border-bottom: none;
        }
        .verify-row span:first-child {
          color: #6b7385;
          font-weight: 600;
        }
        .verify-row span:last-child {
          color: var(--ink);
          font-weight: 600;
          word-break: break-word;
        }
        .verify-query {
          margin-top: 16px;
          padding: 12px 14px;
          background: rgba(19, 42, 74, 0.04);
          border-radius: 10px;
          font-size: 0.78rem;
          color: #5a6578;
          line-height: 1.5;
        }
        .verify-query strong {
          color: var(--navy);
        }
        .verify-foot {
          text-align: center;
          margin-top: 20px;
          font-size: 0.75rem;
          color: #7a8496;
        }
        .verify-foot a {
          color: var(--navy);
          font-weight: 600;
          text-decoration: none;
        }
        .verify-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(19, 42, 74, 0.15);
          border-top-color: var(--navy);
          border-radius: 50%;
          animation: verify-spin 0.7s linear infinite;
          margin: 0 auto 12px;
        }
        @keyframes verify-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="verify-shell">
        <div className="verify-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/certificates/IVESDC LOGO-01.png" alt="IVESDC" />
          <h1>Document Verification</h1>
          <p>Indian Vocational Education Skill Development Council</p>
        </div>

        <div className="verify-card">
          {loading ? (
            <div className="verify-banner pending">
              <div className="verify-spinner" aria-hidden />
              <h2>Verifying…</h2>
              <p>Checking the IVESDC registry for this document.</p>
            </div>
          ) : error ? (
            <div className="verify-banner bad">
              <div className="verify-icon" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
                </svg>
              </div>
              <h2>Verification unavailable</h2>
              <p>{error}</p>
            </div>
          ) : verified ? (
            <>
              <div className="verify-banner ok">
                <div className="verify-icon" aria-hidden>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2>Verified — Authentic</h2>
                <p>{payload?.message}</p>
              </div>
              <div className="verify-body">
                <div className="verify-meta">
                  <div className="verify-row">
                    <span>Document</span>
                    <span>{docTypeLabel}</span>
                  </div>
                  <div className="verify-row">
                    <span>Student</span>
                    <span>{payload?.document?.studentName || "—"}</span>
                  </div>
                  <div className="verify-row">
                    <span>Enrollment</span>
                    <span>{payload?.document?.enrollmentNo || enr || "—"}</span>
                  </div>
                  <div className="verify-row">
                    <span>Number</span>
                    <span>{payload?.document?.certificateNumber || id || "—"}</span>
                  </div>
                  <div className="verify-row">
                    <span>Course</span>
                    <span>{payload?.document?.courseName || "—"}</span>
                  </div>
                  <div className="verify-row">
                    <span>Issued</span>
                    <span>{formatDate(payload?.document?.issueDate)}</span>
                  </div>
                  {(payload?.document?.centreName || payload?.document?.centreCode) && (
                    <div className="verify-row">
                      <span>Centre</span>
                      <span>
                        {[payload.document?.centreName, payload.document?.centreCode]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="verify-banner bad">
                <div className="verify-icon" aria-hidden>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </div>
                <h2>Not verified</h2>
                <p>{payload?.message || "This document could not be verified."}</p>
              </div>
              <div className="verify-body">
                <div className="verify-query">
                  <div>
                    <strong>Checked:</strong> {docTypeLabel}
                  </div>
                  {enr ? (
                    <div>
                      <strong>Enrollment:</strong> {enr}
                    </div>
                  ) : null}
                  {id ? (
                    <div>
                      <strong>Number:</strong> {id}
                    </div>
                  ) : null}
                  {payload?.reason ? (
                    <div>
                      <strong>Reason:</strong> {payload.reason}
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>

        <p className="verify-foot">
          Official verification by IVESDC ·{" "}
          <Link href="/">Return home</Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#f4efe4",
            color: "#132a4a",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Loading verification…
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
