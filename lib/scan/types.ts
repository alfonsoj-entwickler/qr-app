export type BarcodeFormat =
  | "QR_CODE"
  | "EAN_13"
  | "EAN_8"
  | "UPC_A"
  | "UPC_E"
  | "CODE_128"
  | "CODE_39";

export type ScanSource = "generated" | "scanned";

export type ContentKind =
  | "URL"
  | "TEXT"
  | "EMAIL"
  | "PHONE"
  | "VCARD"
  | "WIFI"
  | "SMS"
  | "ICALENDAR"
  | "GEO"
  | "TELEGRAM"
  | "WHATSAPP"
  | "SLACK";

export type VCardData = {
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
  url?: string;
};

export type WiFiQR = {
  ssid: string;
  password: string;
  security: "WPA2" | "WPA3";
};

export type SmsQR = {
  phone: string;
  message: string;
};

export type ICalendarQR = {
  title: string;
  dateTime: Date;
  location?: string;
  description?: string;
  notification?: number;
};

export type GeoQR = {
  latitude: number; // required, range: -90 to +90
  longitude: number; // required, range: -180 to +180
  zoomLevel: number; // required, range: 1 to 21
  placeName?: string; // optional, display name
};

export type TelegramQR = {
  type: "user" | "group"; // user (@username) or group (ID)
  identifier: string; // @username (string) or group ID (negative number as string)
  inviteLink?: string; // optional, for group invite links
};

export type WhatsAppQR = {
  phone: string; // required, format: +1234567890 or 1234567890
  message?: string; // optional, predefined message
};

export type SlackQR = {
  workspaceId: string; // required
  channelId: string; // required
  inviteUrl: string; // required, full URL
};

// Lo que produce el lector. SPEC 03 guardará exactamente esta forma en el historial.
export interface ScanResult {
  text: string; // texto decodificado, sin modificar
  format: BarcodeFormat; // mapeado desde result.result.format.formatName de html5-qrcode
  kind: ContentKind; // SPEC 05: tipo de contenido detectado
  source: ScanSource;
  scannedAt: number; // Date.now()
}
