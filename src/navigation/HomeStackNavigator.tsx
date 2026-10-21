import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import GuideViewerScreen from "../screens/GuideViewerScreen";

export type HomeStackParamList = {
  HomeList: undefined;
  GuideViewer: { guideId: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator({ openMenu }: any) {
  return (
    <Stack.Navigator initialRouteName="HomeList" screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="HomeList">
        {(props) => <HomeScreen {...props} openMenu={openMenu} />}
      </Stack.Screen>
      <Stack.Screen name="GuideViewer">
        {(props) => <GuideViewerScreen {...props} openMenu={openMenu} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}