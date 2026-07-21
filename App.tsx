import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Alert,
  Linking,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AccessibleButton } from "./src/components/AccessibleButton";
import { HistoryModal } from "./src/components/HistoryModal";
import { MicrophoneStatus } from "./src/components/MicrophoneStatus";
import { TranscriptPanel } from "./src/components/TranscriptPanel";
import { useLiveTranscription } from "./src/hooks/useLiveTranscription";
import {
  deleteTranscription,
  getSavedTranscriptions,
  saveTranscription,
} from "./src/storage/transcriptions";
import type { SavedTranscription } from "./src/types/transcription";

const MIN_FONT_SIZE = 22;
const MAX_FONT_SIZE = 56;
const FONT_STEP = 4;

function MainScreen() {
  const [fontSize, setFontSize] = useState(32);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedTranscription[]>([]);

  const {
    finalText,
    interimText,
    completeText,
    isListening,
    isStarting,
    statusMessage,
    startListening,
    stopListening,
    clearTranscript,
    replaceTranscript,
  } = useLiveTranscription();

  const hasText = completeText.trim().length > 0;

  useEffect(() => {
    void getSavedTranscriptions().then(setSavedItems);
  }, []);

  const announce = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };

  const handleMainButton = async () => {
    if (isListening) {
      stopListening();
      announce("Transcripción detenida");
      return;
    }

    const result = await startListening();

    if (result.status === "permission-denied") {
      Alert.alert(
        "Permiso de micrófono necesario",
        "La aplicación necesita acceder al micrófono para convertir la voz en texto.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Abrir configuración",
            onPress: () => void Linking.openSettings(),
          },
        ],
      );
      return;
    }

    if (result.status === "unavailable") {
      Alert.alert(
        "Reconocimiento no disponible",
        "Comprobá que el servicio de reconocimiento de voz del teléfono esté instalado y habilitado.",
      );
      return;
    }

    if (result.status === "error") {
      Alert.alert(
        "No se pudo iniciar",
        "Revisá el micrófono y volvé a intentarlo.",
      );
    }
  };

  const handleCopy = async () => {
    if (!hasText) return;
    await Clipboard.setStringAsync(completeText.trim());
    announce("Transcripción copiada");
  };

  const handleShare = async () => {
    if (!hasText) return;

    try {
      await Share.share({
        title: "Transcripción de Escucha Clara",
        message: completeText.trim(),
      });
    } catch (error) {
      Alert.alert("No se pudo compartir", "Intentá nuevamente.");
      console.warn(error);
    }
  };

  const handleSave = async () => {
    if (!hasText) return;

    try {
      const updated = await saveTranscription(completeText);
      setSavedItems(updated);
      announce("Transcripción guardada en el dispositivo");
      Alert.alert("Guardada", "La transcripción quedó disponible en el historial.");
    } catch (error) {
      Alert.alert("No se pudo guardar", "Intentá nuevamente.");
      console.warn(error);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      const updated = await deleteTranscription(id);
      setSavedItems(updated);
      announce("Transcripción eliminada");
    } catch (error) {
      Alert.alert("No se pudo eliminar", "Intentá nuevamente.");
      console.warn(error);
    }
  };

  const handleOpenSaved = (item: SavedTranscription) => {
    replaceTranscript(item.text);
    setHistoryVisible(false);
    announce("Transcripción cargada");
  };

  const confirmClear = () => {
    if (!hasText) return;

    Alert.alert(
      "Borrar transcripción",
      isListening
        ? "Se borrará el texto actual, pero el micrófono continuará escuchando."
        : "Se borrará todo el texto visible.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: () => {
            clearTranscript();
            announce("Transcripción borrada");
          },
        },
      ],
    );
  };

  const decreaseFont = () => {
    setFontSize((current) => Math.max(MIN_FONT_SIZE, current - FONT_STEP));
  };

  const increaseFont = () => {
    setFontSize((current) => Math.min(MAX_FONT_SIZE, current + FONT_STEP));
  };

  return (
    <SafeAreaView
      edges={["top", "right", "bottom", "left"]}
      style={styles.safeArea}
    >
      <StatusBar style="light" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text allowFontScaling style={styles.title}>
            Escucha Clara
          </Text>
          <Text allowFontScaling style={styles.subtitle}>
            Voz a texto en tiempo real
          </Text>
        </View>

        <MicrophoneStatus
          isListening={isListening}
          statusMessage={statusMessage}
        />

        <TranscriptPanel
          finalText={finalText}
          fontSize={fontSize}
          interimText={interimText}
        />

        <AccessibleButton
          accessibilityHint={
            isListening
              ? "Detiene el micrófono y conserva el texto"
              : "Solicita permiso y comienza a transcribir la voz"
          }
          disabled={isStarting}
          label={
            isListening
              ? "Detener transcripción"
              : isStarting
                ? "Preparando micrófono"
                : "Comenzar a escuchar"
          }
          onPress={() => void handleMainButton()}
          style={styles.mainButton}
          variant="primary"
        >
          <Text allowFontScaling style={styles.mainButtonText}>
            {isListening
              ? "Detener transcripción"
              : isStarting
                ? "Preparando micrófono…"
                : "Comenzar a escuchar"}
          </Text>
        </AccessibleButton>

        <View style={styles.controls}>
          <AccessibleButton
            accessibilityHint="Reduce el tamaño del texto transcripto"
            disabled={fontSize <= MIN_FONT_SIZE}
            label="Disminuir tamaño de letra"
            onPress={decreaseFont}
            style={styles.controlButton}
          >
            <Text allowFontScaling style={styles.controlText}>
              Letra A−
            </Text>
          </AccessibleButton>

          <AccessibleButton
            accessibilityHint="Aumenta el tamaño del texto transcripto"
            disabled={fontSize >= MAX_FONT_SIZE}
            label="Aumentar tamaño de letra"
            onPress={increaseFont}
            style={styles.controlButton}
          >
            <Text allowFontScaling style={styles.controlText}>
              Letra A+
            </Text>
          </AccessibleButton>

          <AccessibleButton
            accessibilityHint="Copia todo el texto al portapapeles"
            disabled={!hasText}
            label="Copiar transcripción"
            onPress={() => void handleCopy()}
            style={styles.controlButton}
          >
            <Text allowFontScaling style={styles.controlText}>
              Copiar
            </Text>
          </AccessibleButton>

          <AccessibleButton
            accessibilityHint="Abre las aplicaciones disponibles para compartir el texto"
            disabled={!hasText}
            label="Compartir transcripción"
            onPress={() => void handleShare()}
            style={styles.controlButton}
          >
            <Text allowFontScaling style={styles.controlText}>
              Compartir
            </Text>
          </AccessibleButton>

          <AccessibleButton
            accessibilityHint="Guarda una copia local del texto actual"
            disabled={!hasText}
            label="Guardar transcripción"
            onPress={() => void handleSave()}
            style={styles.controlButton}
          >
            <Text allowFontScaling style={styles.controlText}>
              Guardar
            </Text>
          </AccessibleButton>

          <AccessibleButton
            accessibilityHint="Muestra las transcripciones guardadas en este dispositivo"
            disabled={isListening || isStarting}
            label="Abrir historial de transcripciones"
            onPress={() => setHistoryVisible(true)}
            style={styles.controlButton}
          >
            <Text allowFontScaling style={styles.controlText}>
              Historial ({savedItems.length})
            </Text>
          </AccessibleButton>

          <AccessibleButton
            accessibilityHint="Borra todo el texto visible"
            disabled={!hasText}
            label="Borrar toda la transcripción"
            onPress={confirmClear}
            style={styles.fullWidthButton}
            variant="danger"
          >
            <Text allowFontScaling style={styles.controlText}>
              Borrar transcripción
            </Text>
          </AccessibleButton>
        </View>

        <Text allowFontScaling style={styles.privacyText}>
          No se guarda audio. El texto solo se almacena cuando tocás “Guardar”.
        </Text>
      </View>

      <HistoryModal
        items={savedItems}
        onClose={() => setHistoryVisible(false)}
        onDeleteItem={handleDeleteSaved}
        onOpenItem={handleOpenSaved}
        visible={historyVisible}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  header: {
    paddingTop: 2,
  },
  title: {
    color: "#FFD900",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
  },
  subtitle: {
    color: "#FFF176",
    fontSize: 16,
    fontWeight: "700",
  },
  mainButton: {
    minHeight: 68,
    width: "100%",
  },
  mainButtonText: {
    color: "#000000",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  controlButton: {
    width: "49%",
  },
  fullWidthButton: {
    width: "100%",
  },
  controlText: {
    color: "#FFD900",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  privacyText: {
    color: "#C7AA00",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});
