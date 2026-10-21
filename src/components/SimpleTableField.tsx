import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { ZZ } from "../theme/zzTheme";
import type { SimpleTableData } from "../types/sectionContent";

type Props = {
  label: string;
  value: SimpleTableData;
  onChange: (value: SimpleTableData) => void;
};

function makeId() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function SimpleTableField({ label, value, onChange }: Props) {
  function updateCell(rowId: string, columnKey: string, text: string) {
    onChange({
      ...value,
      rows: value.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              values: {
                ...row.values,
                [columnKey]: text,
              },
            }
          : row
      ),
    });
  }

  function addRow() {
    const newValues: Record<string, string> = {};
    value.columns.forEach((col) => {
      newValues[col.key] = "";
    });

    onChange({
      ...value,
      rows: [...value.rows, { id: makeId(), values: newValues }],
    });
  }

  function removeRow(rowId: string) {
    onChange({
      ...value,
      rows: value.rows.filter((row) => row.id !== rowId),
    });
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
        {value.rows.map((row, index) => (
          <View
            key={row.id}
            style={{
              marginBottom: 12,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(0,0,0,0.08)",
            }}
          >
            <Text style={{ fontFamily: ZZ.fonts.body, marginBottom: 8, color: ZZ.colors.ink }}>
              Row {index + 1}
            </Text>

            {value.columns.map((col) => (
              <TextInput
                key={col.key}
                value={row.values[col.key] ?? ""}
                onChangeText={(text) => updateCell(row.id, col.key, text)}
                placeholder={col.label}
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
                multiline
              />
            ))}

            <TouchableOpacity onPress={() => removeRow(row.id)}>
              <Text style={{ fontFamily: ZZ.fonts.body, color: "rgba(180,0,0,0.85)" }}>
                Remove row
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity onPress={addRow}>
          <Text style={{ fontFamily: ZZ.fonts.body, color: ZZ.colors.ink }}>
            + Add row
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}