"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import type { ContentKind } from "@/lib/scan/types";
import { WiFiForm, type WiFiFormData } from "./wifi-form";
import { SmsForm, type SmsFormData } from "./sms-form";
import { ICalendarForm, type ICalendarFormData } from "./icalendar-form";
import { GeoForm, type GeoFormData } from "./geo-form";
import { TelegramForm, type TelegramFormData } from "./telegram-form";
import { WhatsAppForm, type WhatsAppFormData } from "./whatsapp-form";
import { SlackForm, type SlackFormData } from "./slack-form";

type ContentType =
  | "Text"
  | "Email"
  | "Phone"
  | "vCard"
  | "WiFi"
  | "SMS"
  | "iCalendar"
  | "Geo"
  | "Telegram"
  | "WhatsApp"
  | "Slack";

export interface ContentFormData {
  type: ContentType;
  text?: string;
  email?: string;
  phone?: string;
  vcard?: {
    name: string;
    email?: string;
    phone?: string;
    organization?: string;
    jobTitle?: string;
    url?: string;
  };
  wifi?: WiFiFormData;
  sms?: SmsFormData;
  icalendar?: ICalendarFormData;
  geo?: GeoFormData;
  telegram?: TelegramFormData;
  whatsapp?: WhatsAppFormData;
  slack?: SlackFormData;
}

interface Props {
  onSubmit: (data: ContentFormData) => void;
  isLoading?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-()]+$/;
const PHONE_DIGITS_REGEX = /\d/g;

// Order matches the checks in validate(), so the first error found here is
// the first one a screen-reader or keyboard user should land on.
const FIELD_ID_BY_ERROR: Record<ContentType, [string, string][]> = {
  Text: [["text", "text-input"]],
  Email: [["email", "email-input"]],
  Phone: [["phone", "phone-input"]],
  vCard: [["vcardName", "vcard-name"]],
  WiFi: [
    ["ssid", "wifi-ssid"],
    ["password", "wifi-password"],
  ],
  SMS: [
    ["phone", "sms-phone"],
    ["message", "sms-message"],
  ],
  iCalendar: [
    ["title", "ical-title"],
    ["date", "ical-date"],
    ["time", "ical-time"],
  ],
  Geo: [
    ["latitude", "geo-latitude"],
    ["longitude", "geo-longitude"],
    ["zoomLevel", "geo-zoom"],
  ],
  Telegram: [
    ["username", "telegram-username"],
    ["groupId", "telegram-group-id"],
    ["inviteLink", "telegram-invite-link"],
  ],
  WhatsApp: [
    ["phone", "whatsapp-phone"],
    ["message", "whatsapp-message"],
  ],
  Slack: [["url", "slack-url"]],
};

