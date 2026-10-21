import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, Modal, FlatList, Alert, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Sharing from "expo-sharing";
import { listGuides, getGuideById } from "../db/guidesRepo";
import { ZZ } from "../theme/zzTheme";
import { exportGuideAsJsonFile, exportGuideAsMarkdownFile, exportGuideAsPdfFile } from "../utils/export";
import ZZHeader from "../components/ZZHeader";

const PAGE_SIZE = 200;

type GuideLite = { id: string; name: string; updatedAt: number };

function Pill({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.45)",
        borderRadius: 999,
        paddingVertical: 10,
        paddingHorizontal: 16,
        opacity: disabled ? 0.35 : 1,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "rgba(0,0,0,0.85)", fontSize: 16, fontFamily: ZZ.fonts.body }}>{label}</Text>
    </Pressable>
  );
}

export default function ExportGuideScreen({ openMenu }: any) {
  const [guides, setGuides] = useState<GuideLite[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [lastExportUri, setLastExportUri] = useState<string | null>(null);
  const [lastExportName, setLastExportName] = useState<string | null>(null);

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

  function fileNameFromUri(uri: string) {
    const clean = uri.split("?")[0];
    const slash = clean.lastIndexOf("/");
    return slash >= 0 ? clean.slice(slash + 1) : clean;
  }

  async function shareFile(uri: string) {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert("Sharing unavailable", "Sharing isn't available on this device.");
      return;
    }
    await Sharing.shareAsync(uri);
  }

  async function exportAndShare(format: "md" | "json" | "pdf") {
    if (!selectedGuideId) {
      Alert.alert("No guide selected", "Please choose a guide first.");
      return;
    }

    const guide = getGuideById(selectedGuideId);
    if (!guide) {
      Alert.alert("Not found", "Guide could not be loaded.");
      return;
    }

    try {
      setBusy(true);

      let uri = "";
      if (format === "md") uri = await exportGuideAsMarkdownFile(guide);
      if (format === "json") uri = await exportGuideAsJsonFile(guide);
      if (format === "pdf") uri = await exportGuideAsPdfFile(guide);

      const name = fileNameFromUri(uri);
      setLastExportUri(uri);
      setLastExportName(name);

      setBusy(false);

      Alert.alert("Export ready ✅", `${name} is ready to share.`);
      await shareFile(uri);
    } catch {
      setBusy(false);
      Alert.alert("Export failed", "Something went wrong while exporting.");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: ZZ.colors.bg }}>
      <ZZHeader onMenuPress={openMenu} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View style={{ marginTop: 10, borderWidth: 1, borderColor: ZZ.colors.ink, borderRadius: 12, padding: 18, backgroundColor: "#FFFFFF" }}>
          <Text style={{ fontFamily: ZZ.fonts.body, fontSize: 30, textAlign: "center", marginBottom: 18 }}>
            Export guide
          </Text>

          <Text style={{ fontSize: 18, marginBottom: 10, fontFamily: ZZ.fonts.body }}>Guide Name:</Text>

          <Pressable
            onPress={() => setPickerOpen(true)}
            style={{ borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <Text style={{ fontFamily: ZZ.fonts.body }}>{selectedGuideLabel}</Text>
            <Text style={{ fontSize: 18 }}>▾</Text>
          </Pressable>

          <View style={{ marginTop: 18, gap: 12, alignItems: "center" }}>
            <Pill label={busy ? "Working..." : "Export as PDF (best)"} onPress={() => exportAndShare("pdf")} disabled={!selectedGuideId || busy} />
            <Pill label={busy ? "Working..." : "Export as Markdown"} onPress={() => exportAndShare("md")} disabled={!selectedGuideId || busy} />
            <Pill label={busy ? "Working..." : "Export as JSON (backup)"} onPress={() => exportAndShare("json")} disabled={!selectedGuideId || busy} />

            <Text style={{ marginTop: 6, opacity: 0.7, textAlign: "center", fontFamily: ZZ.fonts.body }}>
              PDF export embeds your code screenshots into a single file.
            </Text>
          </View>

          {lastExportUri ? (
            <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.15)", paddingTop: 14 }}>
              <Text style={{ fontSize: 16, marginBottom: 8, fontFamily: ZZ.fonts.body }}>Last export:</Text>
              <Text style={{ opacity: 0.75, marginBottom: 12, fontFamily: ZZ.fonts.body }}>{lastExportName}</Text>

              <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Pill label="Share again" onPress={() => lastExportUri && shareFile(lastExportUri)} disabled={busy} />
                <Pill label="Clear" onPress={() => { setLastExportUri(null); setLastExportName(null); }} disabled={busy} />
              </View>
            </View>
          ) : null}
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