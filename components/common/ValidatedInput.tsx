"use client";

import { useState, useId } from "react";
import { validateEmail, validatePhone, validateName, type ValidationResult } from "@/lib/validation";
import { cn } from "@/lib/utils";

type FieldType = "email" | "phone" | "name";

const validators: Record<FieldType, (v: string) => ValidationResult> = {
  email: validateEmail,
  phone: validatePhone,
  name: validateName,
};

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onBlur" | "onChange"> {
  type: "email" | "phone" | "name" | "text";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
  showError?: boolean;
  validateOnBlur?: boolean;
  required?: boolean;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export function ValidatedInput({
  type,
  value,
  onChange,
  onBlur,
  label,
  error: externalError,
  showError = true,
  validateOnBlur = true,
  required,
  inputClassName,
  labelClassName,
  errorClassName,
  placeholder: customPlaceholder,
  ...rest
}: ValidatedInputProps) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const validator = type !== "text" ? validators[type as FieldType] : null;
  const error = externalError ?? internalError;

  const handleBlur = () => {
    setTouched(true);
    if (validateOnBlur && validator) {
      const result = validator(value);
      setInternalError(result.valid ? null : (result.error ?? null));
    }
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (touched && validator) {
      const result = validator(v);
      setInternalError(result.valid ? null : (result.error ?? null));
    }
  };

  const inputType = type === "phone" ? "tel" : type === "name" ? "text" : type;
  const defaultPlaceholder =
    type === "email" ? "e.g. name@example.com" :
    type === "phone" ? "10-digit mobile (e.g. 9876543210)" :
    type === "name" ? "Full name (min 2 characters)" :
    customPlaceholder ?? "";

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className={cn("block text-sm font-medium text-foreground mb-1", labelClassName)}>
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <input
        id={id}
        type={inputType}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        required={required}
        placeholder={defaultPlaceholder}
        maxLength={type === "phone" ? 14 : type === "name" ? 150 : undefined}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
          error ? "border-destructive focus:border-destructive" : "border-input bg-background focus:border-primary",
          inputClassName
        )}
        {...rest}
      />
      {showError && error && (
        <p className={cn("text-xs text-destructive", errorClassName)}>{error}</p>
      )}
    </div>
  );
}
