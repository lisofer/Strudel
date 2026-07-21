import AsyncStorage from "@react-native-async-storage/async-storage";

import { MAX_SAVED_TRANSCRIPTIONS } from "../config/speech";
import type { SavedTranscription } from "../types/transcription";

const STORAGE_KEY = "@escucha_clara/saved_transcriptions/v1";

const isSavedTranscription = (value: unknown): value is SavedTranscription => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<SavedTranscription>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.text === "string"
  );
};

export async function getSavedTranscriptions(): Promise<SavedTranscription[]> {
  try {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (!rawValue) return [];

    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isSavedTranscription);
  } catch (error) {
    console.warn("No se pudo leer el historial:", error);
    return [];
  }
}

export async function saveTranscription(
  text: string,
): Promise<SavedTranscription[]> {
  const cleanText = text.trim();
  if (!cleanText) return getSavedTranscriptions();

  const current = await getSavedTranscriptions();
  const savedItem: SavedTranscription = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    text: cleanText,
  };

  const updated = [savedItem, ...current].slice(0, MAX_SAVED_TRANSCRIPTIONS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteTranscription(
  id: string,
): Promise<SavedTranscription[]> {
  const current = await getSavedTranscriptions();
  const updated = current.filter((item) => item.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