export function ContentTypeSelector({ onSubmit, isLoading = false }: Props) {
  const dict = useDictionary();
  const t = dict.generate;
  const e = dict.generate.errors;

  const [contentType, setContentType] = useState<ContentType>("Text");
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vcardName, setVcardName] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardOrg, setVcardOrg] = useState("");
  const [vcardTitle, setVcardTitle] = useState("");
  const [vcardUrl, setVcardUrl] = useState("");
  const [wifiData, setWifiData] = useState<WiFiFormData>({
    ssid: "",
    password: "",
    security: "WPA2",
  });
  const [smsData, setSmsData] = useState<SmsFormData>({
    phone: "",
    message: "",
  });
  const [icalendarData, setICalendarData] = useState<ICalendarFormData>({
    title: "",
    date: "",
    time: "",
    location: undefined,
    description: undefined,
    notification: 15,
  });
  const [geoData, setGeoData] = useState<GeoFormData>({
    latitude: "",
    longitude: "",
    zoomLevel: 15,
    placeName: undefined,
  });
  const [telegramData, setTelegramData] = useState<TelegramFormData>({
    type: "user",
    username: "",
    groupId: "",
    inviteLink: undefined,
  });
  const [whatsappData, setWhatsAppData] = useState<WhatsAppFormData>({
    phone: "",
    message: "",
  });
  const [slackData, setSlackData] = useState<SlackFormData>({
    url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateEmail(value: string): boolean {
    return EMAIL_REGEX.test(value);
  }

  function validatePhone(value: string): boolean {
    return PHONE_REGEX.test(value);
  }

  function validatePhoneDigits(value: string): boolean {
    const digits = value.match(PHONE_DIGITS_REGEX) || [];
    return digits.length >= 10;
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    switch (contentType) {
      case "Text":
        if (!text.trim()) {
          newErrors.text = e.textRequired;
        }
        break;
      case "Email":
        if (!email.trim()) {
          newErrors.email = e.emailRequired;
        } else if (!validateEmail(email)) {
          newErrors.email = e.emailInvalid;
        }
        break;
      case "Phone":
        if (!phone.trim()) {
          newErrors.phone = e.phoneRequired;
        } else if (!validatePhone(phone)) {
          newErrors.phone = e.phoneInvalid;
        }
        break;
      case "vCard":
        if (!vcardName.trim()) {
          newErrors.vcardName = e.vcardNameRequired;
        }
        break;
      case "WiFi":
        if (!wifiData.ssid.trim()) {
          newErrors.ssid = e.wifiSsidRequired;
        }
        if (!wifiData.password.trim()) {
          newErrors.password = e.wifiPasswordRequired;
        }
        break;
      case "SMS":
        if (!smsData.phone.trim()) {
          newErrors.phone = e.smsPhoneRequired;
        } else if (!validatePhoneDigits(smsData.phone)) {
          newErrors.phone = e.smsPhoneDigits;
        }
        if (!smsData.message.trim()) {
          newErrors.message = e.smsMessageRequired;
        }
        break;
      case "iCalendar":
        if (!icalendarData.title.trim()) {
          newErrors.title = e.icalTitleRequired;
        }
        if (!icalendarData.date) {
          newErrors.date = e.icalDateRequired;
        }
        if (!icalendarData.time) {
          newErrors.time = e.icalTimeRequired;
        }
        break;
      case "Geo": {
        const lat = parseFloat(geoData.latitude);
        const lon = parseFloat(geoData.longitude);
        if (!geoData.latitude.trim() || Number.isNaN(lat)) {
          newErrors.latitude = e.geoLatitudeRequired;
        } else if (lat < -90 || lat > 90) {
          newErrors.latitude = e.geoLatitudeRange;
        }
        if (!geoData.longitude.trim() || Number.isNaN(lon)) {
          newErrors.longitude = e.geoLongitudeRequired;
        } else if (lon < -180 || lon > 180) {
          newErrors.longitude = e.geoLongitudeRange;
        }
        if (!geoData.zoomLevel || geoData.zoomLevel < 1 || geoData.zoomLevel > 21) {
          newErrors.zoomLevel = e.geoZoomRange;
        }
        break;
      }
      case "Telegram":
        if (telegramData.type === "user") {
          if (!telegramData.username.trim()) {
            newErrors.username = e.telegramUsernameRequired;
          } else if (!telegramData.username.trim().startsWith("@")) {
            newErrors.username = e.telegramUsernameAt;
          }
        } else {
          if (!telegramData.groupId.trim()) {
            newErrors.groupId = e.telegramGroupIdRequired;
          } else if (!/^-100\d+$/.test(telegramData.groupId.trim())) {
            newErrors.groupId = e.telegramGroupIdFormat;
          }
          if (!telegramData.inviteLink?.trim()) {
            newErrors.inviteLink = e.telegramInviteLinkRequired;
          }
        }
        break;
      case "WhatsApp":
        if (!whatsappData.phone.trim()) {
          newErrors.phone = e.whatsappPhoneRequired;
        } else if (!validatePhone(whatsappData.phone)) {
          newErrors.phone = e.whatsappPhoneInvalid;
        } else if (!validatePhoneDigits(whatsappData.phone)) {
          newErrors.phone = e.whatsappPhoneDigits;
        }
        if (whatsappData.message.length > 1024) {
          newErrors.message = e.whatsappMessageTooLong;
        }
        break;
      case "Slack":
        if (!slackData.url.trim()) {
          newErrors.url = e.slackUrlRequired;
        } else if (
          !/^https:\/\/(slack\.com\/|join\.slack\.com\/)/i.test(slackData.url.trim())
        ) {
          newErrors.url = e.slackUrlFormat;
        }
        break;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstInvalidId = FIELD_ID_BY_ERROR[contentType].find(
        ([errorKey]) => newErrors[errorKey],
      )?.[1];
      if (firstInvalidId) document.getElementById(firstInvalidId)?.focus();
      return false;
    }

    return true;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();

    if (!validate()) return;

    const data: ContentFormData = {
      type: contentType,
    };

    switch (contentType) {
      case "Text":
        data.text = text;
        break;
      case "Email":
        data.email = email;
        break;
      case "Phone":
        data.phone = phone;
        break;
      case "vCard":
        data.vcard = {
          name: vcardName,
          email: vcardEmail || undefined,
          phone: vcardPhone || undefined,
          organization: vcardOrg || undefined,
          jobTitle: vcardTitle || undefined,
          url: vcardUrl || undefined,
        };
        break;
      case "WiFi":
        data.wifi = wifiData;
        break;
      case "SMS":
        data.sms = smsData;
        break;
      case "iCalendar":
        data.icalendar = icalendarData;
        break;
      case "Geo":
        data.geo = geoData;
        break;
      case "Telegram":
        data.telegram = telegramData;
        break;
      case "WhatsApp":
        data.whatsapp = whatsappData;
        break;
      case "Slack":
        data.slack = slackData;
        break;
    }

    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <p className="text-sm text-muted">{t["required-hint"]}</p>

      {/* Content Type Selector */}
      <div className="space-y-2">
        <label htmlFor="content-type" className="block text-sm font-medium">
          {t["content-type-label"]}
        </label>
        <select
          id="content-type"
          value={contentType}
          onChange={(ev) => {
            setContentType(ev.target.value as ContentType);
            setErrors({});
          }}
          disabled={isLoading}
          className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="Text">Text</option>
          <option value="Email">Email</option>
          <option value="Phone">Phone</option>
          <option value="vCard">vCard</option>
          <option value="WiFi">WiFi</option>
          <option value="SMS">SMS</option>
          <option value="iCalendar">iCalendar</option>
          <option value="Geo">{t["content-type-geo"]}</option>
          <option value="Telegram">Telegram</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Slack">Slack</option>
        </select>
      </div>

      {/* Dynamic Fields */}
      {contentType === "Text" && (
        <div className="space-y-2">
          <label htmlFor="text-input" className="block text-sm font-medium">
            {t["text-label"]} <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(ev) => setText(ev.currentTarget.value)}
            placeholder={t["text-placeholder"]}
            rows={4}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!errors.text}
            aria-describedby={errors.text ? "text-input-error" : undefined}
            className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          {errors.text && <FieldError id="text-input-error">{errors.text}</FieldError>}
        </div>
      )}

      {contentType === "Email" && (
        <div className="space-y-2">
          <label htmlFor="email-input" className="block text-sm font-medium">
            {t["email-label"]} <span aria-hidden="true">*</span>
          </label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.currentTarget.value)}
            placeholder={t["email-placeholder"]}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-input-error" : undefined}
            className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          {errors.email && <FieldError id="email-input-error">{errors.email}</FieldError>}
        </div>
      )}

      {contentType === "Phone" && (
        <div className="space-y-2">
          <label htmlFor="phone-input" className="block text-sm font-medium">
            {t["phone-label"]} <span aria-hidden="true">*</span>
          </label>
          <input
            id="phone-input"
            type="tel"
            value={phone}
            onChange={(ev) => setPhone(ev.currentTarget.value)}
            placeholder={t["phone-placeholder"]}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-input-error" : undefined}
            className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          {errors.phone && <FieldError id="phone-input-error">{errors.phone}</FieldError>}
        </div>
      )}

      {contentType === "vCard" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="vcard-name" className="block text-sm font-medium">
              {t["vcard-name-label"]} <span aria-hidden="true">*</span>
            </label>
            <input
              id="vcard-name"
              type="text"
              value={vcardName}
              onChange={(ev) => setVcardName(ev.currentTarget.value)}
              placeholder={t["vcard-name-placeholder"]}
              disabled={isLoading}
              aria-required="true"
              aria-invalid={!!errors.vcardName}
              aria-describedby={errors.vcardName ? "vcard-name-error" : undefined}
              className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
            {errors.vcardName && (
              <FieldError id="vcard-name-error">{errors.vcardName}</FieldError>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="vcard-email" className="block text-sm font-medium">
              {t["vcard-email-label"]}
            </label>
            <input
              id="vcard-email"
              type="email"
              value={vcardEmail}
              onChange={(ev) => setVcardEmail(ev.currentTarget.value)}
              placeholder={t["vcard-email-placeholder"]}
              disabled={isLoading}
              className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="vcard-phone" className="block text-sm font-medium">
              {t["vcard-phone-label"]}
            </label>
            <input
              id="vcard-phone"
              type="tel"
              value={vcardPhone}
              onChange={(ev) => setVcardPhone(ev.currentTarget.value)}
              placeholder={t["vcard-phone-placeholder"]}
              disabled={isLoading}
              className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="vcard-org" className="block text-sm font-medium">
              {t["vcard-org-label"]}
            </label>
            <input
              id="vcard-org"
              type="text"
              value={vcardOrg}
              onChange={(ev) => setVcardOrg(ev.currentTarget.value)}
              placeholder={t["vcard-org-placeholder"]}
              disabled={isLoading}
              className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="vcard-title" className="block text-sm font-medium">
              {t["vcard-title-label"]}
            </label>
            <input
              id="vcard-title"
              type="text"
              value={vcardTitle}
              onChange={(ev) => setVcardTitle(ev.currentTarget.value)}
              placeholder={t["vcard-title-placeholder"]}
              disabled={isLoading}
              className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="vcard-url" className="block text-sm font-medium">
              {t["vcard-url-label"]}
            </label>
            <input
              id="vcard-url"
              type="url"
              value={vcardUrl}
              onChange={(ev) => setVcardUrl(ev.currentTarget.value)}
              placeholder={t["vcard-url-placeholder"]}
              disabled={isLoading}
              className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {contentType === "WiFi" && (
        <WiFiForm
          data={wifiData}
          onChange={setWifiData}
          isLoading={isLoading}
          errors={errors}
        />
      )}

      {contentType === "SMS" && (
        <SmsForm
          data={smsData}
          onChange={setSmsData}
          isLoading={isLoading}
          errors={errors}
        />
      )}

      {contentType === "iCalendar" && (
        <ICalendarForm
          data={icalendarData}
          onChange={setICalendarData}
          isLoading={isLoading}
          errors={errors}
        />
      )}

      {contentType === "Geo" && (
        <GeoForm
          data={geoData}
          onChange={setGeoData}
          isLoading={isLoading}
          errors={errors}
        />
      )}

      {contentType === "Telegram" && (
        <TelegramForm
          data={telegramData}
          onChange={setTelegramData}
          isLoading={isLoading}
          errors={errors}
        />
      )}

      {contentType === "WhatsApp" && (
        <WhatsAppForm
          data={whatsappData}
          onChange={setWhatsAppData}
          isLoading={isLoading}
          errors={errors}
        />
      )}

      {contentType === "Slack" && (
        <SlackForm
          data={slackData}
          onChange={setSlackData}
          isLoading={isLoading}
          errors={errors}
        />
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t["generate-button"]}
      </button>
    </form>
  );
}

/** A visible+non-color error cue, linked to its field via aria-describedby. */
export function FieldError({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <p id={id} className="flex items-start gap-1 text-sm text-danger">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
