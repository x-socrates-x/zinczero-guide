import React from "react";
import { Modal, Pressable, View, Text } from "react-native";
import type { AppStackParamList } from "../navigation/AppStackNavigator";

export default function MenuModal({
  visible,
  onClose,
  navigate,
}: {
  visible: boolean;
  onClose: () => void;
  navigate: (routeName: keyof AppStackParamList) => void;
}) {
  const go = (routeName: keyof AppStackParamList) => {
    navigate(routeName);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.25)",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            position: "absolute",
            top: 110,
            right: 18,
            width: 220,
            backgroundColor: "white",
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.25)",
          }}
        >
          <Pressable
            onPress={() => go("CreateGuide")}
            style={{ paddingVertical: 16, paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 16 }}>Create Guide</Text>
          </Pressable>

          <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.1)" }} />

          <Pressable
            onPress={() => go("UpdateGuide")}
            style={{ paddingVertical: 16, paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 16 }}>Update Guide</Text>
          </Pressable>

          <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.1)" }} />

          <Pressable
            onPress={() => go("DeleteGuide")}
            style={{ paddingVertical: 16, paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 16 }}>Delete Guide</Text>
          </Pressable>

          <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.1)" }} />

          <Pressable
            onPress={() => go("ExportGuide")}
            style={{ paddingVertical: 16, paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 16 }}>Export Guide</Text>
          </Pressable>

          <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.1)" }} />

          <Pressable
            onPress={() => go("Home")}
            style={{ paddingVertical: 16, paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 16 }}>Home</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}