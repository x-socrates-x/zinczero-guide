import React from "react";
import { View, Text } from "react-native";
import { ZZ } from "../theme/zzTheme";
import type { BulletItem } from "../types/sectionContent";

export default function ReadOnlyBulletList({
  label,
  items,
}: {
  label: string;
  items?: BulletItem[];
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
          items!.map((item) => (
            <Text
              key={item.id}
              style={{ fontFamily: ZZ.fonts.body, color: ZZ.colors.ink, lineHeight: 22 }}
            >
              • {item.text}
            </Text>
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