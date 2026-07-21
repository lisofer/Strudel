import { Alert, FlatList, Modal, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { SavedTranscription } from "../types/transcription";
import { formatTranscriptionDate } from "../utils/formatDate";
import { AccessibleButton } from "./AccessibleButton";

type HistoryModalProps = {
  visible: boolean;
  items: SavedTranscription[];
  onClose: () => void;
  onOpenItem: (item: SavedTranscription) => void;
  onDeleteItem: (id: string) => Promise<void>;
};

export function HistoryModal({
  visible,
  items,
  onClose,
  onOpenItem,
  onDeleteItem,
}: HistoryModalProps) {
  const confirmDelete = (item: SavedTranscription) => {
    Alert.alert(
      "Eliminar transcripción",
      "Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => void onDeleteItem(item.id),
        },
      ],
    );
  };

  const shareItem = async (item: SavedTranscription) => {
    try {
      await Share.share({
        title: "Transcripción guardada",
        message: item.text,
      });
    } catch (error) {
      Alert.alert("No se pudo compartir", "Intentá nuevamente.");
      console.warn(error);
    }
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView
        accessibilityViewIsModal
        edges={["top", "right", "bottom", "left"]}
        style={styles.safeArea}
      >
        <View style={styles.header}>
          <View style={styles.headingContainer}>
            <Text allowFontScaling style={styles.title}>
              Transcripciones guardadas
            </Text>
            <Text allowFontScaling style={styles.count}>
              {items.length} {items.length === 1 ? "elemento" : "elementos"}
            </Text>
          </View>
          <AccessibleButton
            accessibilityHint="Vuelve a la pantalla principal"
            label="Cerrar historial"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text allowFontScaling style={styles.closeText}>
              Cerrar
            </Text>
          </AccessibleButton>
        </View>

        <FlatList
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.emptyListContent,
          ]}
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text allowFontScaling style={styles.emptyTitle}>
                Todavía no hay transcripciones guardadas.
              </Text>
              <Text allowFontScaling style={styles.emptyText}>
                Volvé a la pantalla principal y tocá “Guardar”.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text allowFontScaling style={styles.date}>
                {formatTranscriptionDate(item.createdAt)}
              </Text>
              <Text
                allowFontScaling
                numberOfLines={5}
                selectable
                style={styles.preview}
              >
                {item.text}
              </Text>
              <View style={styles.actions}>
                <AccessibleButton
                  accessibilityHint="Carga esta transcripción en la pantalla principal"
                  label="Abrir transcripción"
                  onPress={() => onOpenItem(item)}
                  style={styles.actionButton}
                >
                  <Text allowFontScaling style={styles.actionText}>
                    Abrir
                  </Text>
                </AccessibleButton>
                <AccessibleButton
                  accessibilityHint="Abre las opciones para compartir este texto"
                  label="Compartir transcripción guardada"
                  onPress={() => void shareItem(item)}
                  style={styles.actionButton}
                >
                  <Text allowFontScaling style={styles.actionText}>
                    Compartir
                  </Text>
                </AccessibleButton>
                <AccessibleButton
                  accessibilityHint="Elimina esta transcripción del dispositivo"
                  label="Eliminar transcripción guardada"
                  onPress={() => confirmDelete(item)}
                  style={styles.actionButton}
                  variant="danger"
                >
                  <Text allowFontScaling style={styles.actionText}>
                    Eliminar
                  </Text>
                </AccessibleButton>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#FFD900",
  },
  headingContainer: {
    flex: 1,
  },
  title: {
    color: "#FFD900",
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
  },
  count: {
    color: "#FFF176",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  closeButton: {
    minWidth: 92,
  },
  closeText: {
    color: "#FFD900",
    fontSize: 16,
    fontWeight: "800",
  },
  listContent: {
    paddingVertical: 14,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    borderWidth: 2,
    borderColor: "#5E5100",
    borderRadius: 12,
  },
  emptyTitle: {
    color: "#FFD900",
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: "#FFF176",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },
  card: {
    borderWidth: 2,
    borderColor: "#5E5100",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#070700",
  },
  date: {
    color: "#FFF176",
    fontSize: 15,
    fontWeight: "800",
  },
  preview: {
    color: "#FFD900",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  actionButton: {
    minWidth: 105,
    flexGrow: 1,
    flexBasis: "30%",
  },
  actionText: {
    color: "#FFD900",
    fontSize: 15,
    fontWeight: "800",
  },
});
