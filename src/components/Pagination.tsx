import React from "react";
import { View, Text, Pressable } from "react-native";

function PageButton({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        borderRadius: 4,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.35 : 1,
        backgroundColor: active ? "white" : "transparent",
      }}
    >
      <Text style={{ fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export default function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
  onSelect,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (page: number) => void;
}) {
  // Show up to 2 pages like your screenshot: current and next (or prev/current)
  const pages =
    totalPages <= 2
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : page === 1
      ? [1, 2]
      : page === totalPages
      ? [totalPages - 1, totalPages]
      : [page, page + 1];

  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
      <PageButton label="‹" disabled={page <= 1} onPress={onPrev} />
      {pages.map((p) => (
        <PageButton key={p} label={String(p)} active={p === page} onPress={() => onSelect(p)} />
      ))}
      <PageButton label="›" disabled={page >= totalPages} onPress={onNext} />
    </View>
  );
}