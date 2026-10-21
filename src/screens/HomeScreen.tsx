import React, { useCallback, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { listGuides } from "../db/guidesRepo";
import GuideCard from "../components/GuideCard";
import Pagination from "../components/Pagination";
import ZZHeader from "../components/ZZHeader";
import { ZZ } from "../theme/zzTheme";

const PAGE_SIZE = 4;

type GuideRow = {
  id: string;
  name: string;
  status:
    | "inactive"
    | "active"
    | "ready_for_testing"
    | "ready_for_review"
    | "complete"
    | "cancelled";
  createdAt: number;
  updatedAt: number;
  activatedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  estimatedDurationDays?: number;
  stages: any[];
};

export default function HomeScreen({ navigation, openMenu }: any) {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [guides, setGuides] = useState<GuideRow[]>([]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback((p: number) => {
    const res = listGuides(p, PAGE_SIZE);
    setGuides(res.guides as any);
    setTotal(res.total);

    const nextTotalPages = Math.max(1, Math.ceil(res.total / PAGE_SIZE));
    if (p > nextTotalPages) setPage(nextTotalPages);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(page);
    }, [load, page])
  );

  return (
    <View style={{ flex: 1, backgroundColor: ZZ.colors.bg }}>
      {/* Header is REQUIRED because headerShown:false in HomeStackNavigator */}
      <ZZHeader onMenuPress={openMenu} />

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
          renderItem={({ item, index }) => (
          <GuideCard
            label={item.name || `Guide #${(page - 1) * PAGE_SIZE + (index + 1)}`}
            status={item.status}
            onPress={() => navigation.navigate("GuideViewer", { guideId: item.id })}
          />
          )}
          ListEmptyComponent={
            <View style={{ paddingTop: 40, alignItems: "center" }}>
              <Text style={{ opacity: 0.7, fontFamily: ZZ.fonts.body }}>
                No guides yet. Create your first guide from the menu.
              </Text>
            </View>
          }
        />

        <View style={{ paddingVertical: 14, alignItems: "center" }}>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            onSelect={(p) => setPage(p)}
          />
        </View>
      </View>
    </View>
  );
}
