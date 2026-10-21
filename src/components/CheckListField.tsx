import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { ZZ } from "../theme/zzTheme";
import type { ChecklistItem } from "../types/sectionContent";

type Props = {
  label: string;
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  placeholder?: string;
};

function makeId() {
  return `check_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChecklistField({ label, items, onChange, placeholder }: Props) {
  function updateItem(id: string, text: string) {
    onChange(items.map((item) => (item.id === id ? { ...item, text } : item)));
  }

  function addItem() {
    onChange([...items, { id: makeId(), text: "" }]);
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
        {items.map((item, index) => (
          <View key={item.id} style={{ marginBottom: 10 }}>
            <Text style={{ fontFamily: ZZ.fonts.body, marginBottom: 4, color: ZZ.colors.ink }}>
              ☑ Check {index + 1}
            </Text>

            <TextInput
              value={item.text}
              onChangeText={(text) => updateItem(item.id, text)}
              placeholder={placeholder ?? "Enter checklist item..."}
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
            + Add checklist item
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}