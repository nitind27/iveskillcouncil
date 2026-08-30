"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Check,
  Loader2,
  Upload,
  Trash2,
  Plus,
  ImageIcon,
  Award,
  BookOpen,
  IndianRupee,
  ClipboardList,
  Tags,
  ToggleLeft,
  FileText,
} from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import {
  AWARD_CATEGORIES,
  CERTIFICATE_TYPES,
  COURSE_PLAN_TYPES,
  DURATION_UNITS,
  type ExamFeeByPlan,
} from "@/lib/course-utils";
import { showError } from "@/lib/toast";
import RichTextEditor, { isRichTextEmpty } from "@/components/common/RichTextEditor";
import Link from "next/link";

export type CourseCategoryOption = {
  id: number;
  name: string;
  slug: string;
};

export type CourseFormState = {
  name: string;
  slug: string;
  awardCategory: string;
  certificateType: string;
  coursePreposition: string;
  type: string;
  category: string;
  mrp: string;
  baseFee: string;
  displayOrder: string;
  durationValue: string;
  durationUnit: string;
  imageUrl: string;
  previewVideoUrl: string;
  lectures: string;
  practicalMarks: string;
  objectiveMarks: string;
  examFeesByPlan: ExamFeeByPlan[];
  description: string;
  syllabus: string;
  eligibility: string;
  certificateSubject: string;
  tags: string[];
  isPopular: boolean;
  isRecommended: boolean;
  isMrpVisible: boolean;
  hideExamResult: boolean;
  status: string;
  shortDescription: string;
  level: string;
  mode: string;
  highlights: string;
};

export function emptyCourseForm(): CourseFormState {
  return {
    name: "",
    slug: "",
    awardCategory: "",
    certificateType: "CERTIFICATE",
    coursePreposition: "In",
    type: "SILVER",
    category: "",
    mrp: "",
    baseFee: "",
    displayOrder: "0",
    durationValue: "",
    durationUnit: "Months",
    imageUrl: "",
    previewVideoUrl: "",
    lectures: "",
    practicalMarks: "",
    objectiveMarks: "",
    examFeesByPlan: [],
    description: "",
    syllabus: "",
    eligibility: "",
    certificateSubject: "",
    tags: [""],
    isPopular: false,
    isRecommended: false,
    isMrpVisible: true,
    hideExamResult: false,
    status: "ACTIVE",
    shortDescription: "",
    level: "BEGINNER",
    mode: "OFFLINE",
    highlights: "",
  };
}

export function courseToForm(c: Record<string, unknown>): CourseFormState {
  const tags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
  const fees = Array.isArray(c.examFeesByPlan)
    ? (c.examFeesByPlan as ExamFeeByPlan[])
    : [];
  return {
    name: String(c.name || ""),
    slug: String(c.slug || ""),
    awardCategory: String(c.awardCategory || ""),
    certificateType: String(c.certificateType || "CERTIFICATE"),
    coursePreposition: String(c.coursePreposition || "In"),
    type: String(c.type || "SILVER"),
    category: String(c.category || ""),
    mrp: c.mrp != null ? String(c.mrp) : "",
    baseFee: String(c.baseFee ?? ""),
    displayOrder: String(c.displayOrder ?? 0),
    durationValue: String(c.durationValue ?? c.durationMonths ?? ""),
    durationUnit: String(c.durationUnit || "Months"),
    imageUrl: String(c.imageUrl || ""),
    previewVideoUrl: String(c.previewVideoUrl || ""),
    lectures: String(c.lectures ?? ""),
    practicalMarks: c.practicalMarks != null ? String(c.practicalMarks) : "",
    objectiveMarks: c.objectiveMarks != null ? String(c.objectiveMarks) : "",
    examFeesByPlan: fees.length
      ? fees
      : [],
    description: String(c.description || ""),
    syllabus: String(c.syllabus || ""),
    eligibility: String(c.eligibility || ""),
    certificateSubject: String(c.certificateSubject || ""),
    tags: tags.length ? tags : [""],
    isPopular: Boolean(c.isPopular),
    isRecommended: Boolean(c.isRecommended),
    isMrpVisible: c.isMrpVisible !== false,
    hideExamResult: Boolean(c.hideExamResult),
    status: c.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    shortDescription: String(c.shortDescription || ""),
    level: String(c.level || "BEGINNER"),
    mode: String(c.mode || "OFFLINE"),
    highlights: String(c.highlights || ""),
  };
}

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}

