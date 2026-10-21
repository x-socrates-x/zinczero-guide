import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, Modal, FlatList, Alert, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { listGuides, deleteGuide } from "../db/guidesRepo";
import { ZZ } from "../theme/zzTheme";
import ZZHeader from "../components/ZZHeader";

const PAGE_SIZE = 200;

type GuideLite = { id: string; name: string; updatedAt: number };

function Pill({
  label,
  onPress,
  variant = "outline",
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "outline" | "danger";
  disabled?: boolean;
}) {
  const isDanger = variant === "danger";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        borderWidth: 1,
        borderColor: isDanger ? "rgba(180,0,0,0.55)" : "rgba(0,0,0,0.45)",
        borderRadius: 999,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: "transparent",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text style={{ color: isDanger ? "rgba(180,0,0,0.9)" : "rgba(0,0,0,0.85)", fontFamily: ZZ.fonts.body }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function DeleteGuideScreen({ navigation, openMenu }: any) {
  const [guides, setGuides] = useState<GuideLite[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const res = listGuides(1, PAGE_SIZE);
      setGuides(res.guides.map((g) => ({ id: g.id, name: g.name, updatedAt: g.updatedAt })).sort((a, b) => b.updatedAt - a.updatedAt));
    }, [])
  );

  const selectedGuideLabel = useMemo(() => {
    if (!selectedGuideId) return "Select Guide";
    return guides.find((g) => g.id === selectedGuideId)?.name ?? "Select Guide";
  }, [selectedGuideId, guides]);

  async function handleDelete() {
    if (!selectedGuideId) {
      Alert.alert("No guide selected", "Please choose a guide first.");
      return;
    }

    Alert.alert(
      "Delete guide",
      "This will permanently delete the guide, its stages, steps, and any saved code images. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy(true);
              await deleteGuide(selectedGuideId);
              setBusy(false);

              const res = listGuides(1, PAGE_SIZE);
              const next = res.guides.map((g) => ({ id: g.id, name: g.name, updatedAt: g.updatedAt })).sort((a, b) => b.updatedAt - a.updatedAt);
              setGuides(next);

              setSelectedGuideId(null);
              Alert.alert("Deleted", "Guide deleted successfully.");
              navigation.navigate("Home");
            } catch {
              setBusy(false);
              Alert.alert("Error", "Something went wrong while deleting the guide.");
            }
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: ZZ.colors.bg }}>
      <ZZHeader onMenuPress={openMenu} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View style={{ marginTop: 10, borderWidth: 1, borderColor: ZZ.colors.ink, borderRadius: 12, padding: 18, backgroundColor: "#FFFFFF" }}>
          <Text style={{ fontFamily: ZZ.fonts.body, fontSize: 30, textAlign: "center", marginBottom: 18 }}>
            Delete guide
          </Text>

          <Text style={{ fontSize: 18, marginBottom: 10, fontFamily: ZZ.fonts.body }}>Guide Name:</Text>

          <Pressable
            onPress={() => setPickerOpen(true)}
            style={{ borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <Text style={{ fontFamily: ZZ.fonts.body }}>{selectedGuideLabel}</Text>
            <Text style={{ fontSize: 18 }}>▾</Text>
          </Pressable>

          <View style={{ marginTop: 16, borderWidth: 1, borderColor: "rgba(180,0,0,0.35)", borderRadius: 12, padding: 14, backgroundColor: "rgba(180,0,0,0.04)" }}>
            <Text style={{ color: "rgba(140,0,0,0.95)", fontSize: 14, lineHeight: 20, fontFamily: ZZ.fonts.body }}>
              Deleting a guide removes everything inside it, including any saved code screenshots.
            </Text>
          </View>

          <View style={{ marginTop: 18, alignItems: "center" }}>
            <Pill label={busy ? "Deleting..." : "Delete Guide"} variant="danger" onPress={handleDelete} disabled={!selectedGuideId || busy} />
          </View>
        </View>

        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable onPress={() => setPickerOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 18 }}>
            <Pressable onPress={() => {}} style={{ backgroundColor: "white", borderRadius: 14, borderWidth: 1, padding: 14, maxHeight: "70%" }}>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>Select Guide</Text>

              <FlatList
                data={guides}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setSelectedGuideId(item.id);
                      setPickerOpen(false);
                    }}
                    style={{ borderWidth: 1, borderRadius: 12, padding: 12, backgroundColor: selectedGuideId === item.id ? "rgba(0,0,0,0.06)" : "white" }}
                  >
                    <Text>{item.name}</Text>
                  </Pressable>
                )}
              />

              <Pressable onPress={() => setPickerOpen(false)} style={{ marginTop: 12, alignSelf: "center", paddingVertical: 8 }}>
                <Text style={{ color: ZZ.colors.faint }}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </View>
  );
}