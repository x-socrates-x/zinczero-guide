import React from "react";
import { View, Text, Pressable } from "react-native";
import ZZLogo from "./ZZLogo";
import { ZZ } from "../theme/zzTheme";
import ZZDivider from "./ZZDivider";

export default function ZZHeader({
  onMenuPress,
}: {
  onMenuPress: () => void;
}) {
  return (
    <View style={{ paddingTop: 56, paddingHorizontal: 20 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            borderWidth: 1,
            borderColor: ZZ.colors.ink,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
          }}
        >
          <ZZLogo size={34} />
        </View>

        {/* Hamburger */}
        <Pressable
          onPress={onMenuPress}
          style={{
            width: 46,
            height: 46,
            borderRadius: 6,
            backgroundColor: "#111",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 18 }}>☰</Text>
        </Pressable>
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: "black",
          opacity: 0.6,
          marginTop: 16,
        }}
      />

      {/* Title */}
      <View style={{ paddingVertical: 18, alignItems: "center" }}>
        <Text
          style={{
            fontFamily: ZZ.fonts.cursive,
            fontSize: 40,
            color: ZZ.colors.ink,
          }}
        >
          ZincZero
        </Text>
        <ZZDivider />
      </View>
    </View>
  );
}