const inputCls =
  "h-10 w-full rounded-lg border border-border/70 bg-card px-3 text-sm font-medium outline-none transition focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15";
const labelCls =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const helpCls = "mt-1 text-[11px] text-muted-foreground";
const sectionCls = "space-y-3 rounded-xl border border-[#1E4A85]/10 bg-[#1E4A85]/[0.02] p-4";

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-[#1E4A85]" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked && "translate-x-5"
          )}
        />
      </button>
    </label>
  );
}

type Props = {
  open: boolean;
  editId: string | null;
  form: CourseFormState;
  setForm: Dispatch<SetStateAction<CourseFormState>>;
  categories: CourseCategoryOption[];
  saving: boolean;
  imageUploading: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onUploadImage: (file: File) => void;
  onClearImage: () => void;
  /** Sub-admin / franchise owner: hide link to admin-only category management */
  showCategoryAdminLink?: boolean;
};

export function CourseFormModal({
  open,
  editId,
  form,
  setForm,
  categories,
  saving,
  imageUploading,
  onClose,
  onSubmit,
  onUploadImage,
  onClearImage,
  showCategoryAdminLink = true,
}: Props) {
  const [examPlan, setExamPlan] = useState("SILVER");
  const [examFee, setExamFee] = useState("");

  const addTag = () => setForm((f) => ({ ...f, tags: [...f.tags, ""] }));
  const removeTag = (i: number) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.length <= 1 ? [""] : f.tags.filter((_, idx) => idx !== i),
    }));

  const addExamFee = () => {
    if (!examFee.trim()) {
      showError("Validation", "Enter exam fee");
      return;
    }
    setForm((f) => {
      const next = f.examFeesByPlan.filter((r) => r.plan !== examPlan);
      next.push({ plan: examPlan, examFee: Number(examFee) || 0 });
      return { ...f, examFeesByPlan: next };
    });
    setExamFee("");
  };

  if (!open) return null;

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="course-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10060] flex items-center justify-center bg-[#0B132B]/55 p-3 backdrop-blur-sm sm:p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.97, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 16 }}
            className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-card shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] px-5 py-4 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#E8D5A3]">
                  Course catalogue
                </p>
                <h3 className="text-lg font-bold">
                  {editId ? "Edit Course" : "Add Course"}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-white/10 p-2 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {/* Award & certificate */}
                <section className={sectionCls}>
                  <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                    <Award className="h-3.5 w-3.5 text-[#C4A35A]" />
                    Award & certificate
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Award Category</label>
                      <select
                        value={form.awardCategory}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, awardCategory: e.target.value }))
                        }
                        className={inputCls}
                      >
                        <option value="">Select Award Category</option>
                        {AWARD_CATEGORIES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Certificate Type *</label>
                      <select
                        value={form.certificateType}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            certificateType: e.target.value,
                          }))
                        }
                        className={inputCls}
                        required
                      >
                        {CERTIFICATE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t === "CERTIFICATE" ? "Certificate" : "Diploma"}
                          </option>
                        ))}
                      </select>
                      <p className={helpCls}>Select certificate or diploma type</p>
                    </div>
                  </div>
                </section>

                {/* Title */}
                <section className={sectionCls}>
                  <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                    <BookOpen className="h-3.5 w-3.5 text-[#C4A35A]" />
                    Course identity
                  </h4>
                  <div>
                    <label className={labelCls}>Course Title *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setForm((f) => ({
                          ...f,
                          name,
                          slug:
                            !editId && (!f.slug || f.slug === slugify(f.name))
                              ? slugify(name)
                              : f.slug,
                        }));
                      }}
                      placeholder="Enter Course Title"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className={labelCls}>Course Preposition</label>
                      <input
                        type="text"
                        value={form.coursePreposition}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            coursePreposition: e.target.value,
                          }))
                        }
                        placeholder="In"
                        className={inputCls}
                      />
                      <p className={helpCls}>
                        Connects category and title (e.g. Category In Title)
                      </p>
                    </div>
                    <div>
                      <label className={labelCls}>Course Type *</label>
                      <select
                        value={form.type}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, type: e.target.value }))
                        }
                        className={inputCls}
                        required
                      >
                        <option value="">Select Course Type</option>
                        {COURSE_PLAN_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <label className={labelCls}>Course Category</label>
                        {showCategoryAdminLink && (
                          <Link
                            href="/dashboard/course-categories"
                            className="text-[10px] font-bold uppercase tracking-wide text-[#1E4A85] hover:text-[#C4A35A]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Manage categories
                          </Link>
                        )}
                      </div>
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, category: e.target.value }))
                        }
                        className={inputCls}
                      >
                        <option value="">Select Course Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {categories.length === 0 && (
                        <p className={helpCls}>
                          No categories yet — add them on the Course Categories page.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>URL slug</label>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, status: e.target.value }))
                        }
                        className={inputCls}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Pricing */}
                <section className={sectionCls}>
                  <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                    <IndianRupee className="h-3.5 w-3.5 text-[#C4A35A]" />
                    Pricing & order
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className={labelCls}>MRP</label>
                      <input
                        type="number"
                        min={0}
                        value={form.mrp}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, mrp: e.target.value }))
                        }
                        placeholder="Enter MRP"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Price *</label>
                      <input
                        type="number"
                        min={0}
                        value={form.baseFee}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, baseFee: e.target.value }))
                        }
                        placeholder="Enter Price"
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Display Order</label>
                      <input
                        type="number"
                        value={form.displayOrder}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, displayOrder: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                    <div>
                      <label className={labelCls}>Duration *</label>
                      <input
                        type="number"
                        min={1}
                        value={form.durationValue}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            durationValue: e.target.value,
                          }))
                        }
                        placeholder="Enter Duration"
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Unit *</label>
                      <select
                        value={form.durationUnit}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, durationUnit: e.target.value }))
                        }
                        className={inputCls}
                        required
                      >
                        {DURATION_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className={helpCls}>
                    Select duration and unit (e.g. 30 Days, 6 Months, 1 Year)
                  </p>
                </section>

                {/* Media */}
                <section className={sectionCls}>
                  <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                    <ImageIcon className="h-3.5 w-3.5 text-[#C4A35A]" />
                    Media
                  </h4>
                  <div>
                    <label className={labelCls}>Course Image</label>
                    {form.imageUrl ? (
                      <div className="overflow-hidden rounded-xl border border-border/70">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.imageUrl}
                          alt="Cover"
                          className="h-40 w-full object-cover"
                        />
                        <div className="flex gap-2 border-t p-3">
                          <label className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1E4A85]/30 text-sm font-semibold text-[#1E4A85]">
                            {imageUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            Change
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={imageUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onUploadImage(file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={onClearImage}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#1E4A85]/25 bg-white px-4 py-8 text-center hover:border-[#1E4A85]/45">
                        <Upload className="h-7 w-7 text-[#1E4A85]/70" />
                        <span className="text-sm font-semibold">
                          {imageUploading ? "Uploading…" : "No file chosen — click to upload"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={imageUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUploadImage(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Course Preview Video</label>
                    <input
                      type="url"
                      value={form.previewVideoUrl}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          previewVideoUrl: e.target.value,
                        }))
                      }
                      placeholder="Enter YouTube Video URL"
                      className={inputCls}
                    />
                    <p className={helpCls}>
                      e.g. https://www.youtube.com/watch?v=VIDEO_ID
                    </p>
                  </div>
                </section>

                {/* Lectures & exam */}
                <section className={sectionCls}>
                  <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                    <ClipboardList className="h-3.5 w-3.5 text-[#C4A35A]" />
                    Lectures & exam format
                  </h4>
                  <div>
                    <label className={labelCls}>Total Number of Lectures *</label>
                    <input
                      type="number"
                      min={1}
                      value={form.lectures}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lectures: e.target.value }))
                      }
                      placeholder="Enter Total Lectures"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Practical Marks</label>
                      <input
                        type="number"
                        min={0}
                        value={form.practicalMarks}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            practicalMarks: e.target.value,
                          }))
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Objective Marks</label>
                      <input
                        type="number"
                        min={0}
                        value={form.objectiveMarks}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            objectiveMarks: e.target.value,
                          }))
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-dashed border-[#C4A35A]/40 bg-[#C4A35A]/5 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#8B6914]">
                      Franchise Plan Exam Fees
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={examPlan}
                        onChange={(e) => setExamPlan(e.target.value)}
                        className={cn(inputCls, "w-auto min-w-[140px]")}
                      >
                        {COURSE_PLAN_TYPES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={examFee}
                        onChange={(e) => setExamFee(e.target.value)}
                        placeholder="Enter Exam Fee"
                        className={cn(inputCls, "min-w-[140px] flex-1")}
                      />
                      <button
                        type="button"
                        onClick={addExamFee}
                        className="inline-flex h-10 items-center gap-1 rounded-lg bg-[#1E4A85] px-3 text-sm font-semibold text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                    {form.examFeesByPlan.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {form.examFeesByPlan.map((row) => (
                          <li
                            key={row.plan}
                            className="flex items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-sm"
                          >
                            <span>
                              {row.plan}: ₹{row.examFee.toLocaleString("en-IN")}
                            </span>
                            <button
                              type="button"
                              className="text-xs font-semibold text-red-600"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  examFeesByPlan: f.examFeesByPlan.filter(
                                    (r) => r.plan !== row.plan
                                  ),
                                }))
                              }
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>

                {/* Content */}
                <section className={sectionCls}>
                  <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                    <FileText className="h-3.5 w-3.5 text-[#C4A35A]" />
                    Description & syllabus
                  </h4>
                  <div>
                    <label className={labelCls}>Description *</label>
                    <RichTextEditor
                      value={form.description}
                      onChange={(description) =>
                        setForm((f) => ({ ...f, description }))
                      }
                      placeholder="Course overview, outcomes, and key highlights…"
                      minHeight={200}
                    />
                    {isRichTextEmpty(form.description) && (
                      <p className="mt-1 text-xs text-amber-600">
                        Description is required.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Syllabus *</label>
                    <RichTextEditor
                      value={form.syllabus}
                      onChange={(syllabus) =>
                        setForm((f) => ({ ...f, syllabus }))
                      }
                      placeholder="Modules, topics, week-by-week plan…"
                      minHeight={220}
                    />
                    {isRichTextEmpty(form.syllabus) && (
                      <p className="mt-1 text-xs text-amber-600">
                        Syllabus is required.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Eligibility</label>
                    <textarea
                      value={form.eligibility}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, eligibility: e.target.value }))
                      }
                      rows={3}
                      placeholder="Who can take this course (qualification, age, prerequisites)."
                      className={cn(inputCls, "h-auto resize-y py-2")}
                    />
                    <p className={helpCls}>
                      Optional — Eligibility section appears on the website only when filled.
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Certificate Subject</label>
                    <input
                      type="text"
                      value={form.certificateSubject}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          certificateSubject: e.target.value,
                        }))
                      }
                      placeholder="e.g. HTML, CSS, JavaScript, Python"
                      className={inputCls}
                    />
                    <p className={helpCls}>
                      Shows only on the certificate. Stored with admission so later course
                      edits won&apos;t change already-issued certificates.
                    </p>
                  </div>
                </section>

                {/* Tags */}
                <section className={sectionCls}>
                  <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                    <Tags className="h-3.5 w-3.5 text-[#C4A35A]" />
                    Tags *
                  </h4>
                  <div className="space-y-2">
                    {form.tags.map((tag, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) =>
                            setForm((f) => {
                              const tags = [...f.tags];
                              tags[i] = e.target.value;
                              return { ...f, tags };
                            })
                          }
                          placeholder="Enter tag"
                          className={inputCls}
                          required={i === 0}
                        />
                        <button
                          type="button"
                          onClick={() => removeTag(i)}
                          className="h-10 shrink-0 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTag}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#1E4A85]"
                    >
                      <Plus className="h-4 w-4" />
                      Add Another Tag
                    </button>
                    <p className={helpCls}>
                      Add relevant tags to help categorize your course.
                    </p>
                  </div>
                </section>

                {/* Flags */}
                <section className={sectionCls}>
                  <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                    <ToggleLeft className="h-3.5 w-3.5 text-[#C4A35A]" />
                    Visibility flags
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ToggleRow
                      label="Is Popular"
                      checked={form.isPopular}
                      onChange={(v) => setForm((f) => ({ ...f, isPopular: v }))}
                    />
                    <ToggleRow
                      label="Is Recommended"
                      checked={form.isRecommended}
                      onChange={(v) => setForm((f) => ({ ...f, isRecommended: v }))}
                    />
                    <ToggleRow
                      label="Is MRP Visible"
                      checked={form.isMrpVisible}
                      onChange={(v) => setForm((f) => ({ ...f, isMrpVisible: v }))}
                    />
                    <ToggleRow
                      label="Hide Exam Result"
                      checked={form.hideExamResult}
                      onChange={(v) => setForm((f) => ({ ...f, hideExamResult: v }))}
                    />
                  </div>
                </section>
              </div>

              <div className="flex shrink-0 gap-3 border-t border-border/60 bg-muted/20 px-5 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 flex-1 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || imageUploading}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1E4A85] text-sm font-semibold text-white hover:bg-[#163A6B] disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {editId ? "Update Course" : "Add Course"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
