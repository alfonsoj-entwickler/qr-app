"use client";

import { useDictionary } from "@/components/i18n-provider";
import { FieldError } from "./content-type-selector";

export interface WhatsAppFormData {
  phone: string;
  message: string;
}

interface Props {
  data: WhatsAppFormData;
  onChange: (data: WhatsAppFormData) => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

const MAX_CHARS = 1024;

export function WhatsAppForm({
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
        <label htmlFor="whatsapp-phone" className="block text-sm font-medium">
          {t["whatsapp-phone"]} <span aria-hidden="true">*</span>
        </label>
        <input
          id="whatsapp-phone"
          type="tel"
          value={data.phone}
          onChange={(e) =>
            onChange({ ...data, phone: e.currentTarget.value })
          }
          placeholder={t["whatsapp-phone-placeholder"]}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "whatsapp-phone-error" : undefined}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        {errors.phone && (
          <FieldError id="whatsapp-phone-error">{errors.phone}</FieldError>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="whatsapp-message"
            className="block text-sm font-medium"
          >
            {t["whatsapp-message"]}
          </label>
          <span id="whatsapp-message-count" className="text-xs text-muted">
            {t["whatsapp-message-chars"]
              .replace("{count}", String(charCount))
              .replace("{max}", String(MAX_CHARS))}
          </span>
        </div>
        <textarea
          id="whatsapp-message"
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.currentTarget.value })}
          placeholder={t["whatsapp-message-placeholder"]}
          rows={4}
          maxLength={MAX_CHARS}
          disabled={isLoading}
          aria-invalid={!!errors.message}
          aria-describedby={
            [
              errors.message ? "whatsapp-message-error" : null,
              "whatsapp-message-count",
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        {errors.message && (
          <FieldError id="whatsapp-message-error">{errors.message}</FieldError>
        )}
      </div>
    </div>
  );
}
