import React from "react";
import { Pressable, Text, View } from "react-native";
import { ZZ } from "../theme/zzTheme";

type GuideStatus =
  | "inactive"
  | "active"
  | "ready_for_testing"
  | "ready_for_review"
  | "complete"
  | "cancelled";

export default function GuideCard({
  label,
  status = "inactive",
  onPress,
}: {
  label: string;
  status?: GuideStatus;
  onPress?: () => void;
}) {
  function getStatusStyles() {
    switch (status) {
      case "active":
        return {
          badgeBg: "rgba(46,125,50,0.14)",
          badgeBorder: "rgba(46,125,50,0.35)",
          badgeText: "#2e7d32",
          cardBorder: "rgba(46,125,50,0.45)",
        };
      case "ready_for_testing":
        return {
          badgeBg: "rgba(249,168,37,0.14)",
          badgeBorder: "rgba(249,168,37,0.35)",
          badgeText: "#b26a00",
          cardBorder: "rgba(249,168,37,0.35)",
        };
      case "ready_for_review":
        return {
          badgeBg: "rgba(239,108,0,0.14)",
          badgeBorder: "rgba(239,108,0,0.35)",
          badgeText: "#c25a00",
          cardBorder: "rgba(239,108,0,0.35)",
        };
      case "complete":
        return {
          badgeBg: "rgba(21,101,192,0.14)",
          badgeBorder: "rgba(21,101,192,0.35)",
          badgeText: "#1565c0",
          cardBorder: "rgba(21,101,192,0.35)",
        };
      case "cancelled":
        return {
          badgeBg: "rgba(198,40,40,0.14)",
          badgeBorder: "rgba(198,40,40,0.35)",
          badgeText: "#c62828",
          cardBorder: "rgba(198,40,40,0.35)",
        };
      default:
        return {
          badgeBg: "rgba(0,0,0,0.05)",
          badgeBorder: "rgba(0,0,0,0.18)",
          badgeText: "rgba(0,0,0,0.6)",
          cardBorder: "rgba(0,0,0,0.2)",
        };
    }
  }

  function getStatusLabel() {
    switch (status) {
      case "active":
        return "ACTIVE";
      case "ready_for_testing":
        return "TESTING";
      case "ready_for_review":
        return "REVIEW";
      case "complete":
        return "COMPLETE";
      case "cancelled":
        return "CANCELLED";
      default:
        return "INACTIVE";
    }
  }

  const styles = getStatusStyles();

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: styles.cardBorder,
        backgroundColor: "#FFFFFF",
        paddingVertical: 14,
        paddingHorizontal: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 18,
            color: ZZ.colors.ink,
            fontFamily: ZZ.fonts.body,
          }}
          numberOfLines={2}
        >
          {label}
        </Text>

        <View
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: styles.badgeBorder,
            backgroundColor: styles.badgeBg,
            paddingVertical: 5,
            paddingHorizontal: 10,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: styles.badgeText,
              fontFamily: ZZ.fonts.body,
            }}
          >
            {getStatusLabel()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}