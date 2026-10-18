"use client";

import { useDictionary } from "@/components/i18n-provider";
import { FieldError } from "./content-type-selector";

export interface WiFiFormData {
  ssid: string;
  password: string;
  security: "WPA2" | "WPA3";
}

interface Props {
  data: WiFiFormData;
  onChange: (data: WiFiFormData) => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export function WiFiForm({
  data,
  onChange,
  isLoading = false,
  errors = {},
}: Props) {
  const dict = useDictionary();
  const t = dict.generate;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="wifi-ssid" className="block text-sm font-medium">
          {t["wifi-ssid"]} <span aria-hidden="true">*</span>
        </label>
        <input
          id="wifi-ssid"
          type="text"
          value={data.ssid}
          onChange={(e) =>
            onChange({ ...data, ssid: e.currentTarget.value })
          }
          placeholder={t["wifi-ssid-placeholder"]}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!errors.ssid}
          aria-describedby={errors.ssid ? "wifi-ssid-error" : undefined}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        {errors.ssid && <FieldError id="wifi-ssid-error">{errors.ssid}</FieldError>}
      </div>

      <div className="space-y-2">
        <label htmlFor="wifi-password" className="block text-sm font-medium">
          {t["wifi-password"]} <span aria-hidden="true">*</span>
        </label>
        <input
          id="wifi-password"
          type="password"
          value={data.password}
          onChange={(e) =>
            onChange({ ...data, password: e.currentTarget.value })
          }
          placeholder={t["wifi-password-placeholder"]}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "wifi-password-error" : undefined}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        {errors.password && (
          <FieldError id="wifi-password-error">{errors.password}</FieldError>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="wifi-security" className="block text-sm font-medium">
          {t["wifi-security"]}
        </label>
        <select
          id="wifi-security"
          value={data.security}
          onChange={(e) =>
            onChange({
              ...data,
              security: e.currentTarget.value as "WPA2" | "WPA3",
            })
          }
          disabled={isLoading}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="WPA2">WPA2</option>
          <option value="WPA3">WPA3</option>
        </select>
      </div>
    </div>
  );
}
