import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "danger";

type AccessibleButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function AccessibleButton({
  label,
  onPress,
  accessibilityHint,
  disabled = false,
  variant = "secondary",
  style,
  children,
}: AccessibleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children ?? (
        <Text
          allowFontScaling
          style={[
            styles.label,
            variant === "primary" && styles.primaryLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primary: {
    backgroundColor: "#FFD900",
    borderColor: "#FFD900",
  },
  secondary: {
    backgroundColor: "#050505",
    borderColor: "#FFD900",
  },
  danger: {
    backgroundColor: "#050505",
    borderColor: "#FF6B6B",
  },
  label: {
    color: "#FFD900",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  primaryLabel: {
    color: "#000000",
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.38,
  },
});
