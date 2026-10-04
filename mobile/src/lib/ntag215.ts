import NfcManager from "react-native-nfc-manager";
import {
  encodeWifiNdefMessage,
  parseWifiSsid,
  WifiNdefParams,
} from "./blitz-ndef";

// Konfigurasi Halaman Register NTAG215 (PRD §8 / §12)
const PAGE_CFG0 = 0x83; // AUTH0
const PAGE_CFG1 = 0x84; // PROT, AUTHLIM
const PAGE_PWD = 0x85; // PWD (4 byte)
const PAGE_PACK = 0x86; // PACK (2 byte)

// ─── Init & Status ─────────────────────────────────────────────────────────

export async function initNfc(): Promise<boolean> {
  try {
    await NfcManager.start();
    return true;
  } catch {
    return false;
  }
}

export function isNfcSupported(): Promise<boolean> {
  return NfcManager.isSupported();
}

export function isNfcEnabled(): Promise<boolean> {
  return NfcManager.isEnabled();
}

// ─── Baca UID ──────────────────────────────────────────────────────────────

export async function readUid(): Promise<string> {
  const tag = await NfcManager.getTag();
  if (!tag?.id) throw new Error("Tidak bisa membaca UID tag");
  return tag.id.replace(/:/g, "").toUpperCase().padStart(14, "0");
}

// ─── Raw Transceive Driver untuk Password Lock ─────────────────────────────

async function transceive(cmd: number[]): Promise<number[]> {
  return await NfcManager.nfcAHandler.transceive(cmd);
}

/**
 * Turunkan password dari PIN & UID untuk hardware lock NTAG215.
 * PIN dibatasi 6 digit (0-9) agar konsisten dan aman.
 * Format: 4 byte PWD + 2 byte PACK.
 */
function deriveTagPassword(
  pin: string,
  uidHex: string,
): { pwd: number[]; pack: number[] } {
  // Validasi: PIN harus 6 digit numeric - strip non-digits dan limit 6 chars
  const pinNumeric = pin.replace(/\D/g, "").slice(0, 6).padEnd(6, "0");
  if (!/^\d{6}$/.test(pinNumeric)) {
    throw new Error("PIN harus 6 digit numeric (0-9)");
  }

  // Hash: kombinasi PIN 6-digit + UID
  let hash = 0;
  const combined = pinNumeric + uidHex;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const p1 = (hash >>> 24) & 0xff;
  const p2 = (hash >>> 16) & 0xff;
  const p3 = (hash >>> 8) & 0xff;
  const p4 = hash & 0xff;

  return {
    pwd: [p1 ^ 0x42, p2 ^ 0x4c, p3 ^ 0x49, p4 ^ 0x5a], // "BLIZ" salt - tepat 4 bytes
    pack: [0x21, 0x5a], // PACK konstan 2 byte
  };
}

/**
 * Set password lock pada tag NTAG215 (Proteksi Write-Lock, pembacaan tetap terbuka).
 * Menggunakan MifareUltralight handler yang tersedia dalam sesi yang sama.
 */
async function applyHardwareLock(pin: string, uid: string): Promise<void> {
  try {
    const { pwd, pack } = deriveTagPassword(pin, uid);

    // Gunakan MifareUltralight handler untuk menulis halaman
    const mifareHandler = (NfcManager as any).mifareUltralightHandlerAndroid;
    if (!mifareHandler) {
      console.warn(
        "[PIN Lock] MifareUltralight handler tidak tersedia, skip PIN lock",
      );
      return;
    }

    // 1. Tulis PWD ke Page 0x85 - tepat 4 bytes
    console.log("[PIN Lock] Menulis PWD ke page 0x85...");
    const pwdPage = [pwd[0], pwd[1], pwd[2], pwd[3]];
    await mifareHandler.mifareUltralightWritePage(0x85, pwdPage);

    // 2. Tulis PACK ke Page 0x86 - tepat 4 bytes
    console.log("[PIN Lock] Menulis PACK ke page 0x86...");
    const packPage = [pack[0], pack[1], 0x00, 0x00];
    await mifareHandler.mifareUltralightWritePage(0x86, packPage);

    // 3. Baca AUTH0 saat ini (Page 0x83)
    console.log("[PIN Lock] Membaca AUTH0 current value...");
    const cfg0Data = await mifareHandler.mifareUltralightReadPages(0x83);
    if (cfg0Data && cfg0Data.length >= 4) {
      // Set AUTH0 = 0x04 (proteksi aktif mulai page 4 = user memory)
      const cfg0 = [cfg0Data[0], cfg0Data[1], cfg0Data[2], 0x04];
      console.log("[PIN Lock] Menulis AUTH0 dengan nilai proteksi...");
      await mifareHandler.mifareUltralightWritePage(0x83, cfg0);
    }

    console.log("✓ Hardware PIN lock berhasil diterapkan pada tag");
  } catch (e) {
    console.warn("[PIN Lock] Peringatan - PIN lock tidak dapat diterapkan:", e);
    // Jangan throw - biarkan Wi-Fi tetap tertulis meskipun PIN lock gagal
  }
}

