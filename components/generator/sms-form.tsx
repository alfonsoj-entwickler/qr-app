"use client";

import { useDictionary } from "@/components/i18n-provider";
import { FieldError } from "./content-type-selector";

export interface SmsFormData {
  phone: string;
  message: string;
}

interface Props {
  data: SmsFormData;
  onChange: (data: SmsFormData) => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

const MAX_CHARS = 160;

export function SmsForm({
  data,
  onChange,
  isLoading = false,
  errors = {},
}: Props) {
  const dict = useDictionary();
  const t = dict.generate;

  const charCount = data.message.length;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="sms-phone" className="block text-sm font-medium">
          {t["sms-phone"]} <span aria-hidden="true">*</span>
        </label>
        <input
          id="sms-phone"
          type="tel"
          value={data.phone}
          onChange={(e) => onChange({ ...data, phone: e.currentTarget.value })}
          placeholder={t["sms-phone-placeholder"]}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "sms-phone-error" : undefined}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        {errors.phone && <FieldError id="sms-phone-error">{errors.phone}</FieldError>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="sms-message" className="block text-sm font-medium">
            {t["sms-message"]} <span aria-hidden="true">*</span>
          </label>
          <span
            id="sms-message-count"
            className={`text-xs ${
              charCount > MAX_CHARS ? "text-danger" : "text-muted"
            }`}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
        <textarea
          id="sms-message"
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.currentTarget.value })}
          placeholder={t["sms-message-placeholder"]}
          rows={4}
          maxLength={MAX_CHARS}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={
            [errors.message ? "sms-message-error" : null, "sms-message-count"]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        {errors.message && (
          <FieldError id="sms-message-error">{errors.message}</FieldError>
        )}
      </div>
    </div>
  );
}
