import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INK = "#17221c";
const MUTED = "#69766d";
const GREEN = "#236b45";
const LINE = "#dce5de";

export default function BusinessPinScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  function next() {
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN harus terdiri dari 6 angka.");
      return;
    }
    if (pin !== confirm) {
      setError("PIN belum cocok. Periksa kembali.");
      return;
    }
    router.push({
      pathname: "/(onboarding)/wifi",
      params: { name: name ?? "", pin },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topline}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.step}>02 / 03</Text>
        </View>
        <View style={styles.progress}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>AMAN DI BALIK LAYAR</Text>
          <Text style={styles.title}>Buat PIN{"\n"}untuk tag-mu.</Text>
          <Text style={styles.subtitle}>
            PIN dipakai untuk mengunci tag. Jangan gunakan PIN ATM atau tanggal
            lahir.
          </Text>
          <Text style={styles.label}>PIN 6 ANGKA</Text>
          <TextInput
            value={pin}
            onChangeText={(value) => {
              setPin(value.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={styles.input}
            accessibilityLabel="PIN enam angka"
          />
          <Text style={[styles.label, { marginTop: 21 }]}>ULANGI PIN</Text>
          <TextInput
            value={confirm}
            onChangeText={(value) => {
              setConfirm(value.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            onSubmitEditing={next}
            style={styles.input}
            accessibilityLabel="Konfirmasi PIN"
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.notice}>
            <Text style={styles.noticeMark}>i</Text>
            <Text style={styles.noticeText}>
              PIN tidak akan ditampilkan lagi. Simpan dengan aman untuk
              kebutuhan pemulihan di masa depan.
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={next}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.82 }]}
        >
          <Text style={styles.buttonText}>
            Lanjutkan <Text style={styles.arrow}>→</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8f4" },
  page: { flex: 1, paddingHorizontal: 24, paddingBottom: 20 },
  topline: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { fontSize: 34, lineHeight: 38, color: INK },
  step: { color: MUTED, fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },
  progress: { height: 3, borderRadius: 2, backgroundColor: "#e3eae4" },
  progressFill: {
    width: "66%",
    height: 3,
    borderRadius: 2,
    backgroundColor: GREEN,
  },
  content: { flex: 1, justifyContent: "center", paddingBottom: 30 },
  eyebrow: {
    color: GREEN,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginBottom: 15,
  },
  title: {
    color: INK,
    fontSize: 35,
    lineHeight: 41,
    fontWeight: "700",
    letterSpacing: -1.1,
  },
  subtitle: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 31,
  },
  label: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.35,
    marginBottom: 9,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 13,
    paddingHorizontal: 16,
    color: INK,
    fontSize: 20,
    letterSpacing: 12,
    backgroundColor: "#fff",
  },
  error: { color: "#a03931", fontSize: 13, marginTop: 9 },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    padding: 14,
    backgroundColor: "#edf2ed",
    borderRadius: 12,
  },
  noticeMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
    textAlign: "center",
    color: "#fff",
    backgroundColor: GREEN,
    fontSize: 12,
    fontWeight: "700",
    marginRight: 10,
  },
  noticeText: { flex: 1, color: MUTED, fontSize: 12, lineHeight: 18 },
  button: {
    height: 56,
    borderRadius: 14,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  arrow: { fontSize: 18 },
});
