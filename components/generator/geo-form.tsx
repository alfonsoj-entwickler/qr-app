"use client";

import { useDictionary } from "@/components/i18n-provider";
import { FieldError } from "./content-type-selector";

export interface GeoFormData {
  latitude: string;
  longitude: string;
  zoomLevel: number;
  placeName?: string;
}

interface Props {
  data: GeoFormData;
  onChange: (data: GeoFormData) => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export function GeoForm({
  data,
  onChange,
  isLoading = false,
  errors = {},
}: Props) {
  const dict = useDictionary();
  const t = dict.generate;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="geo-latitude" className="block text-sm font-medium">
            {t["geo-latitude"]} <span aria-hidden="true">*</span>
          </label>
          <input
            id="geo-latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            value={data.latitude}
            onChange={(e) =>
              onChange({ ...data, latitude: e.currentTarget.value })
            }
            placeholder={t["geo-latitude-placeholder"]}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!errors.latitude}
            aria-describedby={errors.latitude ? "geo-latitude-error" : undefined}
            className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          {errors.latitude && (
            <FieldError id="geo-latitude-error">{errors.latitude}</FieldError>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="geo-longitude"
            className="block text-sm font-medium"
          >
            {t["geo-longitude"]} <span aria-hidden="true">*</span>
          </label>
          <input
            id="geo-longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            value={data.longitude}
            onChange={(e) =>
              onChange({ ...data, longitude: e.currentTarget.value })
            }
            placeholder={t["geo-longitude-placeholder"]}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!errors.longitude}
            aria-describedby={errors.longitude ? "geo-longitude-error" : undefined}
            className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          {errors.longitude && (
            <FieldError id="geo-longitude-error">{errors.longitude}</FieldError>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="geo-zoom" className="block text-sm font-medium">
          {t["geo-zoom"]}
        </label>
        <select
          id="geo-zoom"
          value={data.zoomLevel}
          onChange={(e) =>
            onChange({ ...data, zoomLevel: parseInt(e.currentTarget.value, 10) })
          }
          disabled={isLoading}
          aria-invalid={!!errors.zoomLevel}
          aria-describedby={errors.zoomLevel ? "geo-zoom-error" : undefined}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {Array.from({ length: 21 }, (_, i) => i + 1).map((zoom) => (
            <option key={zoom} value={zoom}>
              {zoom}
            </option>
          ))}
        </select>
        {errors.zoomLevel && (
          <FieldError id="geo-zoom-error">{errors.zoomLevel}</FieldError>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="geo-place-name" className="block text-sm font-medium">
          {t["geo-place-name"]}
        </label>
        <input
          id="geo-place-name"
          type="text"
          value={data.placeName || ""}
          onChange={(e) =>
            onChange({
              ...data,
              placeName: e.currentTarget.value || undefined,
            })
          }
          placeholder={t["geo-place-name-placeholder"]}
          disabled={isLoading}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
      </div>
    </div>
  );
}
