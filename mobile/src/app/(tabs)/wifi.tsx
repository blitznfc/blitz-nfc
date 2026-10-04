import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  deleteWifiConfig,
  loadPrototype,
  makeWifiConfig,
  savePrototype,
  updateWifiConfig,
  type PrototypeData,
  type WifiConfig,
} from "@/lib/prototype";
import { scanAllNearbyWifi, type DetectedWifi } from "@/lib/wifi-detector";

const GREEN = "#236b45",
  INK = "#17221c",
  MUTED = "#69766d",
  LINE = "#dce5de";

export default function WifiListScreen() {
  const [data, setData] = useState<PrototypeData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<"select" | "configure">("select");
  const [availableNetworks, setAvailableNetworks] = useState<DetectedWifi[]>(
    [],
  );
  const [scanning, setScanning] = useState(false);

  // Edit states
  const [editingWifiId, setEditingWifiId] = useState<string | null>(null);

  // Form states
  const [label, setLabel] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<"WPA2" | "WPA3" | "open">("WPA2");
  const [hidden, setHidden] = useState(false);

  const refreshData = useCallback(() => {
    loadPrototype().then(setData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadPrototype().then((value) => {
        if (active) setData(value);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  async function activate(id: string) {
    if (!data) return;
    const next = { ...data, activeWifiId: id };
    await savePrototype(next);
    setData(next);
  }

  function openEditModal(wifi: WifiConfig) {
    setEditingWifiId(wifi.id);
    setSsid(wifi.ssid);
    setPassword(wifi.password);
    setLabel(wifi.label);
    setSecurity(wifi.security);
    setHidden(wifi.hidden);
    setModalStep("configure");
    setModalVisible(true);
  }

  function handleDeleteWifi(wifi: WifiConfig) {
    if (data?.wifiConfigs.length === 1) {
      Alert.alert(
        "Perhatian",
        "Usaha Anda minimal harus memiliki satu jaringan Wi-Fi.",
      );
      return;
    }
    Alert.alert(
      "Hapus Jaringan",
      `Hapus konfigurasi ${wifi.label} (${wifi.ssid})?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await deleteWifiConfig(wifi.id);
            refreshData();
          },
        },
      ],
    );
  }

  async function handleScanNetworks() {
    setScanning(true);
    try {
      const list = await scanAllNearbyWifi();
      setAvailableNetworks(list);
    } catch {
      // ignore
    } finally {
      setScanning(false);
    }
  }

  function openAddModal() {
    setEditingWifiId(null);
    setSsid("");
    setPassword("");
    setLabel("");
    setSecurity("WPA2");
    setHidden(false);
    setModalStep("select");
    setModalVisible(true);
    handleScanNetworks();
  }

  function handleSelectNetwork(net: DetectedWifi) {
    setSsid(net.ssid);
    setSecurity(net.security);
    setLabel(`WiFi ${net.ssid}`);
    setModalStep("configure");
  }

  function handleManualInput() {
    setSsid("");
    setPassword("");
    setLabel("WiFi Manual");
    setSecurity("WPA2");
    setModalStep("configure");
  }

  async function handleSaveNewWifi() {
    if (!ssid.trim()) {
      Alert.alert("Error", "Nama Wi-Fi (SSID) tidak boleh kosong.");
      return;
    }
    if (security !== "open" && !password) {
      Alert.alert("Error", "Password Wi-Fi wajib diisi.");
      return;
    }
    if (!data) return;

    if (editingWifiId) {
      // Mode Edit / Ganti Password Wi-Fi
      await updateWifiConfig(editingWifiId, {
        label: label.trim() || ssid.trim(),
        ssid: ssid.trim(),
        password,
        security,
        hidden,
      });
      refreshData();
      setModalVisible(false);
      return;
    }

    // Mode Tambah Jaringan Baru
    const newWifi = makeWifiConfig({
      label: label.trim() || ssid.trim(),
      ssid: ssid.trim(),
      password,
      security,
      hidden,
    });

    const next: PrototypeData = {
      ...data,
      activeWifiId: newWifi.id,
      wifiConfigs: [...data.wifiConfigs, newWifi],
    };

    await savePrototype(next);
    setData(next);
    setModalVisible(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>KONEKSI</Text>
        <Text style={styles.title}>Jaringan WiFi</Text>
        <Text style={styles.subtitle}>
          Pilih jaringan aktif atau kelola password Wi-Fi usaha Anda.
        </Text>
        {data?.wifiConfigs.map((wifi) => {
          const active = wifi.id === data.activeWifiId;
          return (
            <View
              key={wifi.id}
              style={[styles.row, active && styles.rowActive]}
            >
              <Pressable
                onPress={() => activate(wifi.id)}
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <View style={[styles.icon, active && styles.iconActive]}>
                  <Text style={[styles.iconText, active && { color: "#fff" }]}>
                    ⌁
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{wifi.label}</Text>
                  <Text style={styles.ssid}>
                    {wifi.ssid} ·{" "}
                    {wifi.security === "open" ? "Terbuka" : wifi.security}
                  </Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
              </Pressable>

              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => openEditModal(wifi)}
                  style={styles.editActionBtn}
                >
                  <Text style={styles.editActionText}>Edit</Text>
                </Pressable>
                {data.wifiConfigs.length > 1 && (
                  <Pressable
                    onPress={() => handleDeleteWifi(wifi)}
                    style={styles.deleteActionBtn}
                  >
                    <Text style={styles.deleteActionText}>✕</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
        <Pressable onPress={openAddModal} style={styles.add}>
          <Text style={styles.addMark}>＋</Text>
          <Text style={styles.addText}>Tambah jaringan baru</Text>
        </Pressable>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Catatan Pembaruan Wi-Fi</Text>
          <Text style={styles.noticeText}>
            Jika Anda mengubah password Wi-Fi di sini, tag di meja akan ditandai
            "Perlu Diperbarui" di Dashboard sampai Anda men-tap tag tersebut.
          </Text>
        </View>
      </ScrollView>

      {/* ─── MODAL DUA TAHAP: SELECTOR JARINGAN -> INPUT PASSWORD ───── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {modalStep === "configure" && !editingWifiId && (
                  <Pressable
                    onPress={() => setModalStep("select")}
                    style={{ paddingRight: 4 }}
                  >
                    <Text style={{ fontSize: 20, color: INK }}>‹</Text>
                  </Pressable>
                )}
                <Text style={styles.modalTitle}>
                  {editingWifiId
                    ? "Edit Konfigurasi Wi-Fi"
                    : modalStep === "select"
                      ? "Pilih Jaringan Wi-Fi"
                      : "Konfigurasi Password"}
                </Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            <ScrollView>
              {/* TAHAP 1: SELECTOR LIST */}
              {modalStep === "select" && (
                <View>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>
                      {scanning
                        ? "MEMINDAI JARINGAN SEKITAR…"
                        : `DITEMUKAN ${availableNetworks.length} JARINGAN`}
                    </Text>
                    <Pressable onPress={handleScanNetworks} disabled={scanning}>
                      {scanning ? (
                        <ActivityIndicator size="small" color={GREEN} />
                      ) : (
                        <Text style={styles.detectLink}>↻ Pindai Ulang</Text>
                      )}
                    </Pressable>
                  </View>

                  {scanning && availableNetworks.length === 0 ? (
                    <View style={styles.scanningCard}>
                      <ActivityIndicator size="small" color={GREEN} />
                      <Text style={styles.scanningText}>
                        Mencari Wi-Fi terdekat…
                      </Text>
                    </View>
                  ) : availableNetworks.length > 0 ? (
                    availableNetworks.map((net) => (
                      <Pressable
                        key={net.ssid}
                        onPress={() => handleSelectNetwork(net)}
                        style={({ pressed }) => [
                          styles.networkSelectItem,
                          pressed && { backgroundColor: "#eef5ef" },
                        ]}
                      >
                        <View style={styles.networkSelectIconBox}>
                          <Text style={styles.networkSelectIcon}>⌁</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Text style={styles.networkSelectSsid}>
                              {net.ssid}
                            </Text>
                            {net.isConnected && (
                              <View style={styles.connectedBadge}>
                                <Text style={styles.connectedBadgeText}>
                                  TERHUBUNG
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.networkSelectSub}>
                            Keamanan: {net.security} · Klik untuk pilih
                          </Text>
                        </View>
                        <Text style={{ color: "#a2ada4", fontSize: 18 }}>
                          ›
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyTitle}>
                        Belum ada Wi-Fi terdeteksi
                      </Text>
                      <Text style={styles.emptySub}>
                        Pastikan Wi-Fi aktif atau gunakan opsi input manual di
                        bawah.
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={handleManualInput}
                    style={styles.manualSelectBtn}
                  >
                    <Text style={styles.manualSelectBtnText}>
                      ＋ Masukkan Wi-Fi Lain Manual
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* TAHAP 2: INPUT PASSWORD */}
              {modalStep === "configure" && (
                <View>
                  <View style={styles.selectedBanner}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedBannerLabel}>
                        JARINGAN DIPILIH
                      </Text>
                      <Text style={styles.selectedBannerSsid}>
                        {ssid || "Wi-Fi Manual"}
                      </Text>
                    </View>
                    <Pressable onPress={() => setModalStep("select")}>
                      <Text style={styles.changeLink}>Ganti</Text>
                    </Pressable>
                  </View>

                  {!ssid && (
                    <>
                      <Text style={styles.inputLabel}>NAMA WI-FI (SSID)</Text>
                      <TextInput
                        value={ssid}
                        onChangeText={setSsid}
                        placeholder="SSID Wi-Fi"
                        autoCapitalize="none"
                        style={styles.modalInput}
                      />
                    </>
                  )}

                  <Text style={styles.inputLabel}>PASSWORD WI-FI</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Masukkan password"
                    secureTextEntry
                    autoCapitalize="none"
                    style={styles.modalInput}
                    autoFocus
                  />

                  <Text style={styles.inputLabel}>LABEL</Text>
                  <TextInput
                    value={label}
                    onChangeText={setLabel}
                    placeholder="Contoh: WiFi Kasir"
                    style={styles.modalInput}
                  />

                  <View style={styles.switchRow}>
                    <Text style={styles.switchTitle}>Jaringan Tersembunyi</Text>
                    <Switch
                      value={hidden}
                      onValueChange={setHidden}
                      trackColor={{ false: "#d5ddd6", true: "#84aa91" }}
                      thumbColor={hidden ? GREEN : "#fff"}
                    />
                  </View>

                  <Pressable onPress={handleSaveNewWifi} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Simpan & Aktifkan</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8f4" },
  page: { padding: 22, paddingTop: 26 },
  eyebrow: {
    color: GREEN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: INK,
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.7,
    marginTop: 7,
  },
  subtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 22,
  },
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4ebe4",
    padding: 16,
    marginBottom: 10,
    gap: 8,
  },
  rowActive: { borderColor: GREEN, borderWidth: 1.5 },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  editActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#edf3ee",
  },
  editActionText: { color: GREEN, fontSize: 11, fontWeight: "700" },
  deleteActionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#faecea",
  },
  deleteActionText: { color: "#c0392b", fontSize: 12, fontWeight: "700" },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#edf3ed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconActive: { backgroundColor: GREEN },
  iconText: { color: GREEN, fontSize: 20 },
  name: { color: INK, fontSize: 15, fontWeight: "700" },
  ssid: { color: MUTED, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#c9d6cb",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: GREEN },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GREEN,
  },
  add: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#b6c7b9",
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: "#f0f5f1",
  },
  addMark: { color: GREEN, fontSize: 18, marginRight: 6 },
  addText: { color: GREEN, fontSize: 14, fontWeight: "700" },
  notice: {
    backgroundColor: "#edf1ee",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  noticeTitle: { color: INK, fontSize: 12, fontWeight: "700" },
  noticeText: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 3 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { color: INK, fontSize: 18, fontWeight: "700" },
  closeBtn: { color: MUTED, fontSize: 18, padding: 4 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  inputLabel: {
    color: "#839086",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 8,
    marginBottom: 4,
  },
  detectLink: { color: GREEN, fontSize: 11, fontWeight: "700" },
  networkSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4ece5",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  networkSelectIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#edf3ed",
    alignItems: "center",
    justifyContent: "center",
  },
  networkSelectIcon: { color: GREEN, fontSize: 18 },
  networkSelectSsid: { color: INK, fontSize: 14, fontWeight: "700" },
  connectedBadge: {
    backgroundColor: "#e2f2e5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  connectedBadgeText: { color: GREEN, fontSize: 8, fontWeight: "800" },
  scanningCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f7f9f7",
    borderRadius: 12,
    gap: 10,
    marginVertical: 8,
  },
  scanningText: { color: MUTED, fontSize: 12 },
  networkSelectSub: { color: MUTED, fontSize: 11, marginTop: 2 },
  emptyCard: {
    backgroundColor: "#f7f9f7",
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
  },
  emptyTitle: { color: INK, fontSize: 13, fontWeight: "600" },
  emptySub: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 2 },
  manualSelectBtn: {
    height: 46,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#b8c9bc",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f5f1",
    marginTop: 6,
    marginBottom: 10,
  },
  manualSelectBtnText: { color: GREEN, fontSize: 12, fontWeight: "700" },
  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e8f4eb",
    borderColor: "#cbe5d2",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#fbfcfb",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: INK,
    fontSize: 14,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  switchTitle: { color: INK, fontSize: 13, fontWeight: "600" },
  saveBtn: {
    height: 50,
    backgroundColor: GREEN,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
