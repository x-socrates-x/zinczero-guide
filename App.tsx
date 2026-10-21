import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import RootNavigator from "./src/navigation/RootNavigator";
import { initSchema } from "./src/db/schema";
import { ensureAdminUser, updateAdminCredentials } from "./src/db/authRepo";
import { ensureSectionsForAllGuides } from "./src/db/guideSectionsRepo";

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  const [fontsLoaded] = useFonts({
    ZZTitle: require("./src/assets/fonts/Fancy.ttf"),
    ZZBody: require("./src/assets/fonts/Regular.ttf"),
  });


  useEffect(() => {
    const init = async () => {
      try {
        initSchema();               // schema is sync
        ensureSectionsForAllGuides(); // seeding is sync
        await ensureAdminUser();    // seeding is async
        await updateAdminCredentials("Socrates", "WoW^yOu-CrAcKeD^mE?101"); 
        setDbReady(true);
      } catch (err) {
        console.error("DB init failed:", err);
      }
    };
    init();
  }, []);

  if (!dbReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}