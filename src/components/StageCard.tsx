import React from "react";
import { View, Text } from "react-native";
import { ZZ } from "../theme/zzTheme";

export default function StageCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: ZZ.colors.ink,
        borderRadius: ZZ.radius.md,
        backgroundColor: ZZ.colors.bg,
        padding: 14,
        marginTop: 18,
      }}
    >
      {/* Stage Title Row */}
      <View style={{ alignItems: "center", marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ height: 1, width: 70, backgroundColor: ZZ.colors.faint }} />
          <Text
            style={{
              fontFamily: ZZ.fonts.body,
              fontSize: 22,
              color: ZZ.colors.ink,
            }}
          >
            {title}
          </Text>
          <View style={{ height: 1, width: 70, backgroundColor: ZZ.colors.faint }} />
        </View>
      </View>

      {children}
    </View>
  );
}