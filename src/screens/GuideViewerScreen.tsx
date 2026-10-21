import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from "react-native";
import { useFocusEffect, RouteProp } from "@react-navigation/native";


import ZZHeader from "../components/ZZHeader";
import GuideTabBar, { GuideTabKey } from "../components/GuideTabBar";
import StageCard from "../components/StageCard";
import StepBlock from "../components/StepBlock";

import { ZZ } from "../theme/zzTheme";
import { getSection } from "../db/guideSectionsRepo";
import {
  getGuideById,
  updateGuide,
  activateGuide,
  markGuideReadyForReview,
  completeGuide,
  cancelGuide,
  revertGuideToInactive,
} from "../db/guidesRepo";
import ReadOnlyArchitectureFlow from "../components/ReadOnlyArchitectureFlow";
import type { Guide } from "../types/guide";

type Props = {
  navigation: any;
  route: RouteProp<any, any>;
  openMenu: () => void;
};

export default function GuideViewerScreen({ navigation, route, openMenu }: Props) {
  const guideId: string = route.params?.guideId;

  const [tab, setTab] = useState<GuideTabKey>("overview");
  const [section, setSection] = useState<any>(null);

  const isImplementation = tab === "implementation";

  const loadSection = useCallback(() => {
    if (!guideId) return;
    if (isImplementation) return;
    const row = getSection(guideId, tab as any);
    setSection(row?.content ?? {});
  }, [guideId, tab, isImplementation]);

  useFocusEffect(
    useCallback(() => {
      loadSection();
    }, [loadSection])
  );

  return (
    <View style={{ flex: 1, backgroundColor: ZZ.colors.bg }}>
      <ZZHeader 
        onMenuPress={openMenu}
      />

      <GuideTabBar value={tab} onChange={setTab} />

      <View style={{ flex: 1 }}>
        {isImplementation ? (
          <ImplementationTab guideId={guideId} />
        ) : (
          <SectionViewer tab={tab} value={section ?? {}} />
        )}
      </View>
    </View>
  );
}

