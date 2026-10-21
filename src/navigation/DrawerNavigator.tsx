import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import CreateGuideScreen from "../screens/CreateGuideScreen";
import UpdateGuideScreen from "../screens/UpdateGuideScreen";
import DeleteGuideScreen from "../screens/DeleteGuideScreen";
import ExportGuideScreen from "../screens/ExportGuideScreen";
import CustomDrawerContent from "./CustomDrawerContent";
import HomeStackNavigator from "./HomeStackNavigator";
import ZZLogo from "../components/ZZLogo";


export type DrawerParamList = {
  Home: undefined;
  CreateGuide: undefined;
  UpdateGuide: undefined;
  DeleteGuide: undefined;
  ExportGuide: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" component={HomeStackNavigator} />
      <Drawer.Screen name="CreateGuide" component={CreateGuideScreen} />
      <Drawer.Screen name="UpdateGuide" component={UpdateGuideScreen} />
      <Drawer.Screen name="DeleteGuide" component={DeleteGuideScreen} />
      <Drawer.Screen name="ExportGuide" component={ExportGuideScreen} />
      <Drawer.Screen name="DeleteGuide" component={DeleteGuideScreen} />
    </Drawer.Navigator>
  );
}