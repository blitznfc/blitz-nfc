import { Ndef } from "react-native-nfc-manager";

// WSC Field IDs (Wi-Fi Simple Configuration)
const CREDENTIAL_FIELD_ID = [0x10, 0x0e];
const SSID_FIELD_ID = [0x10, 0x45];
const AUTH_TYPE_FIELD_ID = [0x10, 0x03];
const NETWORK_KEY_FIELD_ID = [0x10, 0x27];

export interface WifiNdefParams {
  ssid: string;
  password: string;
  security: "WPA2" | "WPA3" | "open";
  hidden: boolean;
  tagId?: string;
  businessName?: string;
}

/**
 * Bangun payload WSC binary resmi yang dipakai NFC Tools & Android WifiConfig
 */
export function buildWscPayload(params: {
  ssid: string;
  password: string;
  security: "WPA2" | "WPA3" | "open";
}): number[] {
  const encoder = new TextEncoder();
  const ssidBytes = Array.from(encoder.encode(params.ssid));
  const passwordBytes = Array.from(encoder.encode(params.password));

  const authType = params.security === "open" ? [0x00, 0x00] : [0x00, 0x20];

  const authTypeTLV = [
    ...AUTH_TYPE_FIELD_ID,
    0x00,
    authType.length,
    ...authType,
  ];

  const ssidTLV = [...SSID_FIELD_ID, 0x00, ssidBytes.length, ...ssidBytes];

  const networkKeyTLV = [
    ...NETWORK_KEY_FIELD_ID,
    0x00,
    passwordBytes.length,
    ...passwordBytes,
  ];

  const credentialValue = [...authTypeTLV, ...ssidTLV, ...networkKeyTLV];
  const lengthBytes =
    credentialValue.length > 255
      ? [Math.floor(credentialValue.length / 256), credentialValue.length % 256]
      : [0x00, credentialValue.length];

  return [...CREDENTIAL_FIELD_ID, ...lengthBytes, ...credentialValue];
}

/**
 * Bangun NDEF Message multi-record persis seperti screenshot NFC Tools Anda:
 * Record 1: Media "signature/blitz" (berisi marker identifier Blitz)
 * Record 2: Media "application/vnd.wfa.wsc" (Wi-Fi Configuration)
 */
export function encodeWifiNdefMessage(params: WifiNdefParams): number[] {
  const encoder = new TextEncoder();

  // Record 1: Media signature/blitz
  const sigPayload = Array.from(
    encoder.encode(params.tagId || "BLITZ-OFFICIAL-TAG"),
  );
  const sigRecord = Ndef.record(
    Ndef.TNF_MIME_MEDIA,
    "signature/blitz",
    [],
    sigPayload,
  );

  // Record 2: Media application/vnd.wfa.wsc
  const wscPayload = buildWscPayload(params);
  const wifiRecord = Ndef.record(
    Ndef.TNF_MIME_MEDIA,
    "application/vnd.wfa.wsc",
    [],
    wscPayload,
  );

  const bytes = Ndef.encodeMessage([sigRecord, wifiRecord]);
  return bytes ? Array.from(bytes) : [];
}

/**
 * Parse SSID & status Blitz dari payload NDEF
 */
export function parseWifiSsid(ndefMessage: any[]): {
  ssid?: string;
  isBlitz: boolean;
  signature?: string;
} {
  const decoder = new TextDecoder();
  let ssid: string | undefined;
  let isBlitz = false;
  let signature: string | undefined;

  for (const record of ndefMessage || []) {
    const typeStr =
      typeof record.type === "string"
        ? record.type
        : Array.isArray(record.type)
          ? String.fromCharCode(...record.type)
          : "";

    if (typeStr === "signature/blitz") {
      isBlitz = true;
      try {
        signature = decoder.decode(new Uint8Array(record.payload || []));
      } catch {
        // ignore
      }
    } else if (typeStr === "application/vnd.wfa.wsc") {
      const raw = new Uint8Array(record.payload || []);
      for (let i = 0; i < raw.length - 4; i++) {
        if (raw[i] === 0x10 && raw[i + 1] === 0x45) {
          const len = (raw[i + 2] << 8) | raw[i + 3];
          if (i + 4 + len <= raw.length) {
            ssid = decoder.decode(raw.slice(i + 4, i + 4 + len));
          }
          break;
        }
      }
    }
  }

  return { ssid, isBlitz, signature };
}
