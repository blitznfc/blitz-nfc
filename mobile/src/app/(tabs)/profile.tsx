import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  loadPrototype,
  savePrototype,
  type PrototypeData,
} from "@/lib/prototype";

const GREEN = "#236b45",
  INK = "#17221c",
  MUTED = "#69766d",
  LINE = "#dce5de";

export default function ProfileScreen() {
  const [data, setData] = useState<PrototypeData | null>(null);

  // Edit Business Name Modal
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [businessNameInput, setBusinessNameInput] = useState("");

  // Edit PIN Modal
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");

  const refresh = useCallback(() => {
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

  function openEditName() {
    setBusinessNameInput(data?.businessName || "");
    setNameModalVisible(true);
  }

  async function handleSaveBusinessName() {
    if (!businessNameInput.trim()) {
      Alert.alert("Error", "Nama usaha tidak boleh kosong.");
      return;
    }
    if (!data) return;

    const next: PrototypeData = {
      ...data,
      businessName: businessNameInput.trim(),
    };
    await savePrototype(next);
    setData(next);
    setNameModalVisible(false);
    Alert.alert("Sukses", "Nama usaha berhasil diperbarui.");
  }

  function openEditPin() {
    setCurrentPinInput("");
    setNewPinInput("");
    setConfirmPinInput("");
    setPinModalVisible(true);
  }

  async function handleSaveNewPin() {
    if (!data) return;

    // Validate current PIN
    if (!currentPinInput) {
      Alert.alert("PIN Diperlukan", "Masukkan PIN saat ini terlebih dahulu.");
      return;
    }
    if (currentPinInput !== data.pin) {
      Alert.alert("PIN Salah", "PIN saat ini yang Anda masukkan tidak sesuai.");
      return;
    }

    // Validate new PIN format
    if (
      !newPinInput ||
      newPinInput.length !== 6 ||
      !/^\d{6}$/.test(newPinInput)
    ) {
      Alert.alert(
        "Format PIN Baru Salah",
        "PIN baru harus terdiri dari 6 angka.\nSaat ini: " +
          (newPinInput.length || 0) +
          " karakter",
      );
      return;
    }

    // Validate confirmation
    if (!confirmPinInput || newPinInput !== confirmPinInput) {
      Alert.alert(
        "Konfirmasi Gagal",
        "PIN baru dan konfirmasi tidak cocok.\nPastikan kedua PIN sama.",
      );
      return;
    }

    const next: PrototypeData = {
      ...data,
      pin: newPinInput,
    };
    await savePrototype(next);
    setData(next);
    setPinModalVisible(false);
    Alert.alert(
      "PIN Berhasil Diperbarui",
      "PIN keamanan baru telah aktif. Tag di meja akan otomatis beralih ke kunci baru saat di-tap berikutnya.",
    );
  }

  function handleResetApp() {
    Alert.alert(
      "Reset Data Prototype",
      "Hapus seluruh data konfigurasi usaha, Wi-Fi, dan tag dari perangkat ini untuk memulai ulang setup?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset Sekarang",
          style: "destructive",
          onPress: async () => {
            const empty: PrototypeData = {
              businessName: "",
              pin: "",
              activeWifiId: "",
              wifiConfigs: [],
              tags: [],
            };
            await savePrototype(empty);
            router.replace("/(onboarding)/profile");
          },
        },
      ],
    );
  }

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>PENGATURAN</Text>
        <Text style={styles.title}>Profil & Keamanan</Text>
        <Text style={styles.subtitle}>
          Kelola identitas usaha dan proteksi PIN tag Blitz Anda.
        </Text>

        {/* ─── KARTU INFO BISNIS ────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>
                {data.businessName
                  ? data.businessName.slice(0, 1).toUpperCase()
                  : "B"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>NAMA USAHA</Text>
              <Text style={styles.cardValue}>{data.businessName}</Text>
            </View>
            <Pressable onPress={openEditName} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Ubah</Text>
            </Pressable>
          </View>
        </View>

        {/* ─── KARTU KEAMANAN PIN ───────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.avatarBox, { backgroundColor: "#eef2f8" }]}>
              <Text style={[styles.avatarText, { color: "#2b5c92" }]}>🔒</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>PIN KEAMANAN TAG</Text>
              <Text style={styles.cardValue}>•••••• (6 Digit Aktif)</Text>
              <Text style={styles.cardSub}>
                Digunakan sistem otomatis untuk proteksi write-lock tag NFC
              </Text>
            </View>
            <Pressable onPress={openEditPin} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Ganti PIN</Text>
            </Pressable>
          </View>
        </View>

        {/* ─── INFO HARDWARE & STATISTIK ───────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
          Informasi Perangkat
        </Text>
        <View style={styles.statsBox}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Tag Diprogram</Text>
            <Text style={styles.statValue}>{data.tags?.length || 0} Tag</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Profil Wi-Fi</Text>
            <Text style={styles.statValue}>
              {data.wifiConfigs.length} Jaringan
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Metode Proteksi</Text>
            <Text style={styles.statValue}>Hardware HMAC-SHA256 (PWD)</Text>
          </View>
        </View>

        {/* ─── RESET BUTTON ────────────────────────────────────────────── */}
        <Pressable onPress={handleResetApp} style={styles.resetBtn}>
          <Text style={styles.resetBtnText}>Reset Seluruh Data Aplikasi</Text>
        </Pressable>
      </ScrollView>

      {/* ─── MODAL UBAH NAMA USAHA ────────────────────────────────────── */}
      <Modal visible={nameModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ubah Nama Usaha</Text>
              <Pressable onPress={() => setNameModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>NAMA USAHA BARU</Text>
            <TextInput
              value={businessNameInput}
              onChangeText={setBusinessNameInput}
              placeholder="Contoh: Kopi Kulo"
              style={styles.modalInput}
              autoFocus
            />
            <Pressable onPress={handleSaveBusinessName} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL GANTI PIN ─────────────────────────────────────────── */}
      <Modal visible={pinModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ganti PIN Keamanan</Text>
              <Pressable onPress={() => setPinModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>PIN SAAT INI</Text>
            <TextInput
              value={currentPinInput}
              onChangeText={setCurrentPinInput}
              placeholder="Masukkan 6 digit PIN lama"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              style={styles.modalInput}
            />
            <Text style={styles.inputLabel}>PIN BARU (6 DIGIT)</Text>
            <TextInput
              value={newPinInput}
              onChangeText={setNewPinInput}
              placeholder="Masukkan 6 digit PIN baru"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              style={styles.modalInput}
            />
            <Text style={styles.inputLabel}>KONFIRMASI PIN BARU</Text>
            <TextInput
              value={confirmPinInput}
              onChangeText={setConfirmPinInput}
              placeholder="Ulangi 6 digit PIN baru"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              style={styles.modalInput}
            />
            <Pressable onPress={handleSaveNewPin} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Simpan PIN Baru</Text>
            </Pressable>
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4ebe4",
    padding: 16,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#e5eee6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: GREEN, fontSize: 20, fontWeight: "800" },
  cardLabel: {
    color: "#839086",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  cardValue: {
    color: INK,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  cardSub: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#edf3ee",
  },
  actionBtnText: { color: GREEN, fontSize: 12, fontWeight: "700" },
  sectionTitle: {
    color: INK,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  statsBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4ebe4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  statLabel: { color: MUTED, fontSize: 13 },
  statValue: { color: INK, fontSize: 13, fontWeight: "700" },
  statDivider: { height: 1, backgroundColor: "#edf0ed" },
  resetBtn: {
    height: 48,
    borderWidth: 1,
    borderColor: "#f5c6cb",
    backgroundColor: "#fff8f8",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  resetBtnText: { color: "#c0392b", fontSize: 13, fontWeight: "700" },
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
  inputLabel: {
    color: "#839086",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 10,
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#fbfcfb",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: INK,
    fontSize: 14,
    marginBottom: 8,
  },
  saveBtn: {
    height: 50,
    backgroundColor: GREEN,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
