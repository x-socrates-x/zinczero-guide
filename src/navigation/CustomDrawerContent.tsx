import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { logout } from "../db/authRepo";
import ZZLogo from "../components/ZZLogo";
import { ZZ } from "../theme/zzTheme";

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  async function handleLogout() {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            await logout();
            props.navigation.replace("Welcome");
          },
        },
      ]
    );
  }

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 24 }}>
        {/* Logo header */}
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              borderWidth: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFFFFF",
            }}
          >
            <ZZLogo size={56} />
          </View>

          <Text style={{ fontFamily: ZZ.fonts.cursive, fontSize: 26, marginTop: 12 }}>
            ZincZero Guide
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.2)", marginBottom: 16 }} />

        {/* Menu items */}
        <Pressable onPress={() => props.navigation.navigate("Home")}>
          <Text style={{ marginBottom: 16 }}>Home</Text>
        </Pressable>

        <Pressable onPress={() => props.navigation.navigate("CreateGuide")}>
          <Text style={{ marginBottom: 16 }}>Create Guide</Text>
        </Pressable>

        <Pressable onPress={() => props.navigation.navigate("UpdateGuide")}>
          <Text style={{ marginBottom: 16 }}>Update Guide</Text>
        </Pressable>

        <Pressable onPress={() => props.navigation.navigate("DeleteGuide")}>
          <Text style={{ marginBottom: 16 }}>Delete Guide</Text>
        </Pressable>

        <Pressable onPress={() => props.navigation.navigate("ExportGuide")}>
          <Text style={{ marginBottom: 32 }}>Export Guide</Text>
        </Pressable>

        {/* Logout */}
        <Pressable onPress={handleLogout}>
          <Text style={{ color: "red" }}>Log out</Text>
        </Pressable>

        {/* Footer quote (optional) */}
        <View style={{ marginTop: 40, alignItems: "center" }}>
          <Text style={{ textAlign: "center", opacity: 0.7, fontFamily: ZZ.fonts.cursive, fontSize: 18 }}>
            Built with discipline,
            {"\n"}refined through purpose.
            {"\n"}every line, every step –
            {"\n"}progress.
          </Text>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}