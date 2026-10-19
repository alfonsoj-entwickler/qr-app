"use client";

import { useDictionary } from "@/components/i18n-provider";
import { FieldError } from "./content-type-selector";

export interface ICalendarFormData {
  title: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
  notification?: number;
}

interface Props {
  data: ICalendarFormData;
  onChange: (data: ICalendarFormData) => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export function ICalendarForm({
  data,
  onChange,
  isLoading = false,
  errors = {},
}: Props) {
  const dict = useDictionary();
  const t = dict.generate;

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="ical-title" className="block text-sm font-medium">
          {t["icalendar-title"]} <span aria-hidden="true">*</span>
        </label>
        <input
          id="ical-title"
          type="text"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.currentTarget.value })}
          placeholder={t["icalendar-title-placeholder"]}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "ical-title-error" : undefined}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        {errors.title && <FieldError id="ical-title-error">{errors.title}</FieldError>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="ical-date" className="block text-sm font-medium">
            {t["icalendar-date"]} <span aria-hidden="true">*</span>
          </label>
          <input
            id="ical-date"
            type="date"
            value={data.date}
            onChange={(e) => onChange({ ...data, date: e.currentTarget.value })}
            min={minDate}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? "ical-date-error" : undefined}
            className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          {errors.date && <FieldError id="ical-date-error">{errors.date}</FieldError>}
        </div>

        <div className="space-y-2">
          <label htmlFor="ical-time" className="block text-sm font-medium">
            {t["icalendar-time"]} <span aria-hidden="true">*</span>
          </label>
          <input
            id="ical-time"
            type="time"
            value={data.time}
            onChange={(e) => onChange({ ...data, time: e.currentTarget.value })}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!errors.time}
            aria-describedby={errors.time ? "ical-time-error" : undefined}
            className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          {errors.time && <FieldError id="ical-time-error">{errors.time}</FieldError>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="ical-location" className="block text-sm font-medium">
          {t["icalendar-location"]}
        </label>
        <input
          id="ical-location"
          type="text"
          value={data.location || ""}
          onChange={(e) =>
            onChange({
              ...data,
              location: e.currentTarget.value || undefined,
            })
          }
          placeholder={t["icalendar-location-placeholder"]}
          disabled={isLoading}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="ical-description" className="block text-sm font-medium">
          {t["icalendar-description"]}
        </label>
        <textarea
          id="ical-description"
          value={data.description || ""}
          onChange={(e) =>
            onChange({
              ...data,
              description: e.currentTarget.value || undefined,
            })
          }
          placeholder={t["icalendar-description-placeholder"]}
          rows={3}
          disabled={isLoading}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="ical-notification" className="block text-sm font-medium">
          {t["icalendar-notification"]}
        </label>
        <select
          id="ical-notification"
          value={data.notification || 15}
          onChange={(e) =>
            onChange({
              ...data,
              notification: parseInt(e.currentTarget.value, 10),
            })
          }
          disabled={isLoading}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value={15}>{t["notification-15m"]}</option>
          <option value={30}>{t["notification-30m"]}</option>
          <option value={60}>{t["notification-1h"]}</option>
          <option value={1440}>{t["notification-1d"]}</option>
        </select>
      </div>
    </div>
  );
}
