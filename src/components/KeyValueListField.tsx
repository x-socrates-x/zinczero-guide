import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { ZZ } from "../theme/zzTheme";
import type { KeyValueItem } from "../types/sectionContent";

type Props = {
  label: string;
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
};

function makeId() {
  return `kv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function KeyValueListField({
  label,
  items,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: Props) {
  function updateItem(id: string, patch: Partial<KeyValueItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    onChange([...items, { id: makeId(), key: "", value: "" }]);
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: ZZ.fonts.body, marginBottom: 6, color: ZZ.colors.ink }}>
        {label}
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.15)",
          borderRadius: 12,
          padding: 12,
          backgroundColor: "#fff",
        }}
      >
        {items.map((item) => (
          <View key={item.id} style={{ marginBottom: 12 }}>
            <TextInput
              value={item.key}
              onChangeText={(text) => updateItem(item.id, { key: text })}
              placeholder={keyPlaceholder ?? "Key"}
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={{
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.12)",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 8,
                fontFamily: ZZ.fonts.body,
                color: ZZ.colors.ink,
              }}
            />

            <TextInput
              value={item.value}
              onChangeText={(text) => updateItem(item.id, { value: text })}
              placeholder={valuePlaceholder ?? "Value"}
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={{
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.12)",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontFamily: ZZ.fonts.body,
                color: ZZ.colors.ink,
              }}
              multiline
            />

            <TouchableOpacity onPress={() => removeItem(item.id)} style={{ marginTop: 6 }}>
              <Text style={{ fontFamily: ZZ.fonts.body, color: "rgba(180,0,0,0.85)" }}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity onPress={addItem}>
          <Text style={{ fontFamily: ZZ.fonts.body, color: ZZ.colors.ink }}>
            + Add entry
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}