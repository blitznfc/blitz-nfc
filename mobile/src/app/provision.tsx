import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  initNfc,
  readAndVerifyBlitzTag,
  readUid,
  writeBlitzTag,
} from "@/lib/ntag215";
import {
  loadPrototype,
  upsertProvisionedTag,
  type PrototypeData,
  type WifiConfig,
} from "@/lib/prototype";
import NfcManager, { NfcTech } from "react-native-nfc-manager";

const INK = "#17221c",
  MUTED = "#69766d",
  GREEN = "#236b45";

export default function ProvisionScreen() {
  const [data, setData] = useState<PrototypeData | null>(null);
  const [phase, setPhase] = useState<
    "ready" | "scanning" | "writing" | "done" | "error" | "unsupported"
  >("ready");
  const [lastUid, setLastUid] = useState("");
  const [tagDetails, setTagDetails] = useState<Record<string, string> | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState("");
  const nfcInited = useRef(false);
  const activeRef = useRef(false);

  useEffect(() => {
    loadPrototype().then(setData);
    return () => {
      if (activeRef.current) {
        void NfcManager.cancelTechnologyRequest().catch(() => undefined);
      }
    };
  }, []);

  const wifi: WifiConfig | undefined = data?.wifiConfigs.find(
    (item) => item.id === data.activeWifiId,
  );

  async function prepareNfcSession(): Promise<boolean> {
    if (Platform.OS !== "android") {
      setErrorMsg("Fitur NFC saat ini hanya disiapkan untuk Android.");
      setPhase("unsupported");
      return false;
    }
    setErrorMsg("");
    if (!nfcInited.current) {
      const started = await initNfc();
      if (!started) {
        setErrorMsg("Gagal menginisialisasi NFC.");
        setPhase("error");
        return false;
      }
      nfcInited.current = true;
    }
    if (!(await NfcManager.isSupported())) {
      setErrorMsg("Perangkat ini tidak mendukung NFC.");
      setPhase("unsupported");
      return false;
    }
    if (!(await NfcManager.isEnabled())) {
      setErrorMsg("NFC belum aktif. Aktifkan NFC di Settings lalu coba lagi.");
      setPhase("error");
      return false;
    }
    return true;
  }

  async function requestTechSession() {
    activeRef.current = true;
    // Cukup minta NfcTech.Ndef saja agar TagTechnologyRequest mengikat objek Ndef (bukan NdefFormatable yang bikin ClassCastException)
    await NfcManager.requestTechnology(NfcTech.Ndef);
  }

  async function scan() {
    if (!(await prepareNfcSession())) return;
    setLastUid("");
    setTagDetails(null);
    try {
      setPhase("scanning");
      await requestTechSession();

      const tag = await NfcManager.getTag();
      const uid = await readUid();
      const technology = tag?.techTypes?.join(", ") || "Tidak dilaporkan";
      const androidTag = tag as
        | (typeof tag & { atqa?: string; sak?: string })
        | null;
      const atqa = androidTag?.atqa || "Tidak dilaporkan oleh Android NFC API";
      const sak = androidTag?.sak || "Tidak dilaporkan oleh Android NFC API";

      // Verifikasi apakah tag ini sudah berisi data Wi-Fi & Signature Blitz
      const blitzStatus = await readAndVerifyBlitzTag();

      setLastUid(uid);
      setTagDetails({
        "Status Tag": blitzStatus.ssid ? "✓ TAG TERISI WI-FI" : "Tag Kosong",
        "Protected by Password": blitzStatus.isProtected
          ? "Yes (Hardware Write-Locked)"
          : "No (Unlocked)",
        UID: uid,
        SSID: blitzStatus.ssid || "Belum ada Wi-Fi tersimpan",
        Signature: blitzStatus.signature || "Tidak ada",
        "Tipe Chip": tag?.type || "ISO 14443-A / NTAG215",
        ATQA: String(atqa),
        SAK: String(sak),
        Teknologi: technology,
      });
      setPhase("done");
    } catch (error) {
      handleNfcError(error, "membaca");
    } finally {
      await endSession();
    }
  }

  async function writeTag() {
    if (!wifi) {
      setErrorMsg("Konfigurasi Wi-Fi belum dipilih.");
      setPhase("error");
      return;
    }
    if (!(await prepareNfcSession())) return;
    setLastUid("");
    setTagDetails(null);
    try {
      setPhase("writing");
      await requestTechSession();

      const uid = await readUid();
      setLastUid(uid);

      // Tulis Multi-Record NDEF (Wi-Fi + Blitz ID Marker) & Kunci Hardware
      const result = await writeBlitzTag(
        {
          ssid: wifi.ssid,
          password: wifi.password,
          security: wifi.security,
          hidden: wifi.hidden,
          tagId: `BLITZ-${uid}`,
          businessName: data?.businessName || "Blitz Business",
        },
        data?.pin || "123456",
      );

      if (result.status === "up-to-date") {
        await upsertProvisionedTag({
          uid,
          label: `Tag ${uid.slice(-4)}`,
          wifiConfigId: wifi.id,
          ssid: wifi.ssid,
          status: "active",
          provisionedAt: Date.now(),
          lastVerifiedAt: Date.now(),
        });

        setTagDetails({
          "Status Tag": "✓ DATA SUDAH UP-TO-DATE",
          UID: uid,
          "SSID Wi-Fi": wifi.ssid,
          "Status Penulisan":
            "Dilewati (Data tag sudah identik dengan aplikasi)",
          Pemilik: data?.businessName || "Blitz Business",
        });
      } else {
        // Verifikasi ulang setelah tulis
        const verify = await readAndVerifyBlitzTag();

        setTagDetails({
          "Hasil Provision": "✓ BERHASIL DITULIS & DIKUNCI",
          UID: uid,
          "SSID Wi-Fi": verify.ssid || wifi.ssid,
          "Protected by Password": verify.isProtected
            ? "Yes (Hardware Write-Locked)"
            : "No",
          "Keamanan Wi-Fi": wifi.security,
          Pemilik: data?.businessName || "Blitz Business",
        });
      }
      setPhase("done");
    } catch (error) {
      handleNfcError(error, "menulis ke");
    } finally {
      await endSession();
    }
  }

  function handleNfcError(error: unknown, action: string) {
    const message = error instanceof Error ? error.message : String(error);
    const cancelled =
      message.toLowerCase().includes("cancel") ||
      message.toLowerCase().includes("usercancel") ||
      message.trim() === "";
    if (cancelled) {
      setErrorMsg("");
      setPhase("ready");
    } else {
      console.error(`NFC ${action} failed:`, error);
      setErrorMsg(`Gagal ${action} tag: ${message}`);
      setPhase("error");
    }
  }

  async function endSession() {
    if (activeRef.current) {
      activeRef.current = false;
      await NfcManager.cancelTechnologyRequest().catch(() => undefined);
    }
  }

  const phaseText = {
    ready: "Pilih opsi di bawah lalu tempelkan tag NFC.",
    scanning: "Tempelkan tag untuk membaca…",
    writing: "Tempelkan tag, jangan dilepas saat menulis…",
    done: "Operasi NFC berhasil!",
    error: errorMsg || "Gagal berinteraksi dengan tag.",
    unsupported: errorMsg || "NFC tidak tersedia di perangkat ini.",
  }[phase];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
          <Text style={styles.backLabel}>Kembali</Text>
        </Pressable>
        <Text style={styles.eyebrow}>HARDWARE PROVISIONING</Text>
        <Text style={styles.title}>Kelola Tag{"\n"}NFC Blitz.</Text>
        <Text style={styles.subtitle}>
          Tulis data Wi-Fi + Identitas resmi Blitz ke dalam tag NTAG215 Anda.
        </Text>
        <View style={styles.scanBox}>
          <View
            style={[
              styles.rings,
              (phase === "scanning" || phase === "writing") &&
                styles.ringsActive,
            ]}
          >
            <Text style={styles.nfcGlyph}>⌁</Text>
          </View>
          <Text style={styles.phaseText}>{phaseText}</Text>
        </View>
        {wifi && (
          <View style={styles.network}>
            <Text style={styles.networkLabel}>JARINGAN YANG AKAN DITULIS</Text>
            <Text style={styles.networkName}>
              {wifi.label} · {wifi.ssid} ({wifi.security})
            </Text>
          </View>
        )}
        {(phase === "done" || phase === "error" || phase === "unsupported") && (
          <View style={phase === "done" ? styles.success : styles.warning}>
            <Text
              style={phase === "done" ? styles.successText : styles.warningText}
            >
              {phase === "done" ? `UID: ${lastUid}` : phaseText}
            </Text>
          </View>
        )}
        {phase === "done" && tagDetails && (
          <View style={styles.detailsList}>
            {Object.entries(tagDetails).map(([label, value]) => (
              <View key={label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text selectable style={styles.detailValue}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ flex: 1 }} />

        <View style={styles.actionRow}>
          <Pressable
            disabled={phase === "scanning" || phase === "writing"}
            onPress={scan}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.82 },
              (phase === "scanning" || phase === "writing") && {
                opacity: 0.55,
              },
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {phase === "scanning" ? "Membaca…" : "Baca & Verifikasi"}
            </Text>
          </Pressable>

          <Pressable
            disabled={phase === "scanning" || phase === "writing"}
            onPress={writeTag}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.82 },
              (phase === "scanning" || phase === "writing") && {
                opacity: 0.55,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {phase === "writing" ? "Menulis…" : "Tulis Wi-Fi ke Tag"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Format: Wi-Fi WSC NDEF + application/vnd.blitz.id Marker
        </Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8f4" },
  page: { flex: 1, padding: 24, paddingBottom: 18 },
  back: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 27,
  },
  backText: { color: INK, fontSize: 34, marginRight: 5 },
  backLabel: { color: MUTED, fontSize: 13, fontWeight: "600" },
  eyebrow: {
    color: GREEN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: INK,
    fontSize: 35,
    lineHeight: 41,
    fontWeight: "700",
    letterSpacing: -1,
    marginTop: 10,
  },
  subtitle: { color: MUTED, fontSize: 14, lineHeight: 21, marginTop: 10 },
  scanBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  rings: {
    width: 154,
    height: 154,
    borderRadius: 80,
    borderWidth: 1,
    backgroundColor: "#edf3ed",
    borderColor: "#dbe8dc",
    alignItems: "center",
    justifyContent: "center",
  },
  ringsActive: { borderColor: GREEN, borderWidth: 2 },
  nfcGlyph: { color: GREEN, fontSize: 67, fontWeight: "300" },
  phaseText: {
    maxWidth: 270,
    textAlign: "center",
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 23,
  },
  network: {
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#e7ece7",
  },
  networkLabel: {
    color: "#859188",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  networkName: { color: INK, fontSize: 13, fontWeight: "600", marginTop: 5 },
  success: {
    padding: 12,
    backgroundColor: "#e8f2e9",
    borderRadius: 12,
    marginTop: 12,
  },
  successText: { color: GREEN, fontSize: 12, lineHeight: 17 },
  warning: {
    padding: 12,
    backgroundColor: "#f7eee4",
    borderRadius: 12,
    marginTop: 12,
  },
  warningText: { color: "#855b32", fontSize: 12, lineHeight: 17 },
  detailsList: {
    maxHeight: 205,
    marginTop: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5ebe5",
  },
  detailRow: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0ed",
  },
  detailLabel: { color: MUTED, fontSize: 10, fontWeight: "700", flex: 0.8 },
  detailValue: { color: INK, fontSize: 10, flex: 1.2, textAlign: "right" },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    backgroundColor: "#e2ede3",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: GREEN, fontSize: 14, fontWeight: "700" },
  primaryButton: {
    flex: 1.2,
    height: 52,
    backgroundColor: GREEN,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  button: {
    height: 55,
    backgroundColor: GREEN,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  footer: {
    textAlign: "center",
    color: "#818d84",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 12,
  },
});
