import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { ZZ } from "../theme/zzTheme";

export type GuideTabKey =
  | "overview"
  | "architecture"
  | "requirements"
  | "build_plan"
  | "implementation"
  | "security"
  | "database"
  | "testing"
  | "deployment"
  | "handoff";

const LABELS: Record<GuideTabKey, string> = {
  overview: "Overview",
  architecture: "Architecture",
  requirements: "Requirements",
  build_plan: "Build Plan",
  implementation: "Implementation",
  security: "Security",
  database: "Database",
  testing: "Testing",
  deployment: "Deployment",
  handoff: "Hand-off",
};

export default function GuideTabBar({
  value,
  onChange,
}: {
  value: GuideTabKey;
  onChange: (k: GuideTabKey) => void;
}) {
  const keys: GuideTabKey[] = [
    "overview",
    "architecture",
    "requirements",
    "build_plan",
    "implementation",
    "security",
    "database",
    "testing",
    "deployment",
    "handoff",
  ];

  return (
    <View style={{ paddingTop: 8, paddingBottom: 10 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 14 }}>
          {keys.map((k) => {
            const active = value === k;
            return (
              <Pressable
                key={k}
                onPress={() => onChange(k)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: ZZ.colors.ink,
                  backgroundColor: active ? ZZ.colors.ink : ZZ.colors.bg,
                }}
              >
                <Text
                  style={{
                    fontFamily: ZZ.fonts.body,
                    fontSize: 13,
                    color: active ? ZZ.colors.bg : ZZ.colors.ink,
                  }}
                >
                  {LABELS[k]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}