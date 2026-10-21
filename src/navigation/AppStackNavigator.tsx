import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorScreenParams } from "@react-navigation/native";
import { HomeStackParamList } from "./HomeStackNavigator";

import HomeStackNavigator from "./HomeStackNavigator";
import CreateGuideScreen from "../screens/CreateGuideScreen";
import UpdateGuideScreen from "../screens/UpdateGuideScreen";
import DeleteGuideScreen from "../screens/DeleteGuideScreen";
import ExportGuideScreen from "../screens/ExportGuideScreen";

import MenuModal from "../components/MenuModal";
import { logout } from "../db/authRepo";

export type AppStackParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  CreateGuide: undefined;
  UpdateGuide: undefined;
  DeleteGuide: undefined;
  ExportGuide: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStackNavigator() {
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        animation: "fade",
        header: () => (
          <MenuModal
            visible={menuOpen}
            onClose={closeMenu}
            navigate={(routeName: keyof AppStackParamList) => {
              closeMenu();

              if (routeName === "Home") {
                navigation.navigate("Home", {
                  screen: "HomeList",
                });
                return;
              }

              navigation.navigate(routeName);
            }}
            logout={async () => {
              closeMenu();
              await logout();
              (navigation.getParent() as any)?.replace("Welcome");
            }}
          />
        ),
      })}
    >
      <Stack.Screen name="Home">
        {(props) => <HomeStackNavigator {...props} openMenu={openMenu} />}
      </Stack.Screen>

      <Stack.Screen name="CreateGuide">
        {(props) => <CreateGuideScreen {...props} openMenu={openMenu} />}
      </Stack.Screen>

      <Stack.Screen name="UpdateGuide">
        {(props) => <UpdateGuideScreen {...props} openMenu={openMenu} />}
      </Stack.Screen>

      <Stack.Screen name="DeleteGuide">
        {(props) => <DeleteGuideScreen {...props} openMenu={openMenu} />}
      </Stack.Screen>

      <Stack.Screen name="ExportGuide">
        {(props) => <ExportGuideScreen {...props} openMenu={openMenu} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}