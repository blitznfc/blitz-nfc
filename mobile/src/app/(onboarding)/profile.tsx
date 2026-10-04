import { router } from "expo-router";
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

export default function BusinessProfileScreen() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function next() {
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Nama usaha wajib diisi.");
      return;
    }
    router.push({ pathname: "/(onboarding)/pin", params: { name: cleanName } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topline}>
          <Text style={styles.brand}>blitz</Text>
          <Text style={styles.step}>01 / 03</Text>
        </View>
        <View style={styles.progress}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>MULAI DARI USAHAMU</Text>
          <Text style={styles.title}>Siapa yang akan{"\n"}menyambut tamu?</Text>
          <Text style={styles.subtitle}>
            Nama ini akan tampil di dashboard perangkatmu.
          </Text>
          <Text style={styles.label}>NAMA USAHA</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError("");
            }}
            placeholder="Contoh: Kedai Pagi"
            placeholderTextColor="#9aa69d"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={next}
            maxLength={80}
            style={styles.input}
            accessibilityLabel="Nama usaha"
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.photoNote}>
            <Text style={styles.photoIcon}>＋</Text>
            <View style={styles.photoCopy}>
              <Text style={styles.photoTitle}>Tambahkan foto nanti</Text>
              <Text style={styles.photoSub}>
                Foto profil usaha opsional untuk saat ini.
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={next}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
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
  brand: { color: INK, fontSize: 23, fontWeight: "800", letterSpacing: -1.2 },
  step: { color: MUTED, fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },
  progress: { height: 3, borderRadius: 2, backgroundColor: "#e3eae4" },
  progressFill: {
    width: "33%",
    height: 3,
    borderRadius: 2,
    backgroundColor: GREEN,
  },
  content: { flex: 1, justifyContent: "center", paddingBottom: 40 },
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
    marginBottom: 38,
  },
  label: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.35,
    marginBottom: 9,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 13,
    paddingHorizontal: 16,
    color: INK,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  error: { color: "#a03931", fontSize: 13, marginTop: 8 },
  photoNote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 19,
    paddingVertical: 13,
  },
  photoIcon: {
    color: GREEN,
    fontSize: 24,
    width: 40,
    height: 40,
    lineHeight: 38,
    textAlign: "center",
    borderRadius: 12,
    backgroundColor: "#e9f0ea",
    overflow: "hidden",
  },
  photoCopy: { marginLeft: 12 },
  photoTitle: { color: INK, fontWeight: "700", fontSize: 13 },
  photoSub: { color: MUTED, fontSize: 12, marginTop: 3 },
  button: {
    height: 56,
    borderRadius: 14,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: { opacity: 0.82 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  arrow: { fontSize: 18 },
});
