import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { Platform } from "react-native";
import WifiManager from "react-native-wifi-reborn";

export type DetectedWifi = {
  ssid: string;
  bssid?: string;
  frequency?: number;
  strength?: number;
  security: "WPA2" | "WPA3" | "open";
  isConnected?: boolean;
};

/**
 * Minta izin lokasi yang diperlukan Android untuk memindai daftar Wi-Fi di sekitar.
 */
async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (e) {
    console.warn("Gagal meminta izin lokasi:", e);
    return false;
  }
}

/**
 * Deteksi SSID Wi-Fi yang saat ini sedang aktif terhubung ke HP.
 */
export async function detectConnectedWifi(): Promise<DetectedWifi | null> {
  await requestLocationPermission();

  try {
    const state = await NetInfo.fetch();
    if (
      state.type === NetInfoStateType.wifi &&
      state.isConnected &&
      state.details
    ) {
      const details = state.details;
      const rawSsid = details.ssid;
      if (rawSsid && rawSsid !== "<unknown ssid>") {
        const cleanSsid = rawSsid.replace(/^"|"$/g, "");
        return {
          ssid: cleanSsid,
          bssid: details.bssid || undefined,
          frequency: details.frequency || undefined,
          strength: details.strength || undefined,
          security: "WPA2",
          isConnected: true,
        };
      }
    }
  } catch (error) {
    console.warn("NetInfo detectConnectedWifi warning:", error);
  }

  // Fallback via WifiManager
  try {
    const currentSsid = await WifiManager.getCurrentWifiSSID();
    if (currentSsid && currentSsid !== "<unknown ssid>") {
      return {
        ssid: currentSsid.replace(/^"|"$/g, ""),
        security: "WPA2",
        isConnected: true,
      };
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Pindai dan dapatkan SELURUH daftar jaringan Wi-Fi di sekitar perangkat.
 * Mengembalikan array unik jaringan terdeteksi tanpa auto-select.
 */
export async function scanAllNearbyWifi(): Promise<DetectedWifi[]> {
  const granted = await requestLocationPermission();
  const listMap = new Map<string, DetectedWifi>();

  // 1. Dapatkan Wi-Fi yang sedang aktif terhubung (jika ada)
  const connected = await detectConnectedWifi();
  if (connected && connected.ssid) {
    listMap.set(connected.ssid, connected);
  }

  // 2. Pindai seluruh Wi-Fi sekitar via WifiManager (Android)
  if (Platform.OS === "android" && granted) {
    try {
      let rawList: any[] = [];
      try {
        rawList = await WifiManager.reScanAndLoadWifiList();
      } catch {
        rawList = await WifiManager.loadWifiList();
      }

      for (const item of rawList || []) {
        const cleanSsid = (item.SSID || "").replace(/^"|"$/g, "").trim();
        // Lewati SSID kosong atau hidden tanpa nama
        if (!cleanSsid || cleanSsid === "<unknown ssid>") continue;

        const capabilities = (item.capabilities || "").toUpperCase();
        let security: "WPA2" | "WPA3" | "open" = "WPA2";
        if (capabilities.includes("WPA3") || capabilities.includes("SAE")) {
          security = "WPA3";
        } else if (
          !capabilities.includes("WPA") &&
          !capabilities.includes("WEP") &&
          !capabilities.includes("PSK")
        ) {
          security = "open";
        }

        const isCurrentlyConnected = connected?.ssid === cleanSsid;

        if (!listMap.has(cleanSsid)) {
          listMap.set(cleanSsid, {
            ssid: cleanSsid,
            bssid: item.BSSID,
            frequency: item.frequency,
            strength: item.level,
            security,
            isConnected: isCurrentlyConnected,
          });
        }
      }
    } catch (e) {
      console.warn("Scan nearby Wi-Fi failed, using connected fallback:", e);
    }
  }

  return Array.from(listMap.values());
}