function ImplementationTab({ guideId }: { guideId: string }) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string>("all");
  const [selectedStepId, setSelectedStepId] = useState<string>("all");
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const [stepModalVisible, setStepModalVisible] = useState(false);

  const load = useCallback(() => {
    if (!guideId) return;
    const g = getGuideById(guideId);
    setGuide(g);
  }, [guideId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function getFirstIncompleteStepPosition(currentGuide: Guide) {
    const sortedStages = currentGuide.stages
      .slice()
      .sort((a, b) => a.stageNumber - b.stageNumber);

    for (const stage of sortedStages) {
      const sortedSteps = stage.steps.slice().sort((a, b) => a.stepNumber - b.stepNumber);
      for (const step of sortedSteps) {
        if (!step.isCompleted) {
          return { stageId: stage.id, stepId: step.id };
        }
      }
    }

    return null;
  }

  function getGuideProgress(currentGuide: Guide) {
    const allSteps = currentGuide.stages.flatMap((stage) => stage.steps);
    const total = allSteps.length;
    const completed = allSteps.filter((step) => step.isCompleted).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { completed, total, percent };
  }

  function getCurrentStageLabel(currentGuide: Guide) {
    const firstIncomplete = getFirstIncompleteStepPosition(currentGuide);
    if (!firstIncomplete) return "All stages complete";

    const stage = currentGuide.stages.find((s) => s.id === firstIncomplete.stageId);
    if (!stage) return "Current stage unavailable";

    return `Stage ${stage.stageNumber} — ${stage.title}`;
  }

  function getProgressStatusLabel(percent: number, currentGuide: Guide) {
    if (currentGuide.status === "complete") return "Completed";
    if (currentGuide.status === "cancelled") return "Cancelled";
    if (currentGuide.status === "ready_for_review") return "Ready for review";
    if (currentGuide.status === "ready_for_testing") return "Ready for testing";
    if (percent === 0) return "Not started";
    if (percent < 25) return "Getting started";
    if (percent < 50) return "Early build";
    if (percent < 75) return "Mid build";
    if (percent < 100) return "Finalising";
    return "All steps completed";
  }

  function goToCurrentStep() {
    if (!guide) return;

    const firstIncomplete = getFirstIncompleteStepPosition(guide);
    if (!firstIncomplete) return;

    setSelectedStageId(firstIncomplete.stageId);
    setSelectedStepId(firstIncomplete.stepId);
  }

  function markStepComplete(stepId: string) {
    if (!guide) return;
    if (guide.status !== "active") return;

    const firstIncomplete = getFirstIncompleteStepPosition(guide);
    if (!firstIncomplete) return;

    if (firstIncomplete.stepId !== stepId) {
      Alert.alert("Complete earlier steps first", "You must complete steps in order.");
      return;
    }

    const now = Date.now();

    const updatedStages = guide.stages.map((stage) => ({
      ...stage,
      steps: stage.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              isCompleted: true,
              completedAt: now,
            }
          : step
      ),
    }));

    const allStepsAfterUpdate = updatedStages.flatMap((stage) => stage.steps);
    const allCompleted = allStepsAfterUpdate.length > 0 && allStepsAfterUpdate.every((step) => step.isCompleted);

    const updatedGuide: Guide = {
      ...guide,
      status: allCompleted ? "ready_for_testing" : guide.status,
      updatedAt: now,
      stages: updatedStages,
    };

    updateGuide(updatedGuide);
    setGuide(updatedGuide);

    const nextIncomplete = getFirstIncompleteStepPosition(updatedGuide);
    if (nextIncomplete) {
      setSelectedStageId(nextIncomplete.stageId);
      setSelectedStepId(nextIncomplete.stepId);
    } else {
      setSelectedStageId("all");
      setSelectedStepId("all");
    }
  }

  function handleActivateGuide() {
    if (!guide) return;

    Alert.alert(
      "Activate guide",
      "This will make this the current active guide. Any other active guide will be deactivated.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          onPress: () => {
            activateGuide(guide.id);

            const refreshedGuide = getGuideById(guide.id);
            if (!refreshedGuide) return;

            setGuide(refreshedGuide);

            const firstIncomplete = getFirstIncompleteStepPosition(refreshedGuide);
            if (!firstIncomplete) {
              setSelectedStageId("all");
              setSelectedStepId("all");
              return;
            }

            setSelectedStageId(firstIncomplete.stageId);
            setSelectedStepId(firstIncomplete.stepId);
          },
        },
      ]
    );
  }

  function handleRevertGuide() {
    if (!guide) return;

    Alert.alert(
      "Revert guide",
      "This will set the guide back to inactive and remove all current progress. This cannot be undone.",
      [
        { text: "Keep guide", style: "cancel" },
        {
          text: "Revert",
          style: "destructive",
          onPress: () => {
            revertGuideToInactive(guide.id);

            const refreshedGuide = getGuideById(guide.id);
            if (!refreshedGuide) return;

            setGuide(refreshedGuide);
            setSelectedStageId("all");
            setSelectedStepId("all");
          },
        },
      ]
    );
  }

  function handleReadyForReview() {
    if (!guide) return;

    Alert.alert(
      "Move to review",
      "Mark this guide as ready for review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            markGuideReadyForReview(guide.id);
            load();
          },
        },
      ]
    );
  }

  function handleCompleteGuide() {
    if (!guide) return;

    Alert.alert(
      "Complete guide",
      "Mark this guide as complete?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () => {
            completeGuide(guide.id);
            load();
          },
        },
      ]
    );
  }

  function handleCancelGuide() {
    if (!guide) return;

    Alert.alert(
      "Cancel guide",
      "Cancel this guide? Progress will remain saved, but the guide will be marked as cancelled.",
      [
        { text: "Keep guide", style: "cancel" },
        {
          text: "Cancel guide",
          style: "destructive",
          onPress: () => {
            cancelGuide(guide.id);
            load();
          },
        },
      ]
    );
  }

  if (!guide) {
    return (
      <View style={{ paddingHorizontal: 18, paddingTop: 14 }}>
        <Text style={{ fontFamily: ZZ.fonts.body, opacity: 0.7 }}>
          Loading guide…
        </Text>
      </View>
    );
  }

  const sortedStages = guide.stages
    .slice()
    .sort((a, b) => a.stageNumber - b.stageNumber);

  const selectedStage =
    selectedStageId === "all"
      ? null
      : sortedStages.find((stage) => stage.id === selectedStageId) ?? null;

  const availableSteps = selectedStage
    ? selectedStage.steps.slice().sort((a, b) => a.stepNumber - b.stepNumber)
    : [];

  const filteredStages =
    selectedStageId === "all"
      ? sortedStages
      : sortedStages
          .filter((stage) => stage.id === selectedStageId)
          .map((stage) => {
            if (selectedStepId === "all") return stage;

            return {
              ...stage,
              steps: stage.steps.filter((step) => step.id === selectedStepId),
            };
          });

  const firstIncomplete = getFirstIncompleteStepPosition(guide);
  const progress = getGuideProgress(guide);
  const primaryLabel = getCurrentStageLabel(guide);
  const secondaryLabel = `${progress.percent}% • ${getProgressStatusLabel(progress.percent, guide)}`;
  const isActiveGuide = guide.status === "active";

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}>
        <View style={{ height: 6 }} />

        <Text
          style={{
            fontFamily: ZZ.fonts.body,
            fontSize: 18,
            color: ZZ.colors.ink,
            marginBottom: 8,
          }}
        >
          {guide.name}
        </Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.12)",
            borderRadius: 14,
            backgroundColor: "#fff",
            padding: 14,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontFamily: ZZ.fonts.body,
              color: ZZ.colors.ink,
              fontSize: 15,
              marginBottom: 4,
            }}
          >
            {primaryLabel}
          </Text>

          <Text
            style={{
              fontFamily: ZZ.fonts.body,
              color: ZZ.colors.faint,
              marginBottom: 10,
            }}
          >
            {secondaryLabel} • {progress.completed}/{progress.total} steps completed
          </Text>

          <View
            style={{
              height: 10,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.08)",
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: `${progress.percent}%`,
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.55)",
              }}
            />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <TouchableOpacity
              disabled={!isActiveGuide}
              onPress={goToCurrentStep}
              style={{
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.15)",
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: "#fff",
                opacity: isActiveGuide ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  fontFamily: ZZ.fonts.body,
                  color: isActiveGuide ? ZZ.colors.ink : "rgba(0,0,0,0.65)",
                }}
              >
                Current step
              </Text>
            </TouchableOpacity>

            {guide.status === "inactive" && (
              <TouchableOpacity
                onPress={handleActivateGuide}
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(46,125,50,0.35)",
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: "rgba(46,125,50,0.08)",
                }}
              >
                <Text style={{ fontFamily: ZZ.fonts.body, color: "#2e7d32" }}>
                  Activate guide
                </Text>
              </TouchableOpacity>
            )}

            {guide.status === "ready_for_testing" && (
              <TouchableOpacity
                onPress={handleReadyForReview}
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(239,108,0,0.35)",
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: "rgba(239,108,0,0.08)",
                }}
              >
                <Text style={{ fontFamily: ZZ.fonts.body, color: "#c25a00" }}>
                  Mark ready for review
                </Text>
              </TouchableOpacity>
            )}

            {guide.status === "ready_for_review" && (
              <TouchableOpacity
                onPress={handleCompleteGuide}
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(21,101,192,0.35)",
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: "rgba(21,101,192,0.08)",
                }}
              >
                <Text style={{ fontFamily: ZZ.fonts.body, color: "#1565c0" }}>
                  Mark complete
                </Text>
              </TouchableOpacity>
            )}

            {["active", "ready_for_testing", "ready_for_review"].includes(guide.status) && (
              <TouchableOpacity
                onPress={handleCancelGuide}
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(180,0,0,0.35)",
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: "rgba(180,0,0,0.06)",
                }}
              >
                <Text style={{ fontFamily: ZZ.fonts.body, color: "rgba(180,0,0,0.9)" }}>
                  Cancel guide
                </Text>
              </TouchableOpacity>
            )}
            {["cancelled", "complete", "ready_for_review", "ready_for_testing"].includes(guide.status) && (
              <TouchableOpacity
                onPress={handleRevertGuide}
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(120,0,120,0.35)",
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: "rgba(120,0,120,0.08)",
                }}
              >
                <Text style={{ fontFamily: ZZ.fonts.body, color: "rgba(120,0,120,0.9)" }}>
                  Revert guide
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 14 }}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Text
              style={{
                fontFamily: ZZ.fonts.body,
                color: ZZ.colors.ink,
                marginBottom: 6,
                fontSize: 14,
              }}
            >
              Stage
            </Text>

            <TouchableOpacity
              onPress={() => setStageModalVisible(true)}
              style={{
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.15)",
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: "#fff",
              }}
            >
              <Text
                style={{
                  fontFamily: ZZ.fonts.body,
                  color: ZZ.colors.ink,
                }}
                numberOfLines={1}
              >
                {selectedStageId === "all"
                  ? "All stages"
                  : `Stage ${
                      sortedStages.find((s) => s.id === selectedStageId)?.stageNumber
                    }`}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, marginLeft: 5 }}>
            <Text
              style={{
                fontFamily: ZZ.fonts.body,
                color: ZZ.colors.ink,
                marginBottom: 6,
                fontSize: 14,
              }}
            >
              Step
            </Text>

            <TouchableOpacity
              disabled={selectedStageId === "all"}
              onPress={() => setStepModalVisible(true)}
              style={{
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.15)",
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: "#fff",
                opacity: selectedStageId === "all" ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  fontFamily: ZZ.fonts.body,
                  color: ZZ.colors.ink,
                }}
                numberOfLines={1}
              >
                {selectedStageId === "all"
                  ? "Pick stage first"
                  : selectedStepId === "all"
                  ? "All steps"
                  : `Step ${
                      availableSteps.find((s) => s.id === selectedStepId)?.stepNumber
                    }`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredStages.length === 0 ? (
          <View style={{ paddingTop: 18 }}>
            <Text style={{ fontFamily: ZZ.fonts.body, opacity: 0.7 }}>
              No matching stages or steps found.
            </Text>
          </View>
        ) : (
          filteredStages.map((stage) => (
            <StageCard key={stage.id} title={`Stage ${stage.stageNumber} — ${stage.title}`}>
              {stage.steps.length === 0 ? (
                <Text style={{ fontFamily: ZZ.fonts.body, opacity: 0.7 }}>
                  No steps in this stage.
                </Text>
              ) : (
                stage.steps
                  .slice()
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((step) => {
                    const canMarkComplete =
                      !!firstIncomplete &&
                      firstIncomplete.stepId === step.id &&
                      firstIncomplete.stageId === stage.id;

                    return (
                      <StepBlock
                        key={step.id}
                        stepNumber={step.stepNumber}
                        instructionTitle={step.instructionTitle}
                        code={step.code}
                        explanation={step.explanation}
                        imageUri={step.imageUri}
                        attachmentName={step.attachmentName}
                        attachmentUrl={step.attachmentUrl}
                        isCompleted={step.isCompleted}
                        isActiveGuide={isActiveGuide}
                        canMarkComplete={canMarkComplete}
                        onMarkComplete={() => markStepComplete(step.id)}
                      />
                    );
                  })
              )}
            </StageCard>
          ))
        )}
      </ScrollView>

      <Modal visible={stageModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 18,
          }}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: "#fff",
              borderRadius: 18,
              padding: 18,
              maxHeight: "70%",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.12)",
            }}
          >
            <Text
              style={{
                fontFamily: ZZ.fonts.body,
                fontSize: 18,
                color: ZZ.colors.ink,
                marginBottom: 14,
              }}
            >
              Select Stage
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedStageId("all");
                  setSelectedStepId("all");
                  setStageModalVisible(false);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.15)",
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 10,
                  backgroundColor: "#fff",
                }}
              >
                <Text
                  style={{
                    fontFamily: ZZ.fonts.body,
                    color: ZZ.colors.ink,
                  }}
                >
                  All stages
                </Text>
              </TouchableOpacity>

              {sortedStages.map((stage) => (
                <TouchableOpacity
                  key={stage.id}
                  onPress={() => {
                    setSelectedStageId(stage.id);
                    setSelectedStepId("all");
                    setStageModalVisible(false);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.15)",
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    marginBottom: 10,
                    backgroundColor: "#fff",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: ZZ.fonts.body,
                      color: ZZ.colors.ink,
                    }}
                  >
                    Stage {stage.stageNumber} — {stage.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={() => setStageModalVisible(false)}>
              <Text
                style={{
                  paddingTop: 10,
                  fontFamily: ZZ.fonts.body,
                  color: "rgba(0,0,0,0.55)",
                  textAlign: "center",
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={stepModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 18,
          }}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: "#fff",
              borderRadius: 18,
              padding: 18,
              maxHeight: "70%",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.12)",
            }}
          >
            <Text
              style={{
                fontFamily: ZZ.fonts.body,
                fontSize: 18,
                color: ZZ.colors.ink,
                marginBottom: 14,
              }}
            >
              Select Step
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedStepId("all");
                  setStepModalVisible(false);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.15)",
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 10,
                  backgroundColor: "#fff",
                }}
              >
                <Text
                  style={{
                    fontFamily: ZZ.fonts.body,
                    color: ZZ.colors.ink,
                  }}
                >
                  All steps
                </Text>
              </TouchableOpacity>

              {availableSteps.map((step) => (
                <TouchableOpacity
                  key={step.id}
                  onPress={() => {
                    setSelectedStepId(step.id);
                    setStepModalVisible(false);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.15)",
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    marginBottom: 10,
                    backgroundColor: "#fff",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: ZZ.fonts.body,
                      color: ZZ.colors.ink,
                    }}
                  >
                    Step {step.stepNumber} — {step.instructionTitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={() => setStepModalVisible(false)}>
              <Text
                style={{
                  paddingTop: 10,
                  fontFamily: ZZ.fonts.body,
                  color: "rgba(0,0,0,0.55)",
                  textAlign: "center",
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SectionViewer({
  tab,
  value,
}: {
  tab: Exclude<GuideTabKey, "implementation">;
  value: any;
}) {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}>
      <View style={{ height: 10 }} />

      {tab === "overview" && (
        <>
          <ReadOnlyField
            label="What you're building"
            value={value.whatBuilding}
            defaultValue="Describe the solution in one clear paragraph. State what the system is, what it does, and the business outcome it supports."
          />
          <ReadOnlyField
            label="Who it's for (client profile)"
            value={value.whoFor}
            defaultValue="Describe the client profile and target users. Include who will use the system, what their goals are, and any important context about the business."
          />
          <ReadOnlyField
            label="Acceptance criteria (done means...)"
            value={value.acceptanceCriteriaText}
            defaultValue="- The core user journey works from start to finish.\n- The solution meets the required functional and non-functional requirements.\n- Security basics are in place.\n- The system is deployable and ready for hand-off."
            defaultSnippets={[
              "core user journey works from start to finish",
              "solution meets the required functional and non-functional requirements",
              "security basics are in place",
              "system is deployable and ready for hand-off",
            ]}
          />
        </>
      )}

      {tab === "architecture" && (
        <>
          <ReadOnlyField label="Frontend" value={value.techStack?.frontend} defaultValue="State the frontend technology and why it fits this project." />
          <ReadOnlyField label="Backend" value={value.techStack?.backend} defaultValue="State the backend technology and why it fits this project." />
          <ReadOnlyField label="Database" value={value.techStack?.db} defaultValue="State the database choice and why it fits the data model and scale." />
          <ReadOnlyField label="Auth" value={value.techStack?.auth} defaultValue="State the authentication approach (e.g. sessions, JWT, OAuth)." />
          <ReadOnlyField label="Hosting" value={value.techStack?.hosting} defaultValue="State where the frontend, backend, and database will be hosted." />
          <ReadOnlyArchitectureFlow
            label="High-level diagram"
            items={value.diagram}
          />
          <ReadOnlyField
            label="Key modules"
            value={value.modulesText}
            defaultValue="- Frontend UI modules\n- Backend API modules\n- Database / persistence layer\n- Auth / security services\n- Third-party integrations"
            defaultSnippets={[
              "frontend ui modules",
              "backend api modules",
              "database / persistence layer",
              "auth / security services",
              "third-party integrations",
            ]}
          />
        </>
      )}

      {tab === "requirements" && (
        <>
          <ReadOnlyField
            label="Functional requirements (FR1…)"
            value={value.functionalText}
            defaultValue="FR1: As a [user], I want to [...], so that [...].\nFR2: As an [admin], I want to [...], so that [...].\nFR3: ..."
            defaultSnippets={[
              "fr1: as a [user], i want to",
              "fr2: as an [admin], i want to",
              "fr3:",
            ]}
          />
          <ReadOnlyField
            label="Non-functional requirements"
            value={value.nonFunctionalText}
            defaultValue="Security: Define auth, validation, data protection.\nPerformance: Define acceptable response times/load expectations.\nAvailability: Define uptime/reliability expectations.\nMaintainability: Define code quality, modularity, documentation expectations.\nLogging: Define what should be logged and monitored.\nCompliance: Note GDPR or other legal/privacy considerations if relevant."
            defaultSnippets={[
              "security: define auth, validation, data protection",
              "performance: define acceptable response times/load expectations",
              "availability: define uptime/reliability expectations",
              "maintainability: define code quality, modularity, documentation expectations",
              "logging: define what should be logged and monitored",
              "compliance: note gdpr or other legal/privacy considerations if relevant",
            ]}
          />
          <ReadOnlyField
            label="Constraints"
            value={value.constraintsText}
            defaultValue="Time: State delivery deadline or target timeframe.\nBudget: State client budget or delivery constraints.\nHosting: State platform/provider limits.\nUser scale: Estimate users, traffic, and data growth.\nLegal/compliance: State any business or regulatory constraints."
            defaultSnippets={[
              "time: state delivery deadline or target timeframe",
              "budget: state client budget or delivery constraints",
              "hosting: state platform/provider limits",
              "user scale: estimate users, traffic, and data growth",
              "legal/compliance: state any business or regulatory constraints",
            ]}
          />
        </>
      )}

      {tab === "build_plan" && (
        <>
          <ReadOnlyField
            label="Milestones"
            value={value.milestonesText}
            defaultValue="MVP: Define the minimum client-ready version.\nv1: Define the first full release.\nv1.1: Define the first improvement pass."
            defaultSnippets={[
              "mvp: define the minimum client-ready version",
              "v1: define the first full release",
              "v1.1: define the first improvement pass",
            ]}
          />
          <ReadOnlyField
            label="Dependencies & risks"
            value={value.risksText}
            defaultValue="Dependencies: List anything this project depends on (client content, third-party APIs, access, domain, hosting).\nRisks: List likely delivery risks (scope creep, API instability, unclear requirements, tight deadlines).\nMitigations: State how you will reduce each risk."
            defaultSnippets={[
              "dependencies: list anything this project depends on",
              "risks: list likely delivery risks",
              "mitigations: state how you will reduce each risk",
            ]}
          />
        </>
      )}

      {tab === "security" && (
        <>
          <ReadOnlyField
            label="Auth strategy"
            value={value.authStrategy}
            defaultValue="State the authentication and authorization strategy. Explain whether this project uses sessions, JWT, OAuth, role-based access control, or another model, and why."
          />
          <ReadOnlyField
            label="Security checklist"
            value={value.checklistText}
            defaultValue="- Validate all input on the server\n- Use password hashing for stored credentials\n- Apply authorization checks to protected actions\n- Configure CORS properly\n- Store secrets in environment variables\n- Avoid committing keys to the repository\n- Apply rate limiting where needed\n- Log security-relevant events\n- Review relevant OWASP risks"
            defaultSnippets={[
              "validate all input on the server",
              "use password hashing for stored credentials",
              "apply authorization checks to protected actions",
              "configure cors properly",
              "store secrets in environment variables",
              "avoid committing keys to the repository",
              "apply rate limiting where needed",
              "log security-relevant events",
              "review relevant owasp risks",
            ]}
          />
        </>
      )}

      {tab === "database" && (
        <>
          <ReadOnlyField label="ERD notes" value={value.erdNotes} defaultValue="List the main entities, their relationships, and key attributes. State which objects own which data and how they relate." />
          <ReadOnlyField label="Migrations strategy" value={value.migrations} defaultValue="Explain how schema changes will be managed over time. Note migration order, rollback considerations, and deployment approach." />
          <ReadOnlyField label="Indexes & constraints" value={value.indexesConstraints} defaultValue="State primary keys, foreign keys, unique constraints, and any indexes needed for performance." />
          <ReadOnlyField label="Seed data" value={value.seedData} defaultValue="List any default roles, users, demo content, reference data, or lookup values that should exist when the system starts." />
          <ReadOnlyField label="Backup/restore" value={value.backupRestore} defaultValue="Explain how the database will be backed up and how restore would be performed if data is lost or corrupted." />
        </>
      )}

      {tab === "testing" && (
        <>
          <ReadOnlyField label="Unit tests" value={value.unit} defaultValue="List the most important services, utilities, and logic units that should have automated tests." />
          <ReadOnlyField label="API tests" value={value.api} defaultValue="List the most important endpoints and request/response cases to verify. Include success cases, failure cases, and authorization checks." />
          <ReadOnlyField
            label="Smoke checklist"
            value={value.smokeText}
            defaultValue="- App loads successfully\n- Authentication works\n- Core CRUD actions work\n- Validation errors display correctly\n- Protected routes are protected\n- Data persists correctly\n- No critical crashes during key user flows"
            defaultSnippets={[
              "app loads successfully",
              "authentication works",
              "core crud actions work",
              "validation errors display correctly",
              "protected routes are protected",
              "data persists correctly",
              "no critical crashes during key user flows",
            ]}
          />
          <ReadOnlyArchitectureFlow
            label="E2E (optional)"
            items={value.e2e}
          />
        </>
      )}

      {tab === "deployment" && (
        <>
          <ReadOnlyField label="Environments" value={value.environments} defaultValue="List the environments required (dev, staging, prod) and what each is used for." />
          <ReadOnlyArchitectureFlow
            label="Build & release steps"
            items={value.steps}
          />
          <ReadOnlyField
            label="CI/CD checklist"
            value={value.cicd}
            defaultValue="- Lint\n- Run tests\n- Build\n- Deploy\n- Run smoke checks\n- Monitor logs after release"
            defaultSnippets={[
              "lint",
              "run tests",
              "build",
              "deploy",
              "run smoke checks",
              "monitor logs after release",
            ]}
          />
          <ReadOnlyField label="Monitoring/logging" value={value.monitoring} defaultValue="Describe how logs, errors, uptime, and critical business events will be monitored after release." />
        </>
      )}

      {tab === "handoff" && (
        <>
          <ReadOnlyField label="Admin credentials handover" value={value.adminHandover} defaultValue="Explain how admin access, credentials, and sensitive setup information will be handed to the client securely." />
          <ReadOnlyField label="User guide (short)" value={value.userGuide} defaultValue="Write a short guide explaining how the client or end user should use the delivered system." />
          <ReadOnlyField label="Maintenance plan" value={value.maintenancePlan} defaultValue="State what support is included after delivery, what counts as a bug fix, and what counts as a change request." />
          <ReadOnlyField label="Pricing tiers" value={value.pricingTiers} defaultValue="Optional: Define support/update tiers such as minor updates, monthly maintenance, priority fixes, or retained support hours." />
        </>
      )}
    </ScrollView>
  );
}

function ReadOnlyField({
  label,
  value,
  defaultValue,
  defaultSnippets = [],
}: {
  label: string;
  value?: unknown;
  defaultValue?: string;
  defaultSnippets?: string[];
}) {
  function formatValue(input: unknown): string {
    if (input == null) return "";

    if (typeof input === "string") return input;

    if (Array.isArray(input)) {
      return input
        .map((item) => {
          if (typeof item === "string") return item;

          if (item?.text) {
            return `• ${item.text}`;
          }

          if (item?.key || item?.value) {
            return `${item.key ?? ""}: ${item.value ?? ""}`.trim();
          }

          return "";
        })
        .filter(Boolean)
        .join("\n");
    }

    if (
      typeof input === "object" &&
      "columns" in input &&
      "rows" in input
    ) {
      const table = input as any;

      return table.rows
        ?.map((row: any) =>
          table.columns
            ?.map((col: any) => `${col.label}: ${row.values?.[col.key] ?? ""}`)
            .join("\n")
        )
        .join("\n\n") ?? "";
    }

    if (typeof input === "object") {
      return Object.entries(input as Record<string, unknown>)
        .map(([key, val]) => {
          const heading = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (letter) => letter.toUpperCase());

          const formattedValue = formatValue(val);

          if (!formattedValue) {
            return "";
          }

          return `${heading}\n${formattedValue}`;
        })
        .filter(Boolean)
        .join("\n\n");
    }

    return String(input);
  }

  const displayValue = formatValue(value);

  const normalize = (text?: unknown) =>
    String(text ?? "")
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const cleanValue = normalize(displayValue);
  const cleanDefault = normalize(defaultValue);

  const matchesFullDefault =
    cleanValue.length > 0 && cleanValue === cleanDefault;

  const matchesTemplateSnippets =
    cleanValue.length > 0 &&
    defaultSnippets.length > 0 &&
    defaultSnippets.every((snippet) => cleanValue.includes(normalize(snippet)));

  const hasRealValue =
    cleanValue.length > 0 &&
    !matchesFullDefault &&
    !matchesTemplateSnippets;

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: ZZ.fonts.body, marginBottom: 6, color: ZZ.colors.ink }}>
        {label}
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: hasRealValue ? "rgba(0,0,0,0.35)" : "rgba(180,0,0,0.35)",
          borderRadius: 12,
          padding: 12,
          minHeight: 46,
          backgroundColor: "#fff",
        }}
      >
        <Text
          style={{
            fontFamily: ZZ.fonts.body,
            color: hasRealValue ? ZZ.colors.ink : "rgba(180,0,0,0.85)",
            lineHeight: 22,
            fontStyle: hasRealValue ? "normal" : "italic",
          }}
        >
          {hasRealValue ? displayValue : "Not yet added..."}
        </Text>
      </View>
    </View>
  );
}