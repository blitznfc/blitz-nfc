import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  loadPrototype,
  makeWifiQrPayload,
  type PrototypeData,
  type WifiConfig,
} from "@/lib/prototype";

const INK = "#17221c",
  MUTED = "#69766d",
  GREEN = "#236b45";
export default function WifiQrScreen() {
  const [data, setData] = useState<PrototypeData | null>(null);
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
  const wifi: WifiConfig | undefined = data?.wifiConfigs.find(
    (item) => item.id === data.activeWifiId,
  );
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </Pressable>
        <Text style={styles.eyebrow}>AKSES TAMU</Text>
        <Text style={styles.title}>Bagikan WiFi{"\n"}dengan mudah.</Text>
        <Text style={styles.subtitle}>
          Tamu dapat memindai kode ini dengan kamera untuk bergabung ke
          jaringan.
        </Text>
        {wifi ? (
          <>
            <View style={styles.qrCard}>
              <QRCode
                value={makeWifiQrPayload(wifi)}
                size={214}
                color={INK}
                backgroundColor="#fff"
                quietZone={12}
              />
            </View>
            <Text style={styles.network}>{wifi.label}</Text>
            <Text style={styles.ssid}>{wifi.ssid}</Text>
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>QR mengandung kredensial</Text>
              <Text style={styles.noticeText}>
                Siapa pun yang memindai kode dapat memperoleh akses WiFi.
                Bagikan hanya kepada tamu yang kamu percaya.
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.subtitle}>Setup WiFi belum tersedia.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8f4" },
  page: { padding: 23, alignItems: "center" },
  back: {
    alignSelf: "flex-start",
    height: 42,
    justifyContent: "center",
    marginBottom: 18,
  },
  backText: { color: MUTED, fontSize: 14, fontWeight: "600" },
  eyebrow: {
    color: GREEN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    alignSelf: "flex-start",
  },
  title: {
    alignSelf: "flex-start",
    color: INK,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginTop: 8,
  },
  subtitle: {
    alignSelf: "flex-start",
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  qrCard: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e6ebe6",
    shadowColor: "#23352a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  network: { color: INK, fontSize: 18, fontWeight: "700", marginTop: 22 },
  ssid: { color: MUTED, fontSize: 13, marginTop: 5 },
  notice: {
    width: "100%",
    padding: 14,
    backgroundColor: "#edf2ed",
    borderRadius: 13,
    marginTop: 25,
  },
  noticeTitle: {
    color: GREEN,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 5,
  },
  noticeText: { color: MUTED, fontSize: 11, lineHeight: 17 },
});
