import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { ZZ } from "../theme/zzTheme";

function DottedLines() {
  return (
    <View style={{ marginTop: 8, gap: 6 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={i}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.35)",
            borderStyle: "dotted",
          }}
        />
      ))}
    </View>
  );
}

function StatusPill({
  label,
  onPress,
  disabled,
  variant = "neutral",
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "neutral" | "success" | "locked";
}) {
  const styles =
    variant === "success"
      ? {
          borderColor: "rgba(0,128,0,0.45)",
          backgroundColor: "rgba(0,128,0,0.08)",
          color: "rgba(0,100,0,0.95)",
        }
      : variant === "locked"
      ? {
          borderColor: "rgba(0,0,0,0.18)",
          backgroundColor: "rgba(0,0,0,0.04)",
          color: "rgba(0,0,0,0.45)",
        }
      : {
          borderColor: "rgba(0,0,0,0.28)",
          backgroundColor: "#FFFFFF",
          color: ZZ.colors.ink,
        };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={{
        borderWidth: 1,
        borderColor: styles.borderColor,
        backgroundColor: styles.backgroundColor,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: ZZ.fonts.body,
          color: styles.color,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function StepBlock({
  stepNumber,
  instructionTitle,
  code,
  explanation,
  imageUri,
  attachmentName,
  attachmentUrl,
  isCompleted = false,
  isActiveGuide = false,
  canMarkComplete = false,
  onMarkComplete,
}: {
  stepNumber: number;
  instructionTitle: string;
  code: string;
  explanation: string;
  imageUri?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  isCompleted?: boolean;
  isActiveGuide?: boolean;
  canMarkComplete?: boolean;
  onMarkComplete?: () => void;
}) {
  const stepLabel = String(stepNumber).padStart(2, "0");

  const completionLabel = isCompleted
    ? "✓ Completed"
    : !isActiveGuide
    ? "Inactive guide"
    : canMarkComplete
    ? "Mark complete"
    : "Complete earlier steps first";

  const completionVariant = isCompleted
    ? "success"
    : !isActiveGuide || !canMarkComplete
    ? "locked"
    : "neutral";

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: ZZ.colors.ink,
        borderRadius: ZZ.radius.lg,
        backgroundColor: isCompleted ? "rgba(0,128,0,0.04)" : ZZ.colors.bg,
        padding: 14,
        marginBottom: 16,
        opacity: isCompleted ? 0.92 : 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 22,
            color: ZZ.colors.ink,
          }}
        >
          Step {stepLabel} - {instructionTitle || "Instruction Title"}
        </Text>

        <StatusPill
          label={completionLabel}
          onPress={isCompleted || !isActiveGuide || !canMarkComplete ? undefined : onMarkComplete}
          disabled={isCompleted || !isActiveGuide || !canMarkComplete}
          variant={completionVariant}
        />
      </View>

      <View
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: ZZ.colors.faint,
          backgroundColor: "#FFFFFF",
          padding: 12,
          marginTop: 12,
        }}
      >
        <Text style={{ fontFamily: ZZ.fonts.mono, fontSize: 12, color: ZZ.colors.ink }}>
          {code?.trim() ? code : "// (No code provided)"}
        </Text>
      </View>

      <Text style={{ marginTop: 14, fontSize: 20, color: ZZ.colors.ink }}>
        Step {stepLabel} - Explanation
      </Text>

      {explanation?.trim() ? (
        <Text style={{ marginTop: 8, color: ZZ.colors.faint, lineHeight: 20 }}>
          {explanation}
        </Text>
      ) : (
        <DottedLines />
      )}

      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{
            marginTop: 12,
            width: "100%",
            height: 220,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.25)",
          }}
          resizeMode="cover"
        />
      ) : null}
      {attachmentName?.trim() || attachmentUrl?.trim() ? (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.18)",
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
            padding: 12,
          }}
        >
          <Text style={{ fontSize: 16, color: ZZ.colors.ink }}>
            Attachment
          </Text>

          {attachmentName?.trim() ? (
            <Text style={{ marginTop: 8, color: ZZ.colors.ink, lineHeight: 20 }}>
              Name: {attachmentName}
            </Text>
          ) : null}

          {attachmentUrl?.trim() ? (
            <Text style={{ marginTop: 6, color: ZZ.colors.faint, lineHeight: 20 }}>
              Cloud Link: {attachmentUrl}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}