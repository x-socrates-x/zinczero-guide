import AsyncStorage from "@react-native-async-storage/async-storage";
import { Guide } from "../types/guide";

const KEY = "ZZ_GUIDES_V1";

export async function loadGuides(): Promise<Guide[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Guide[]) : [];
}

export async function saveGuides(guides: Guide[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(guides));
}
