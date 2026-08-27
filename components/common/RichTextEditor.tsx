"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[180px] items-center justify-center rounded-xl border border-[#1E4A85]/15 bg-[#F8FAFC] text-sm text-[#64748B]">
      Loading editor…
    </div>
  ),
});

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  return stripHtml(html).length === 0;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here…",
  className,
  minHeight = 180,
}: Props) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "color",
      "background",
      "list",
      "bullet",
      "indent",
      "align",
      "blockquote",
      "code-block",
      "link",
    ],
    []
  );

  return (
    <div
      className={cn(
        "rich-text-editor overflow-hidden rounded-xl border border-[#1E4A85]/20 bg-white shadow-sm",
        "focus-within:border-[#C4A35A]/50 focus-within:ring-2 focus-within:ring-[#C4A35A]/20",
        className
      )}
      style={{ ["--rte-min-h" as string]: `${minHeight}px` }}
    >
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .rich-text-editor .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid rgba(30, 74, 133, 0.12);
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 8px 10px;
          font-family: inherit;
        }
        .rich-text-editor .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 14px;
        }
        .rich-text-editor .ql-editor {
          min-height: var(--rte-min-h, 180px);
          color: #0f172a;
          line-height: 1.6;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: #1e4a85;
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: #1e4a85;
        }
        .rich-text-editor .ql-snow .ql-picker {
          color: #1e4a85;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #c4a35a;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #c4a35a;
        }
      `}</style>
    </div>
  );
}
