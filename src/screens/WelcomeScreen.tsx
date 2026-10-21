import React from "react";
import { View, Text, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import ZZLogo from "../components/ZZLogo";
import { ZZ } from "../theme/zzTheme";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <Pressable
      style={{
        flex: 1,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={() => navigation.navigate("Login")}
    >
      <ZZLogo size={120} />

      <Text
        style={{
          marginTop: 22,
          fontFamily: ZZ.fonts.cursive,
          fontSize: 40,
          color: ZZ.colors.ink,
        }}
      >
        Welcome
      </Text>

    </Pressable>
  );
}