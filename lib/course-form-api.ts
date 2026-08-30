import type { CourseFormState } from "@/components/courses/CourseFormModal";
import { isRichTextEmpty } from "@/components/common/RichTextEditor";

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

export function validateCourseForm(form: CourseFormState): string | null {
  const tags = form.tags.map((t) => t.trim()).filter(Boolean);
  if (!form.name.trim() || !form.baseFee || !form.durationValue) {
    return "Title, Price and Duration are required";
  }
  if (isRichTextEmpty(form.description) || isRichTextEmpty(form.syllabus)) {
    return "Description and Syllabus are required";
  }
  if (!form.lectures || Number(form.lectures) < 1) {
    return "Total lectures is required";
  }
  if (tags.length === 0) {
    return "At least one tag is required";
  }
  if (!form.certificateType) {
    return "Certificate type is required";
  }
  return null;
}

export function courseFormToApiBody(form: CourseFormState) {
  const tags = form.tags.map((t) => t.trim()).filter(Boolean);
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || slugify(form.name),
    shortDescription: form.shortDescription.trim() || null,
    description: form.description.trim(),
    syllabus: form.syllabus.trim(),
    eligibility: form.eligibility.trim() || null,
    certificateSubject: form.certificateSubject.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
    previewVideoUrl: form.previewVideoUrl.trim() || null,
    type: form.type,
    category: form.category || null,
    awardCategory: form.awardCategory || null,
    certificateType: form.certificateType,
    coursePreposition: form.coursePreposition || "In",
    level: form.level,
    mode: form.mode,
    baseFee: Number(form.baseFee),
    mrp: form.mrp === "" ? null : Number(form.mrp),
    displayOrder: Number(form.displayOrder) || 0,
    durationValue: Number(form.durationValue),
    durationUnit: form.durationUnit,
    lectures: Number(form.lectures) || 0,
    practicalMarks:
      form.practicalMarks === "" ? null : Number(form.practicalMarks),
    objectiveMarks:
      form.objectiveMarks === "" ? null : Number(form.objectiveMarks),
    examFeesByPlan: form.examFeesByPlan,
    tags,
    highlights: form.highlights.trim() || null,
    isPopular: form.isPopular,
    isRecommended: form.isRecommended,
    isMrpVisible: form.isMrpVisible,
    hideExamResult: form.hideExamResult,
    status: form.status,
  };
}
