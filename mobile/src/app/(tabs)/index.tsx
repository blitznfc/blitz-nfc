import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  loadPrototype,
  removeProvisionedTag,
  type PrototypeData,
  type ProvisionedTag,
  type WifiConfig,
} from "@/lib/prototype";

const GREEN = "#236b45";
const INK = "#17221c";
const MUTED = "#69766d";

export default function HomeScreen() {
  const [data, setData] = useState<PrototypeData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    loadPrototype().then((value) => {
      setData(value);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadPrototype().then((value) => {
        if (active) {
          setData(value);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const wifi: WifiConfig | undefined = data?.wifiConfigs.find(
    (item) => item.id === data.activeWifiId,
  );
  const tags: ProvisionedTag[] = data?.tags || [];

  function handleDeleteTag(tag: ProvisionedTag) {
    Alert.alert(
      "Hapus Tag",
      `Hapus ${tag.label} (${tag.uid}) dari daftar usaha Anda?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await removeProvisionedTag(tag.uid);
            refresh();
          },
        },
      ],
    );
  }

  if (loading)
    return (
      <View style={styles.loading}>
        <Text style={styles.muted}>Memuat…</Text>
      </View>
    );
  if (!data || !wifi)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.eyebrow}>BLITZ · SETUP</Text>
          <Text style={styles.title}>
            Mulai dengan{"\n"}jaringan pertamamu.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => router.replace("/(onboarding)/profile")}
          >
            <Text style={styles.buttonText}>Mulai setup</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>BLITZ · RUANG USAHA</Text>
            <Text style={styles.greeting}>Halo, {data.businessName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {data.businessName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.activeLine}>
          <View style={styles.liveDot} />
          <Text style={styles.activeText}>JARINGAN AKTIF</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/wifi")}
            accessibilityRole="button"
          >
            <Text style={styles.switchLink}>Ganti</Text>
          </Pressable>
        </View>

        <View style={styles.wifiCard}>
          <View style={styles.wifiGlyph}>
            <Text style={styles.wifiGlyphText}>⌁</Text>
          </View>
          <Text style={styles.wifiName}>{wifi.label}</Text>
          <Text style={styles.ssid}>{wifi.ssid}</Text>
          <View style={styles.cardDivider} />
          <View style={styles.details}>
            <Text style={styles.detailLabel}>KEAMANAN</Text>
            <Text style={styles.detailValue}>
              {wifi.security === "open" ? "Terbuka" : wifi.security}
            </Text>
            <Text style={[styles.detailLabel, { marginTop: 13 }]}>
              TAG DIPASANG
            </Text>
            <Text style={styles.detailValue}>
              {tags.length > 0 ? `${tags.length} Tag Aktif` : "Belum ada tag"}
            </Text>
          </View>
        </View>

        {/* ─── DAFTAR TAG AKTIF ────────────────────────────────────────── */}
        <View style={styles.tagHeaderRow}>
          <Text style={styles.sectionTitle}>Tag NFC Terpasang</Text>
          <Pressable
            onPress={() => router.push("/provision")}
            accessibilityRole="button"
          >
            <Text style={styles.addTagLink}>+ Tulis Tag</Text>
          </Pressable>
        </View>

        {tags.length === 0 ? (
          <View style={styles.emptyTagCard}>
            <Text style={styles.emptyTagTitle}>
              Belum ada tag yang diprogram
            </Text>
            <Text style={styles.emptyTagSub}>
              Program tag NTAG215 pertama Anda agar pelanggan bisa langsung tap
              untuk konek Wi-Fi.
            </Text>
          </View>
        ) : (
          <View style={styles.tagList}>
            {tags.map((tag) => {
              // Cek apakah data tag masih sinkron dengan Wi-Fi aktif
              const isOutdated = tag.ssid !== wifi.ssid;

              return (
                <View
                  key={tag.uid}
                  style={[styles.tagCard, isOutdated && styles.tagCardOutdated]}
                >
                  <View
                    style={[
                      styles.tagIconBox,
                      isOutdated && styles.tagIconBoxOutdated,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagIconText,
                        isOutdated && { color: "#b36b00" },
                      ]}
                    >
                      {isOutdated ? "!" : "⌁"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.tagTitleRow}>
                      <Text style={styles.tagLabel}>{tag.label}</Text>
                      <View
                        style={
                          isOutdated
                            ? styles.tagOutdatedBadge
                            : styles.tagActiveBadge
                        }
                      >
                        <Text
                          style={
                            isOutdated
                              ? styles.tagOutdatedBadgeText
                              : styles.tagActiveBadgeText
                          }
                        >
                          {isOutdated ? "PERLU UPDATE" : "AKTIF"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tagUid}>UID: {tag.uid}</Text>
                    <Text
                      style={[
                        styles.tagWifi,
                        isOutdated && { color: "#995c00" },
                      ]}
                    >
                      {isOutdated
                        ? `Wi-Fi lama: ${tag.ssid} → ${wifi.ssid}`
                        : `Wi-Fi: ${tag.ssid}`}
                    </Text>
                  </View>

                  {isOutdated && (
                    <Pressable
                      onPress={() => router.push("/provision")}
                      style={styles.updateTagQuickBtn}
                    >
                      <Text style={styles.updateTagQuickBtnText}>Update</Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => handleDeleteTag(tag)}
                    style={({ pressed }) => [
                      styles.deleteTagBtn,
                      pressed && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.deleteTagBtnText}>✕</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Aksi Cepat</Text>
        <Text style={styles.sectionSub}>
          Kelola perangkat dan kartu akses tamu Anda.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/provision")}
          style={({ pressed }) => [
            styles.primary,
            pressed && { opacity: 0.82 },
          ]}
        >
          <Text style={styles.primaryIcon}>⌁</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryTitle}>Tulis / Verifikasi Tag NFC</Text>
            <Text style={styles.primarySub}>
              Program Wi-Fi ke tag fisik NTAG215
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/qr")}
          style={styles.secondary}
        >
          <Text style={styles.secondaryIcon}>▦</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.secondaryTitle}>Lihat QR WiFi</Text>
            <Text style={styles.secondarySub}>Pratinjau kode untuk tamu</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <View style={styles.footerNote}>
          <Text style={styles.noteMark}>i</Text>
          <Text style={styles.noteText}>
            Mode prototype: Data Wi-Fi dan Tag tersimpan di SecureStore
            perangkat ini.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8f4" },
  page: { paddingHorizontal: 22, paddingBottom: 24 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f8f4",
  },
  muted: { color: MUTED },
  empty: { flex: 1, padding: 24, justifyContent: "center" },
  title: {
    color: INK,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -1,
    marginTop: 10,
    marginBottom: 20,
  },
  button: {
    height: 52,
    backgroundColor: GREEN,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  header: {
    paddingTop: 20,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: GREEN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  greeting: {
    color: INK,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginTop: 6,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#e5eee6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: GREEN, fontSize: 18, fontWeight: "800" },
  activeLine: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4b9b68",
    marginRight: 8,
  },
  activeText: {
    flex: 1,
    color: MUTED,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.25,
  },
  switchLink: { color: GREEN, fontSize: 13, fontWeight: "700", padding: 5 },
  wifiCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8ece7",
    borderRadius: 18,
    padding: 19,
    shadowColor: "#23352a",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  wifiGlyph: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#edf3ed",
    alignItems: "center",
    justifyContent: "center",
  },
  wifiGlyphText: { color: GREEN, fontSize: 24 },
  wifiName: {
    color: INK,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 14,
  },
  ssid: { color: MUTED, fontSize: 13, marginTop: 4 },
  cardDivider: {
    height: 1,
    backgroundColor: "#edf0ed",
    marginVertical: 14,
  },
  details: { marginTop: 4 },
  detailLabel: {
    color: "#838f86",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  detailValue: { color: INK, fontSize: 13, fontWeight: "600", marginTop: 4 },
  tagHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 4,
  },
  sectionTitle: {
    color: INK,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  addTagLink: { color: GREEN, fontSize: 13, fontWeight: "700" },
  sectionSub: { color: MUTED, fontSize: 13, marginTop: 4, marginBottom: 12 },
  emptyTagCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ece7",
    padding: 16,
    marginTop: 6,
  },
  emptyTagTitle: { color: INK, fontSize: 14, fontWeight: "600" },
  emptyTagSub: { color: MUTED, fontSize: 12, lineHeight: 17, marginTop: 4 },
  tagList: { gap: 10, marginTop: 6 },
  tagCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ece7",
    padding: 14,
    gap: 12,
  },
  tagCardOutdated: {
    borderColor: "#f5d79e",
    backgroundColor: "#fffdf9",
  },
  tagIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#edf3ed",
    alignItems: "center",
    justifyContent: "center",
  },
  tagIconBoxOutdated: {
    backgroundColor: "#fef3dd",
  },
  tagIconText: { color: GREEN, fontSize: 18 },
  tagTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tagLabel: { color: INK, fontSize: 14, fontWeight: "700" },
  tagActiveBadge: {
    backgroundColor: "#e2f2e5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagActiveBadgeText: { color: GREEN, fontSize: 8, fontWeight: "800" },
  tagOutdatedBadge: {
    backgroundColor: "#fde8c5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagOutdatedBadgeText: { color: "#995c00", fontSize: 8, fontWeight: "800" },
  tagUid: { color: MUTED, fontSize: 11, fontFamily: "monospace", marginTop: 2 },
  tagWifi: { color: INK, fontSize: 11, marginTop: 1 },
  updateTagQuickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f59e0b",
    borderRadius: 8,
  },
  updateTagQuickBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  deleteTagBtn: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteTagBtnText: { color: "#a5b0a7", fontSize: 14, fontWeight: "700" },
  primary: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4ebe4",
    padding: 16,
  },
  primaryIcon: { color: GREEN, fontSize: 24, marginRight: 14 },
  primaryTitle: { color: INK, fontSize: 14, fontWeight: "700" },
  primarySub: { color: MUTED, fontSize: 12, marginTop: 2 },
  secondary: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4ebe4",
    padding: 16,
  },
  secondaryIcon: { color: GREEN, fontSize: 20, marginRight: 14 },
  secondaryTitle: { color: INK, fontSize: 14, fontWeight: "700" },
  secondarySub: { color: MUTED, fontSize: 12, marginTop: 2 },
  chevron: { color: "#a2ada4", fontSize: 20, marginLeft: 8 },
  footerNote: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    backgroundColor: "#edf1ee",
    borderRadius: 12,
  },
  noteMark: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "800",
    width: 16,
    textAlign: "center",
    marginRight: 6,
  },
  noteText: { flex: 1, color: MUTED, fontSize: 11, lineHeight: 16 },
});
