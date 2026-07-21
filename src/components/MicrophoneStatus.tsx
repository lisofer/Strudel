import { StyleSheet, Text, View } from "react-native";

type MicrophoneStatusProps = {
  isListening: boolean;
  statusMessage: string;
};

export function MicrophoneStatus({
  isListening,
  statusMessage,
}: MicrophoneStatusProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      style={styles.container}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.indicator, isListening && styles.indicatorActive]}
      />
      <View style={styles.textContainer}>
        <Text allowFontScaling style={styles.label}>
          {isListening ? "MICRÓFONO ACTIVO" : "MICRÓFONO INACTIVO"}
        </Text>
        <Text allowFontScaling style={styles.message}>
          {statusMessage}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "#5E5100",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#090900",
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#FFD900",
    backgroundColor: "transparent",
  },
  indicatorActive: {
    backgroundColor: "#FFD900",
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: "#FFD900",
    fontSize: 16,
    fontWeight: "900",
  },
  message: {
    color: "#FFF176",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
});
