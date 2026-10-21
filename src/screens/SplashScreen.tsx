import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { getSessionUserId } from "../db/authRepo";
import ZZLogo from "../components/ZZLogo";
import { ZZ } from "../theme/zzTheme";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    (async () => {
      // Small delay so splash feels intentional (not a flash)
      await new Promise((r) => setTimeout(r, 650));

      const userId = await getSessionUserId();
      navigation.replace(userId ? "App" : "Welcome");
    })();
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: "white", justifyContent: "center", alignItems: "center" }}>
      <ZZLogo size={120} />

      <Text
        style={{
          marginTop: 18,
          fontFamily: ZZ.fonts.cursive,
          fontSize: 36,
          color: ZZ.colors.ink,
        }}
      >
        ZincZero
      </Text>

      <Text style={{ marginTop: 6, opacity: 0.7 }}>
        Guide
      </Text>
    </View>
  );
}