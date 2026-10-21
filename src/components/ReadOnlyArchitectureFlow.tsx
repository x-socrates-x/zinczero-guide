import React from "react";
import { View, Text } from "react-native";
import { ZZ } from "../theme/zzTheme";
import type { StepItem } from "../types/sectionContent";

export default function ReadOnlyArchitectureFlow({
  label,
  items,
}: {
  label: string;
  items?: StepItem[];
}) {
  const hasItems = !!items && items.some((item) => item.text.trim().length > 0);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: ZZ.fonts.body, marginBottom: 6, color: ZZ.colors.ink }}>
        {label}
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: hasItems ? "rgba(0,0,0,0.35)" : "rgba(180,0,0,0.35)",
          borderRadius: 12,
          padding: 12,
          backgroundColor: "#fff",
        }}
      >
        {hasItems ? (
          items!.map((item, index) => (
            <View key={item.id}>
              <Text style={{ fontFamily: ZZ.fonts.body, color: ZZ.colors.ink, textAlign: "center" }}>
                {item.text}
              </Text>

              {index < items!.length - 1 && (
                <Text
                  style={{
                    textAlign: "center",
                    marginVertical: 6,
                    fontSize: 18,
                    color: "rgba(0,0,0,0.45)",
                  }}
                >
                  ↓
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text
            style={{
              fontFamily: ZZ.fonts.body,
              color: "rgba(180,0,0,0.85)",
              fontStyle: "italic",
            }}
          >
            Not yet added...
          </Text>
        )}
      </View>
    </View>
  );
}