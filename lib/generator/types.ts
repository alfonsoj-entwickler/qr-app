export type GeneratedCodeKind = "text" | "url";

export interface GeneratedCode {
  id: string; // generatedAt en base 36 + Math.random, igual que ScanResult
  text: string; // el texto o URL ingresados
  kind: GeneratedCodeKind; // determinado por parseContent
  generatedAt: number; // timestamp en milisegundos
}
