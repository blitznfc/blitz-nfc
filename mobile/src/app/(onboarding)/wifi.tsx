import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  makeWifiConfig,
  savePrototype,
  type PrototypeData,
} from "@/lib/prototype";
import { scanAllNearbyWifi, type DetectedWifi } from "@/lib/wifi-detector";

const INK = "#17221c";
const MUTED = "#69766d";
const GREEN = "#236b45";
const LINE = "#dce5de";

export default function FirstWifiScreen() {
  const { name = "", pin = "" } = useLocalSearchParams<{
    name: string;
    pin: string;
  }>();

  // Step 1: Network Selection, Step 2: Configure Password & Details
  const [step, setStep] = useState<"select" | "configure">("select");
  const [networks, setNetworks] = useState<DetectedWifi[]>([]);
  const [loadingNetworks, setLoadingNetworks] = useState(true);

  // Form states (TANPA auto-fill, user harus memilih dari list)
  const [label, setLabel] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<"WPA2" | "WPA3" | "open">("WPA2");
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    scanNetworks();
  }, []);

  async function scanNetworks() {
    setLoadingNetworks(true);
    try {
      const found = await scanAllNearbyWifi();
      setNetworks(found);
    } catch {
      // ignore
    } finally {
      setLoadingNetworks(false);
    }
  }

  function selectNetwork(net: DetectedWifi) {
    setSsid(net.ssid);
    setSecurity(net.security);
    setLabel(`WiFi ${net.ssid}`);
    setPassword("");
    setStep("configure");
  }

  function chooseManual() {
    setSsid("");
    setPassword("");
    setSecurity("WPA2");
    setLabel("WiFi manual");
    setStep("configure");
  }

  async function finish() {
    if (!label.trim() || !ssid.trim()) {
      setError("Label dan nama jaringan wajib diisi.");
      return;
    }
    if (security !== "open" && !password) {
      setError("Masukkan password WiFi.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const wifi = makeWifiConfig({
        label: label.trim(),
        ssid: ssid.trim(),
        password,
        security,
        hidden,
      });
      const data: PrototypeData = {
        businessName: String(name).trim(),
        pin: String(pin),
        activeWifiId: wifi.id,
        wifiConfigs: [wifi],
      };
      await savePrototype(data);
      router.replace("/(tabs)");
    } catch {
      setError("Belum bisa menyimpan data di perangkat. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topline}>
          <Pressable
            onPress={() => {
              if (step === "configure") {
                setStep("select");
              } else {
                router.back();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.step}>03 / 03</Text>
        </View>
        <View style={styles.progress}>
          <View style={styles.progressFill} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text style={styles.eyebrow}>SATU LANGKAH LAGI</Text>
          <Text style={styles.title}>Jaringan{"\n"}pertamamu.</Text>
          <Text style={styles.subtitle}>
            {step === "select"
              ? "Pilih salah satu jaringan Wi-Fi yang tersedia di sekitarmu."
              : "Masukkan password untuk jaringan yang dipilih."}
          </Text>

          {/* ─── TAHAP 1: SELECTOR LIST SEMUA JARINGAN SEKITAR ──────────── */}
          {step === "select" && (
            <View style={styles.selectorContainer}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeaderLabel}>
                  {loadingNetworks
                    ? "MEMINDAI JARINGAN SEKITAR…"
                    : `DITEMUKAN ${networks.length} JARINGAN WI-FI`}
                </Text>
                <Pressable onPress={scanNetworks} disabled={loadingNetworks}>
                  {loadingNetworks ? (
                    <ActivityIndicator size="small" color={GREEN} />
                  ) : (
                    <Text style={styles.refreshLink}>↻ Pindai Ulang</Text>
                  )}
                </Pressable>
              </View>

              {loadingNetworks && networks.length === 0 ? (
                <View style={styles.scanningCard}>
                  <ActivityIndicator size="small" color={GREEN} />
                  <Text style={styles.scanningText}>
                    Mencari Wi-Fi terdekat…
                  </Text>
                </View>
              ) : networks.length > 0 ? (
                networks.map((net) => (
                  <Pressable
                    key={net.ssid}
                    onPress={() => selectNetwork(net)}
                    style={({ pressed }) => [
                      styles.networkItem,
                      pressed && { backgroundColor: "#eef5ef" },
                    ]}
                  >
                    <View style={styles.networkItemIconBox}>
                      <Text style={styles.networkItemIcon}>⌁</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.networkItemTitleRow}>
                        <Text style={styles.networkItemSsid}>{net.ssid}</Text>
                        {net.isConnected && (
                          <View style={styles.connectedBadge}>
                            <Text style={styles.connectedBadgeText}>
                              TERHUBUNG
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.networkItemSecurity}>
                        Keamanan: {net.security} · Klik untuk pilih
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyNetworkCard}>
                  <Text style={styles.emptyNetworkTitle}>
                    Belum ada Wi-Fi terdeteksi
                  </Text>
                  <Text style={styles.emptyNetworkSub}>
                    Pastikan Wi-Fi dan GPS ponsel aktif, lalu klik Pindai Ulang
                    atau ketik manual.
                  </Text>
                </View>
              )}

              <Pressable onPress={chooseManual} style={styles.manualBtn}>
                <Text style={styles.manualBtnText}>
                  ＋ Masukkan Wi-Fi Lain Secara Manual
                </Text>
              </Pressable>
            </View>
          )}

          {/* ─── TAHAP 2: CONFIGURE PASSWORD & DETAILS ───────────────────── */}
          {step === "configure" && (
            <View style={styles.configContainer}>
              <View style={styles.selectedBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedBannerLabel}>
                    JARINGAN DIPILIH
                  </Text>
                  <Text style={styles.selectedBannerSsid}>
                    {ssid || "Wi-Fi Manual"}
                  </Text>
                </View>
                <Pressable onPress={() => setStep("select")}>
                  <Text style={styles.changeLink}>Ganti Jaringan</Text>
                </Pressable>
              </View>

              {!ssid && (
                <>
                  <Text style={styles.label}>NAMA WI-FI (SSID)</Text>
                  <TextInput
                    value={ssid}
                    onChangeText={setSsid}
                    placeholder="Nama yang terlihat saat scan"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </>
              )}

              <Text style={styles.label}>PASSWORD WI-FI</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Masukkan password Wi-Fi"
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
                autoFocus
              />

              <Text style={styles.label}>LABEL JARINGAN</Text>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="Contoh: WiFi Tamu"
                style={styles.input}
              />

              <Text style={styles.label}>KEAMANAN</Text>
              <View style={styles.segment}>
                {(["WPA2", "WPA3", "open"] as const).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setSecurity(item)}
                    style={[
                      styles.segmentItem,
                      security === item && styles.segmentSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        security === item && styles.segmentTextSelected,
                      ]}
                    >
                      {item === "open" ? "Terbuka" : item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Jaringan tersembunyi</Text>
                  <Text style={styles.switchSub}>
                    SSID tidak disiarkan secara publik
                  </Text>
                </View>
                <Switch
                  value={hidden}
                  onValueChange={setHidden}
                  trackColor={{ false: "#d5ddd6", true: "#84aa91" }}
                  thumbColor={hidden ? GREEN : "#fff"}
                />
              </View>

              {!!error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.securityNote}>
                <Text style={styles.noteTitle}>Data Aman</Text>
                <Text style={styles.noteText}>
                  Password Wi-Fi tersimpan aman di SecureStore ponsel dan siap
                  ditulis ke tag NFC.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {step === "configure" && (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={finish}
            style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.82 },
              busy && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.buttonText}>
              {busy ? "Menyimpan…" : "Selesaikan setup"}{" "}
              <Text style={styles.arrow}>→</Text>
            </Text>
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8f4" },
  page: { flex: 1, paddingHorizontal: 24, paddingBottom: 16 },
  topline: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { color: INK, fontSize: 32 },
  step: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.25,
  },
  progress: {
    height: 3,
    backgroundColor: "#e3eae4",
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: GREEN,
    borderRadius: 2,
  },
  content: { paddingBottom: 24 },
  eyebrow: {
    color: GREEN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: INK,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -1,
    marginTop: 8,
  },
  subtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 16,
  },
  selectorContainer: { marginTop: 8 },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  listHeaderLabel: {
    color: "#839086",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  refreshLink: { color: GREEN, fontSize: 12, fontWeight: "700" },
  scanningCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4ece5",
    gap: 12,
    marginVertical: 10,
  },
  scanningText: { color: MUTED, fontSize: 13 },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4ece5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  networkItemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#edf3ed",
    alignItems: "center",
    justifyContent: "center",
  },
  networkItemIcon: { color: GREEN, fontSize: 22 },
  networkItemTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  networkItemSsid: { color: INK, fontSize: 15, fontWeight: "700" },
  connectedBadge: {
    backgroundColor: "#e2f2e5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  connectedBadgeText: { color: GREEN, fontSize: 8, fontWeight: "800" },
  networkItemSecurity: { color: MUTED, fontSize: 11, marginTop: 3 },
  chevron: { color: "#a2ada4", fontSize: 20 },
  emptyNetworkCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ece7",
    padding: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  emptyNetworkTitle: { color: INK, fontSize: 14, fontWeight: "600" },
  emptyNetworkSub: { color: MUTED, fontSize: 12, lineHeight: 17, marginTop: 4 },
  manualBtn: {
    height: 48,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#b8c9bc",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f5f1",
    marginTop: 6,
  },
  manualBtnText: { color: GREEN, fontSize: 13, fontWeight: "700" },
  configContainer: { marginTop: 6 },
  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e8f4eb",
    borderColor: "#cbe5d2",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  selectedBannerLabel: {
    color: GREEN,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  selectedBannerSsid: {
    color: INK,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  changeLink: { color: GREEN, fontSize: 12, fontWeight: "700" },
  label: {
    color: "#839086",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: INK,
    fontSize: 14,
    marginBottom: 10,
  },
  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  segmentItem: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentSelected: { backgroundColor: GREEN },
  segmentText: { color: MUTED, fontSize: 12, fontWeight: "600" },
  segmentTextSelected: { color: "#fff", fontWeight: "700" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 14,
  },
  switchTitle: { color: INK, fontSize: 14, fontWeight: "600" },
  switchSub: { color: MUTED, fontSize: 11, marginTop: 2 },
  error: { color: "#a13222", fontSize: 12, marginTop: 8 },
  securityNote: {
    backgroundColor: "#edf1ee",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  noteTitle: { color: INK, fontSize: 12, fontWeight: "700" },
  noteText: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 3 },
  button: {
    height: 52,
    backgroundColor: GREEN,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  arrow: { fontSize: 16 },
});
