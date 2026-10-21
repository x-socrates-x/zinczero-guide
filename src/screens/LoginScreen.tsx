import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { login } from "../db/authRepo";
import ZZLogo from "../components/ZZLogo";
import { ZZ } from "../theme/zzTheme";
import ZZDivider from "../components/ZZDivider";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLogin() {
    if (!username.trim() || !password) {
      Alert.alert("Missing details", "Please enter username and password.");
      return;
    }

    setBusy(true);
    const res = await login(username, password);
    setBusy(false);

    if (!res.ok) {
      Alert.alert("Login failed", res.error);
      return;
    }

    navigation.replace("App");
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header (logo left, back right) */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo in circle */}
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.8)",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFFFFF",
            }}
          >
            <ZZLogo size={34} />
          </View>

          {/* Back */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 6,
              borderWidth: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18 }}>‹</Text>
          </Pressable>
        </View>

        <View style={{ height: 1, backgroundColor: "black", opacity: 0.6, marginTop: 16 }} />

        <View style={{ paddingVertical: 18, alignItems: "center" }}>
          <Text style={{ fontFamily: ZZ.fonts.cursive, fontSize: 40, color: ZZ.colors.ink }}>
            ZincZero
          </Text>
          <ZZDivider />
        </View>
      </View>

      {/* Form */}
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ marginBottom: 6, fontFamily: ZZ.fonts.body }}>Username:</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            fontFamily: ZZ.fonts.body,
          }}
        />

        <Text style={{ marginBottom: 6, fontFamily: ZZ.fonts.body }}>Password:</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            marginBottom: 24,
            fontFamily: ZZ.fonts.body,
          }}
        />

        <Pressable
          onPress={onLogin}
          disabled={busy}
          style={{
            borderWidth: 1,
            borderRadius: 999,
            paddingVertical: 12,
            alignItems: "center",
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text style={{ fontFamily: ZZ.fonts.body }}>{busy ? "Logging in..." : "Log In"}</Text>
        </Pressable>

        <Text style={{ marginTop: 16, textAlign: "center", opacity: 0.7, fontFamily: ZZ.fonts.body }}>
          Authorised access only
        </Text>
      </View>
    </View>
  );
}