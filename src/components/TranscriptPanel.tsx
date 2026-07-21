import { useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type TranscriptPanelProps = {
  finalText: string;
  interimText: string;
  fontSize: number;
};

export function TranscriptPanel({
  finalText,
  interimText,
  fontSize,
}: TranscriptPanelProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  const completeText = useMemo(
    () => [finalText.trim(), interimText.trim()].filter(Boolean).join(" "),
    [finalText, interimText],
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    });
  }, [completeText, fontSize]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        accessibilityLabel={
          completeText
            ? `Transcripción: ${completeText}`
            : "Área de transcripción vacía"
        }
        contentContainerStyle={styles.content}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: false })
        }
        persistentScrollbar
        showsVerticalScrollIndicator
      >
        {completeText ? (
          <Text
            allowFontScaling
            selectable
            style={[styles.transcript, { fontSize, lineHeight: fontSize * 1.35 }]}
          >
            {finalText.trim()}
            {finalText.trim() && interimText.trim() ? " " : ""}
            <Text style={styles.interim}>{interimText.trim()}</Text>
          </Text>
        ) : (
          <Text
            allowFontScaling
            style={[styles.placeholder, { fontSize, lineHeight: fontSize * 1.35 }]}
          >
            La transcripción aparecerá aquí.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 160,
    backgroundColor: "#000000",
    borderColor: "#FFD900",
    borderWidth: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  content: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  transcript: {
    color: "#FFD900",
    fontWeight: "800",
  },
  interim: {
    color: "#FFF176",
    fontWeight: "700",
  },
  placeholder: {
    color: "#C7AA00",
    fontWeight: "700",
  },
});
