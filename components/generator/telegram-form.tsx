"use client";

import { useDictionary } from "@/components/i18n-provider";
import { FieldError } from "./content-type-selector";

export interface TelegramFormData {
  type: "user" | "group";
  username: string;
  groupId: string;
  inviteLink?: string;
}

interface Props {
  data: TelegramFormData;
  onChange: (data: TelegramFormData) => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export function TelegramForm({
  data,
  onChange,
  isLoading = false,
  errors = {},
}: Props) {
  const dict = useDictionary();
  const t = dict.generate;

  return (
    <div className="space-y-3">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          {t["telegram-type-label"]}
        </legend>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-field-border px-3 py-2 text-sm">
            <input
              type="radio"
              name="telegram-type"
              value="user"
              checked={data.type === "user"}
              onChange={() => onChange({ ...data, type: "user" })}
              disabled={isLoading}
            />
            {t["telegram-type-user"]}
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-field-border px-3 py-2 text-sm">
            <input
              type="radio"
              name="telegram-type"
              value="group"
              checked={data.type === "group"}
              onChange={() => onChange({ ...data, type: "group" })}
              disabled={isLoading}
            />
            {t["telegram-type-group"]}
          </label>
        </div>
      </fieldset>

      {data.type === "user" ? (
        <div className="space-y-2">
          <label
            htmlFor="telegram-username"
            className="block text-sm font-medium"
          >
            {t["telegram-username"]} <span aria-hidden="true">*</span>
          </label>
          <input
            id="telegram-username"
            type="text"
            value={data.username}
            onChange={(e) =>
              onChange({ ...data, username: e.currentTarget.value })
            }
            placeholder={t["telegram-username-placeholder"]}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!errors.username}
            aria-describedby={
              errors.username ? "telegram-username-error" : undefined
            }
            className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          {errors.username && (
            <FieldError id="telegram-username-error">
              {errors.username}
            </FieldError>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <label
              htmlFor="telegram-group-id"
              className="block text-sm font-medium"
            >
              {t["telegram-group-id"]} <span aria-hidden="true">*</span>
            </label>
            <input
              id="telegram-group-id"
              type="text"
              value={data.groupId}
              onChange={(e) =>
                onChange({ ...data, groupId: e.currentTarget.value })
              }
              placeholder={t["telegram-group-id-placeholder"]}
              disabled={isLoading}
              aria-required="true"
              aria-invalid={!!errors.groupId}
              aria-describedby={
                errors.groupId ? "telegram-group-id-error" : undefined
              }
              className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
            {errors.groupId && (
              <FieldError id="telegram-group-id-error">
                {errors.groupId}
              </FieldError>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="telegram-invite-link"
              className="block text-sm font-medium"
            >
              {t["telegram-invite-link"]} <span aria-hidden="true">*</span>
            </label>
            <input
              id="telegram-invite-link"
              type="text"
              value={data.inviteLink || ""}
              onChange={(e) =>
                onChange({
                  ...data,
                  inviteLink: e.currentTarget.value || undefined,
                })
              }
              placeholder={t["telegram-invite-link-placeholder"]}
              disabled={isLoading}
              aria-required="true"
              aria-invalid={!!errors.inviteLink}
              aria-describedby={
                errors.inviteLink ? "telegram-invite-link-error" : undefined
              }
              className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
            {errors.inviteLink && (
              <FieldError id="telegram-invite-link-error">
                {errors.inviteLink}
              </FieldError>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
