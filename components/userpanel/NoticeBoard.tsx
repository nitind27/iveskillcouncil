"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiFileText } from "react-icons/fi";
import { Megaphone } from "lucide-react";
import type { PublicNotice } from "@/config/userpanel.config";
import SectionHeading from "./ui/SectionHeading";

function formatNoticeDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function NoticeBoard({ notices }: { notices?: PublicNotice[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const items = useMemo(
    () =>
      (notices || [])
        .filter((notice) => notice.active !== false && notice.title?.trim() && notice.message?.trim())
        .slice()
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [notices]
  );

  useEffect(() => {
    if (index > items.length - 1) setIndex(0);
  }, [index, items.length]);

  useEffect(() => {
    if (reduce || paused || items.length < 2) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % items.length), 7000);
    return () => window.clearInterval(id);
  }, [reduce, paused, items.length]);

  if (items.length === 0) return null;

  const notice = items[index] ?? items[0];
  const dateLabel = formatNoticeDate(notice.createdAt);
  const many = items.length > 1;

  return (
    <section id="notices" aria-label="Notices" className="relative bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          align="left"
          eyebrow="Notice board"
          title="Latest updates"
          description="Admission dates, new batches, and institute announcements."
          icon={<Megaphone className="h-3.5 w-3.5" />}
        />

        <div
          className={many ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.75fr)] lg:gap-5" : ""}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <article className="overflow-hidden rounded-[1.4rem] border border-ive-line bg-white shadow-[0_22px_50px_-32px_rgba(6,27,54,0.4)]">
            <div className="h-1 bg-gradient-to-r from-ive-saffron via-ive-royal to-ive-emerald" aria-hidden />
            <div className="p-5 sm:p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={notice.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ive-saffron/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ive-saffron-dark">
                      <Megaphone className="h-3 w-3" />
                      {many ? `${index + 1} of ${items.length}` : "Latest"}
                    </span>
                    {dateLabel && (
                      <time className="text-xs font-medium text-ive-slate" dateTime={notice.createdAt}>
                        {dateLabel}
                      </time>
                    )}
                  </div>
                  <h3 className="mt-4 text-xl font-extrabold tracking-tight text-ive-navy sm:text-2xl">{notice.title}</h3>
                  <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-ive-slate sm:text-[15px]">
                    {notice.message}
                  </p>
                  {notice.pdfUrl && (
                    <a
                      href={notice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-ive-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-ive-royal"
                    >
                      <FiFileText className="h-3.5 w-3.5" />
                      Open PDF
                    </a>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </article>

          {many && (
            <div className="overflow-hidden rounded-[1.4rem] border border-ive-line bg-[#F7FAFE]">
              <div className="flex items-center justify-between border-b border-ive-line px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ive-navy">All notices</p>
                <p className="text-xs font-semibold text-ive-slate">{items.length}</p>
              </div>
              <ul className="max-h-[22rem] divide-y divide-ive-line overflow-y-auto" role="tablist" aria-label="Choose a notice">
                {items.map((item, itemIndex) => {
                  const active = itemIndex === index;
                  const itemDate = formatNoticeDate(item.createdAt);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setIndex(itemIndex)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                          active ? "bg-white shadow-[inset_3px_0_0_0_#FF8500]" : "hover:bg-white/80"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${
                            active ? "bg-ive-saffron text-white" : "bg-white text-ive-royal"
                          }`}
                        >
                          {String(itemIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-ive-navy">{item.title}</span>
                          <span className="mt-0.5 block text-[11px] text-ive-slate">
                            {itemDate}
                            {item.pdfUrl ? " · PDF" : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
