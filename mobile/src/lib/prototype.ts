import * as SecureStore from "expo-secure-store";

export type WifiConfig = {
  id: string;
  label: string;
  ssid: string;
  password: string;
  security: "WPA2" | "WPA3" | "open";
  hidden: boolean;
};

export type ProvisionedTag = {
  uid: string;
  label: string; // misal "Meja 1", "Kasir", "Area Depan"
  wifiConfigId: string;
  ssid: string;
  status: "active" | "revoked";
  provisionedAt: number;
  lastVerifiedAt?: number;
};

export type PrototypeData = {
  businessName: string;
  pin: string;
  activeWifiId: string;
  wifiConfigs: WifiConfig[];
  tags?: ProvisionedTag[];
};

const KEY = "blitz-prototype-v1";

export async function loadPrototype(): Promise<PrototypeData | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as PrototypeData;
    if (!data.tags) data.tags = [];
    return data;
  } catch {
    await SecureStore.deleteItemAsync(KEY);
    return null;
  }
}

export async function savePrototype(data: PrototypeData): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(data));
}

export async function updateWifiConfig(
  wifiId: string,
  updates: Partial<Omit<WifiConfig, "id">>,
): Promise<void> {
  const current = await loadPrototype();
  if (!current) return;
  current.wifiConfigs = current.wifiConfigs.map((w) =>
    w.id === wifiId ? { ...w, ...updates } : w,
  );
  await savePrototype(current);
}

export async function deleteWifiConfig(wifiId: string): Promise<boolean> {
  const current = await loadPrototype();
  if (!current || current.wifiConfigs.length <= 1) return false;
  current.wifiConfigs = current.wifiConfigs.filter((w) => w.id !== wifiId);
  if (current.activeWifiId === wifiId) {
    current.activeWifiId = current.wifiConfigs[0].id;
  }
  await savePrototype(current);
  return true;
}

export async function upsertProvisionedTag(tag: ProvisionedTag): Promise<void> {
  const current = await loadPrototype();
  if (!current) return;
  const tags = current.tags || [];
  const index = tags.findIndex((t) => t.uid === tag.uid);
  if (index >= 0) {
    tags[index] = { ...tags[index], ...tag };
  } else {
    tags.unshift(tag);
  }
  current.tags = tags;
  await savePrototype(current);
}

export async function removeProvisionedTag(uid: string): Promise<void> {
  const current = await loadPrototype();
  if (!current || !current.tags) return;
  current.tags = current.tags.filter((t) => t.uid !== uid);
  await savePrototype(current);
}

export function makeWifiConfig(input: Omit<WifiConfig, "id">): WifiConfig {
  return {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

export function makeWifiQrPayload(wifi: WifiConfig): string {
  const escape = (value: string) => value.replace(/[\\;,:\"]/g, "\\$&");
  const type = wifi.security === "open" ? "nopass" : "WPA";
  return `WIFI:T:${type};S:${escape(wifi.ssid)};P:${escape(wifi.password)};H:${wifi.hidden ? "true" : "false"};;`;
}
