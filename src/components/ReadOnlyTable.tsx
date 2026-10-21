import React from "react";
import { View, Text } from "react-native";
import { ZZ } from "../theme/zzTheme";
import type { SimpleTableData } from "../types/sectionContent";

export default function ReadOnlyTable({
  label,
  value,
}: {
  label: string;
  value?: SimpleTableData;
}) {
  const hasRows = !!value && value.rows.length > 0;

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: ZZ.fonts.body, marginBottom: 6, color: ZZ.colors.ink }}>
        {label}
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: hasRows ? "rgba(0,0,0,0.35)" : "rgba(180,0,0,0.35)",
          borderRadius: 12,
          padding: 12,
          backgroundColor: "#fff",
        }}
      >
        {hasRows ? (
          value!.rows.map((row) => (
            <View
              key={row.id}
              style={{
                marginBottom: 10,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(0,0,0,0.08)",
              }}
            >
              {value!.columns.map((col) => (
                <Text
                  key={col.key}
                  style={{ fontFamily: ZZ.fonts.body, color: ZZ.colors.ink, lineHeight: 22 }}
                >
                  {col.label}: {row.values[col.key] ?? ""}
                </Text>
              ))}
            </View>
          ))
        ) : (
          <Text
            style={{
              fontFamily: ZZ.fonts.body,
              color: "rgba(180,0,0,0.85)",
              fontStyle: "italic",
            }}
          >
            Not yet added...
          </Text>
        )}
      </View>
    </View>
  );
}