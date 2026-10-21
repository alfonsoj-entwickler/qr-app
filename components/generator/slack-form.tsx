"use client";

import { useDictionary } from "@/components/i18n-provider";
import { FieldError } from "./content-type-selector";

export interface SlackFormData {
  url: string;
}

interface Props {
  data: SlackFormData;
  onChange: (data: SlackFormData) => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

function extractSlackParts(url: string): { workspace?: string; channel?: string } {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "slack.com" && parsed.pathname === "/app_redirect") {
      return {
        channel: parsed.searchParams.get("channel") || undefined,
        workspace: parsed.searchParams.get("team") || undefined,
      };
    }

    if (parsed.hostname === "join.slack.com") {
      const segments = parsed.pathname.split("/").filter(Boolean);
      // /t/<workspace>/shared_invite/<token>
      const workspace = segments[1];
      return { workspace };
    }
  } catch {
    // invalid URL, nothing to extract
  }

  return {};
}

export function SlackForm({
  data,
  onChange,
  isLoading = false,
  errors = {},
}: Props) {
  const dict = useDictionary();
  const t = dict.generate;

  const { workspace, channel } = extractSlackParts(data.url);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="slack-url" className="block text-sm font-medium">
          {t["slack-url"]} <span aria-hidden="true">*</span>
        </label>
        <input
          id="slack-url"
          type="url"
          value={data.url}
          onChange={(e) => onChange({ ...data, url: e.currentTarget.value })}
          placeholder={t["slack-url-placeholder"]}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!errors.url}
          aria-describedby={errors.url ? "slack-url-error" : undefined}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        {errors.url && <FieldError id="slack-url-error">{errors.url}</FieldError>}
      </div>

      {(workspace || channel) && (
        <div className="rounded-lg border border-field-border bg-muted/30 p-3 text-sm space-y-1">
          {workspace && (
            <p>
              <span className="font-medium">{t["slack-workspace"]}:</span>{" "}
              {workspace}
            </p>
          )}
          {channel && (
            <p>
              <span className="font-medium">{t["slack-channel"]}:</span>{" "}
              {channel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