// ─── Tulis & Baca NDEF Cepat & Stabil (Sama seperti NFC Tools) ──────────────

export type WriteResult = {
  status: "written" | "up-to-date";
  ssid: string;
};

/**
 * Tulis NDEF Wi-Fi dengan NdefHandler bawaan Android OS + Aktifkan Password Lock:
 */
export async function writeBlitzTag(
  params: WifiNdefParams,
  pin: string = "123456",
): Promise<WriteResult> {
  const bytes = encodeWifiNdefMessage(params);
  if (!bytes || bytes.length === 0) {
    throw new Error("Gagal meng-encode payload Wi-Fi");
  }

  const uid = await readUid();

  // 1. Cek isi tag terlebih dahulu
  try {
    const existingTag = await NfcManager.getTag();
    if (existingTag?.ndefMessage) {
      const parsed = parseWifiSsid(existingTag.ndefMessage);
      if (parsed.ssid === params.ssid && parsed.isBlitz) {
        return {
          status: "up-to-date",
          ssid: params.ssid,
        };
      }
    }
  } catch {
    // Lewati jika tag kosong
  }

  // 2. Tulis secara atomic menggunakan writeNdefMessage
  try {
    console.log("[NDEF] Menulis NDEF Wi-Fi ke tag...");
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    console.log("[NDEF] ✓ Penulisan NDEF berhasil");
  } catch (err) {
    throw new Error(
      "❌ Tag tidak support NDEF atau sudah terkunci. Gunakan tag NTAG215 yang bersih atau siapkan dengan aplikasi NFC formatter terlebih dahulu.",
    );
  }

  // 3. Aktifkan Hardware Lock (Protected with password: Yes)
  await applyHardwareLock(pin, uid);

  return {
    status: "written",
    ssid: params.ssid,
  };
}

/**
 * Periksa status asli NTAG215 (apakah terproteksi password / AUTH0) via perintah mentah READ (0x30).
 */
export async function checkTagPasswordProtection(): Promise<boolean> {
  try {
    // Baca halaman 0x83 (CFG0 / AUTH0)
    const resp = await transceive([0x30, PAGE_CFG0]);
    if (resp && resp.length >= 4) {
      const auth0 = resp[3]; // Byte ke-4 adalah AUTH0
      // Jika AUTH0 <= 0x80 (artinya ada batasan proteksi halaman user memory), maka protected = true
      return auth0 <= 0x7f;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Baca NDEF Wi-Fi dari tag beserta status proteksi hardware aslinya.
 */
export async function readAndVerifyBlitzTag(): Promise<{
  isBlitz: boolean;
  ssid?: string;
  signature?: string;
  isProtected: boolean;
}> {
  let isProtected = false;
  try {
    isProtected = await checkTagPasswordProtection();
  } catch {
    // ignore
  }

  try {
    const tag = await NfcManager.getTag();
    if (tag?.ndefMessage) {
      const parsed = parseWifiSsid(tag.ndefMessage);
      return {
        isBlitz: parsed.isBlitz,
        ssid: parsed.ssid,
        signature: parsed.signature,
        isProtected,
      };
    }
    const ndef = await NfcManager.ndefHandler.getNdefMessage();
    if (ndef?.ndefMessage) {
      const parsed = parseWifiSsid(ndef.ndefMessage);
      return {
        isBlitz: parsed.isBlitz,
        ssid: parsed.ssid,
        signature: parsed.signature,
        isProtected,
      };
    }
    return { isBlitz: false, isProtected };
  } catch {
    return { isBlitz: false, isProtected };
  }
}

export async function writeWifiNdef(params: WifiNdefParams): Promise<void> {
  await writeBlitzTag(params, "123456");
}

export async function readSignature(): Promise<string> {
  return "N/A (NFC Tools Standard Mode)";
}
