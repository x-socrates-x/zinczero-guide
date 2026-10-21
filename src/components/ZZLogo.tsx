import React from "react";
import { Image } from "react-native";

export default function ZzLogo({ size = 42 }: { size?: number }) {
  return (
    <Image
      source={require("../assets/images/zz-ios-logo.png")}
      resizeMode="contain"
      style={{
        width: size,
        height: size,
      }}
    />
  );
}