import React, { useEffect, useMemo, useRef, useState } from "react";
import KeyboardAwareTextInput from "../components/KeyboardAwareTextInputTemp";
import { useKeyboardAwareScroll } from "../hooks/useKeyboardAwareScroll";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from "react-native";

import { ZZ } from "../theme/zzTheme";
import StepEditor, { StepDraft } from "../components/StepEditor";
import ZZHeader from "../components/ZZHeader";
import GuideTabBar, { GuideTabKey } from "../components/GuideTabBar";

import { Guide } from "../types/guide";
import { getGuideById, listGuides, updateGuide } from "../db/guidesRepo";
import { getSection, upsertSection, ensureDefaultSections } from "../db/guideSectionsRepo";
import { deleteStepImage } from "../utils/files";

import BulletListField from "../components/BulletListField";
import ChecklistField from "../components/CheckListField";
import StepListField from "../components/StepListField";
import KeyValueListField from "../components/KeyValueListField";
import SimpleTableField from "../components/SimpleTableField";
import ArchitectureFlowField from "../components/ArchitectureFlowField";

import type {
  BulletItem,
  ChecklistItem,
  StepItem,
  KeyValueItem,
  SimpleTableData,
} from "../types/sectionContent";

type StageDraft = {
  stageId: string;
  stageNumber: number;
  title: string;
  steps: StepDraft[];
};

type GuideOption = {
  id: string;
  name: string;
};

type SectionDrafts = {
  overview: {
    whatBuilding: string;
    whoFor: BulletItem[];
    acceptanceCriteriaText: ChecklistItem[];
  };
  architecture: {
    techStack: {
      frontend: string;
      backend: string;
      db: string;
      auth: string;
      hosting: string;
    };
    diagram: StepItem[];
    modulesText: BulletItem[];
  };
  requirements: {
    functionalText: BulletItem[];
    nonFunctionalText: BulletItem[];
    constraintsText: KeyValueItem[];
  };
  build_plan: {
    milestonesText: BulletItem[];
    risksText: {
      dependencies: BulletItem[];
      risks: BulletItem[];
      mitigations: BulletItem[];
    };
  };
  security: {
    authStrategy: string;
    checklistText: ChecklistItem[];
  };
  database: {
    erdNotes: BulletItem[];
    migrations: StepItem[];
    indexesConstraints: SimpleTableData;
    seedData: BulletItem[];
    backupRestore: StepItem[];
  };
  testing: {
    unit: BulletItem[];
    api: BulletItem[];
    smokeText: ChecklistItem[];
    e2e: StepItem[];
  };
  deployment: {
    environments: BulletItem[];
    steps: StepItem[];
    cicd: ChecklistItem[];
    monitoring: BulletItem[];
  };
  handoff: {
    adminHandover: BulletItem[];
    userGuide: StepItem[];
    maintenancePlan: BulletItem[];
    pricingTiers: SimpleTableData;
  };
};

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function emptySections(): SectionDrafts {
  return {
    overview: {
      whatBuilding: "",
      whoFor: [],
      acceptanceCriteriaText: [],
    },
    architecture: {
      techStack: {
        frontend: "",
        backend: "",
        db: "",
        auth: "",
        hosting: "",
      },
      diagram: [],
      modulesText: [],
    },
    requirements: {
      functionalText: [],
      nonFunctionalText: [],
      constraintsText: [],
    },
    build_plan: {
      milestonesText: [],
      risksText: {
        dependencies: [],
        risks: [],
        mitigations: [],
      },
    },
    security: {
      authStrategy: "",
      checklistText: [],
    },
    database: {
      erdNotes: [],
      migrations: [],
      indexesConstraints: {
        columns: [
          { key: "entity", label: "Entity" },
          { key: "type", label: "Type" },
          { key: "details", label: "Details" },
        ],
        rows: [],
      },
      seedData: [],
      backupRestore: [],
    },
    testing: {
      unit: [],
      api: [],
      smokeText: [],
      e2e: [],
    },
    deployment: {
      environments: [],
      steps: [],
      cicd: [],
      monitoring: [],
    },
    handoff: {
      adminHandover: [],
      userGuide: [],
      maintenancePlan: [],
      pricingTiers: {
        columns: [
          { key: "tier", label: "Tier" },
          { key: "price", label: "Price" },
          { key: "includes", label: "Includes" },
        ],
        rows: [],
      },
    },
  };
}

function Pill({
  label,
  onPress,
  variant = "outline",
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "outline" | "danger" | "solid";
  disabled?: boolean;
}) {
  const isDanger = variant === "danger";
  const isSolid = variant === "solid";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        borderWidth: 1,
        borderColor: isDanger ? "rgba(180,0,0,0.55)" : "rgba(0,0,0,0.45)",
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: isSolid ? "rgba(0,0,0,0.06)" : "transparent",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text
        style={{
          color: isDanger ? "rgba(180,0,0,0.9)" : "rgba(0,0,0,0.85)",
          fontFamily: ZZ.fonts.body,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function UpdateGuideScreen({ navigation, openMenu }: any) {
  const [tab, setTab] = useState<GuideTabKey>("overview");

  const [guideOptions, setGuideOptions] = useState<GuideOption[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>("");
  const [guidePickerOpen, setGuidePickerOpen] = useState(false);

  const [guideName, setGuideName] = useState("");
  const [loadingGuide, setLoadingGuide] = useState(false);

  const [sectionDrafts, setSectionDrafts] = useState<SectionDrafts>(emptySections());

  const [stageDraftsById, setStageDraftsById] = useState<Record<string, StageDraft>>({});
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [stagePickerOpen, setStagePickerOpen] = useState(false);

  const formScrollRef = useRef<ScrollView | null>(null);

  // Removed this line of code
  // const stepPositionsRef = useRef<Record<string, number>>({});

  const keyboardAware = useKeyboardAwareScroll(formScrollRef);

  const stagesSorted = useMemo(
    () => Object.values(stageDraftsById).sort((a, b) => a.stageNumber - b.stageNumber),
    [stageDraftsById]
  );

  const currentStage = useMemo(
    () => stageDraftsById[selectedStageId] ?? null,
    [stageDraftsById, selectedStageId]
  );

  const selectedGuideName = useMemo(
    () => guideOptions.find((g) => g.id === selectedGuideId)?.name ?? "Select Guide",
    [guideOptions, selectedGuideId]
  );

  const stageDropdownLabel = useMemo(
    () => (currentStage ? `Stage ${currentStage.stageNumber}` : "Select Stage"),
    [currentStage]
  );

  useEffect(() => {
    loadGuideOptions();
  }, []);

  function loadGuideOptions() {
    const result = listGuides(1, 500);
    setGuideOptions(result.guides.map((g) => ({ id: g.id, name: g.name })));
  }

  function scrollToLatestEditor() {
    requestAnimationFrame(() => {
      setTimeout(() => {
        formScrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });
  }

  // Removed these lines
  // function scrollFieldIntoView(targetY: number) {
  //  const topPadding = 140;
  //  const y = Math.max(0, targetY - topPadding);  
  //  formScrollRef.current?.scrollTo({ y, animated: true });
  //}

  function loadGuide(guideId: string) {
    try {
      setLoadingGuide(true);

      ensureDefaultSections(guideId);

      const guide = getGuideById(guideId);
      if (!guide) {
        Alert.alert("Guide not found", "The selected guide could not be loaded.");
        return;
      }

      setGuideName(guide.name);

      const stageMap: Record<string, StageDraft> = {};
      guide.stages.forEach((stage) => {
        stageMap[stage.id] = {
          stageId: stage.id,
          stageNumber: stage.stageNumber,
          title: stage.title,
          steps: stage.steps.map((s) => ({
            id: s.id,
            stepNumber: s.stepNumber,
            instructionTitle: s.instructionTitle,
            code: s.code,
            explanation: s.explanation,
            imageUri: s.imageUri,
            attachmentName: s.attachmentName,
            attachmentUrl: s.attachmentUrl,
            isCompleted: s.isCompleted ?? false,
            completedAt: s.completedAt,
          })),
        };
      });

      setStageDraftsById(stageMap);
      setSelectedStageId(guide.stages[0]?.id ?? "");

      const empty = emptySections();

      const overviewContent = getSection(guideId, "overview")?.content ?? {};
      const architectureContent = getSection(guideId, "architecture")?.content ?? {};
      const requirementsContent = getSection(guideId, "requirements")?.content ?? {};
      const buildPlanContent = getSection(guideId, "build_plan")?.content ?? {};
      const securityContent = getSection(guideId, "security")?.content ?? {};
      const databaseContent = getSection(guideId, "database")?.content ?? {};
      const testingContent = getSection(guideId, "testing")?.content ?? {};
      const deploymentContent = getSection(guideId, "deployment")?.content ?? {};
      const handoffContent = getSection(guideId, "handoff")?.content ?? {};

      setSectionDrafts({
        overview: {
          whatBuilding: overviewContent.whatBuilding ?? empty.overview.whatBuilding,
          whoFor: Array.isArray(overviewContent.whoFor) ? overviewContent.whoFor : empty.overview.whoFor,
          acceptanceCriteriaText: Array.isArray(overviewContent.acceptanceCriteriaText)
            ? overviewContent.acceptanceCriteriaText
            : empty.overview.acceptanceCriteriaText,
        },

        architecture: {
          techStack: {
            frontend: architectureContent.techStack?.frontend ?? empty.architecture.techStack.frontend,
            backend: architectureContent.techStack?.backend ?? empty.architecture.techStack.backend,
            db: architectureContent.techStack?.db ?? empty.architecture.techStack.db,
            auth: architectureContent.techStack?.auth ?? empty.architecture.techStack.auth,
            hosting: architectureContent.techStack?.hosting ?? empty.architecture.techStack.hosting,
          },
          diagram: Array.isArray(architectureContent.diagram) ? architectureContent.diagram : empty.architecture.diagram,
          modulesText: Array.isArray(architectureContent.modulesText)
            ? architectureContent.modulesText
            : empty.architecture.modulesText,
        },

        requirements: {
          functionalText: Array.isArray(requirementsContent.functionalText)
            ? requirementsContent.functionalText
            : empty.requirements.functionalText,
          nonFunctionalText: Array.isArray(requirementsContent.nonFunctionalText)
            ? requirementsContent.nonFunctionalText
            : empty.requirements.nonFunctionalText,
          constraintsText: Array.isArray(requirementsContent.constraintsText)
            ? requirementsContent.constraintsText
            : empty.requirements.constraintsText,
        },

        build_plan: {
          milestonesText: Array.isArray(buildPlanContent.milestonesText)
            ? buildPlanContent.milestonesText
            : empty.build_plan.milestonesText,
          risksText:
            buildPlanContent.risksText &&
            typeof buildPlanContent.risksText === "object" &&
            !Array.isArray(buildPlanContent.risksText)
              ? {
                  dependencies: Array.isArray(buildPlanContent.risksText.dependencies)
                    ? buildPlanContent.risksText.dependencies
                    : empty.build_plan.risksText.dependencies,
                  risks: Array.isArray(buildPlanContent.risksText.risks)
                    ? buildPlanContent.risksText.risks
                    : empty.build_plan.risksText.risks,
                  mitigations: Array.isArray(buildPlanContent.risksText.mitigations)
                    ? buildPlanContent.risksText.mitigations
                    : empty.build_plan.risksText.mitigations,
                }
              : empty.build_plan.risksText,
        },

        security: {
          authStrategy: securityContent.authStrategy ?? empty.security.authStrategy,
          checklistText: Array.isArray(securityContent.checklistText)
            ? securityContent.checklistText
            : empty.security.checklistText,
        },

        database: {
          erdNotes: Array.isArray(databaseContent.erdNotes) ? databaseContent.erdNotes : empty.database.erdNotes,
          migrations: Array.isArray(databaseContent.migrations) ? databaseContent.migrations : empty.database.migrations,
          indexesConstraints:
            databaseContent.indexesConstraints &&
            typeof databaseContent.indexesConstraints === "object" &&
            Array.isArray(databaseContent.indexesConstraints.columns) &&
            Array.isArray(databaseContent.indexesConstraints.rows)
              ? databaseContent.indexesConstraints
              : empty.database.indexesConstraints,
          seedData: Array.isArray(databaseContent.seedData) ? databaseContent.seedData : empty.database.seedData,
          backupRestore: Array.isArray(databaseContent.backupRestore)
            ? databaseContent.backupRestore
            : empty.database.backupRestore,
        },

        testing: {
          unit: Array.isArray(testingContent.unit) ? testingContent.unit : empty.testing.unit,
          api: Array.isArray(testingContent.api) ? testingContent.api : empty.testing.api,
          smokeText: Array.isArray(testingContent.smokeText) ? testingContent.smokeText : empty.testing.smokeText,
          e2e: Array.isArray(testingContent.e2e) ? testingContent.e2e : empty.testing.e2e,
        },

        deployment: {
          environments: Array.isArray(deploymentContent.environments)
            ? deploymentContent.environments
            : empty.deployment.environments,
          steps: Array.isArray(deploymentContent.steps) ? deploymentContent.steps : empty.deployment.steps,
          cicd: Array.isArray(deploymentContent.cicd) ? deploymentContent.cicd : empty.deployment.cicd,
          monitoring: Array.isArray(deploymentContent.monitoring)
            ? deploymentContent.monitoring
            : empty.deployment.monitoring,
        },

        handoff: {
          adminHandover: Array.isArray(handoffContent.adminHandover)
            ? handoffContent.adminHandover
            : empty.handoff.adminHandover,
          userGuide: Array.isArray(handoffContent.userGuide) ? handoffContent.userGuide : empty.handoff.userGuide,
          maintenancePlan: Array.isArray(handoffContent.maintenancePlan)
            ? handoffContent.maintenancePlan
            : empty.handoff.maintenancePlan,
          pricingTiers:
            handoffContent.pricingTiers &&
            typeof handoffContent.pricingTiers === "object" &&
            Array.isArray(handoffContent.pricingTiers.columns) &&
            Array.isArray(handoffContent.pricingTiers.rows)
              ? handoffContent.pricingTiers
              : empty.handoff.pricingTiers,
        },
      });
    } finally {
      setLoadingGuide(false);
    }
  }

  function setOverview(patch: Partial<SectionDrafts["overview"]>) {
    setSectionDrafts((prev) => ({
      ...prev,
      overview: { ...prev.overview, ...patch },
    }));
  }

  function setArchitecture(patch: Partial<SectionDrafts["architecture"]>) {
    setSectionDrafts((prev) => ({
      ...prev,
      architecture: { ...prev.architecture, ...patch },
    }));
  }

  function setRequirements(patch: Partial<SectionDrafts["requirements"]>) {
    setSectionDrafts((prev) => ({
      ...prev,
      requirements: { ...prev.requirements, ...patch },
    }));
  }

  function setBuildPlan(patch: Partial<SectionDrafts["build_plan"]>) {
    setSectionDrafts((prev) => ({
      ...prev,
      build_plan: { ...prev.build_plan, ...patch },
    }));
  }

  function setSecurity(patch: Partial<SectionDrafts["security"]>) {
    setSectionDrafts((prev) => ({
      ...prev,
      security: { ...prev.security, ...patch },
    }));
  }

  function setDatabase(patch: Partial<SectionDrafts["database"]>) {
    setSectionDrafts((prev) => ({
      ...prev,
      database: { ...prev.database, ...patch },
    }));
  }

  function setTesting(patch: Partial<SectionDrafts["testing"]>) {
    setSectionDrafts((prev) => ({
      ...prev,
      testing: { ...prev.testing, ...patch },
    }));
  }

  function setDeployment(patch: Partial<SectionDrafts["deployment"]>) {
    setSectionDrafts((prev) => ({
      ...prev,
      deployment: { ...prev.deployment, ...patch },
    }));
  }

  function setHandoff(patch: Partial<SectionDrafts["handoff"]>) {
    setSectionDrafts((prev) => ({
      ...prev,
      handoff: { ...prev.handoff, ...patch },
    }));
  }

  function updateStage(stageId: string, patch: Partial<StageDraft>) {
    setStageDraftsById((prev) => ({
      ...prev,
      [stageId]: { ...prev[stageId], ...patch },
    }));
  }

  function addStep() {
    if (!currentStage) return;

    const nextNumber =
      currentStage.steps.length === 0
        ? 1
        : Math.max(...currentStage.steps.map((s) => s.stepNumber)) + 1;

    const newStep: StepDraft = {
      id: makeId("step"),
      stepNumber: nextNumber,
      instructionTitle: "",
      code: "",
      explanation: "",
      imageUri: undefined,
      attachmentName: "",
      attachmentUrl: "",
      isCompleted: false,
      completedAt: undefined,
    };

    updateStage(currentStage.stageId, {
      steps: [...currentStage.steps, newStep],
    });

    scrollToLatestEditor();
  }  

  async function removeStep(stepId: string) {
    if (!currentStage) return;

    const toRemove = currentStage.steps.find((s) => s.id === stepId);
    if (!toRemove) return;
    if (toRemove.imageUri) await deleteStepImage(toRemove.imageUri);

    const remaining = currentStage.steps.filter((s) => s.id !== stepId);
    const renumbered = remaining
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((s, idx) => ({ ...s, stepNumber: idx + 1 }));

    updateStage(currentStage.stageId, { steps: renumbered });
  }

  function moveStep(stepId: string, dir: "up" | "down") {
    if (!currentStage) return;

    const arr = [...currentStage.steps].sort((a, b) => a.stepNumber - b.stepNumber);
    const idx = arr.findIndex((s) => s.id === stepId);
    const swapWith = dir === "up" ? idx - 1 : idx + 1;

    if (idx === -1 || swapWith < 0 || swapWith >= arr.length) return;

    [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];

    const renumbered = arr.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    updateStage(currentStage.stageId, { steps: renumbered });
  }

  function setStep(stepId: string, next: StepDraft) {
    if (!currentStage) return;
    updateStage(currentStage.stageId, {
      steps: currentStage.steps.map((s) => (s.id === stepId ? next : s)),
    });
  }

  function addStage() {
    const nextStageNumber =
      stagesSorted.length === 0
        ? 1
        : Math.max(...stagesSorted.map((s) => s.stageNumber)) + 1;

    const stageId = makeId("stage");
    const stepId = makeId("step");

    const newStage: StageDraft = {
      stageId,
      stageNumber: nextStageNumber,
      title: `Stage ${nextStageNumber}`,
      steps: [
        {
          id: stepId,
          stepNumber: 1,
          instructionTitle: "",
          code: "",
          explanation: "",
          imageUri: undefined,
          attachmentName: "",
          attachmentUrl: "",
          isCompleted: false,
          completedAt: undefined,
        },
      ],
    };

    setStageDraftsById((prev) => ({ ...prev, [stageId]: newStage }));
    setSelectedStageId(stageId);

    scrollToLatestEditor();
  }



  async function removeStage(stageId: string) {
    const draft = stageDraftsById[stageId];
    if (!draft) return;

    for (const st of draft.steps) {
      if (st.imageUri) await deleteStepImage(st.imageUri);
    }

    setStageDraftsById((prev) => {
      const copy = { ...prev };
      delete copy[stageId];

      const renumbered = Object.values(copy)
        .sort((a, b) => a.stageNumber - b.stageNumber)
        .map((s, idx) => ({ ...s, stageNumber: idx + 1 }));

      const next: Record<string, StageDraft> = {};
      for (const s of renumbered) next[s.stageId] = s;
      return next;
    });

    const remainingIds = stagesSorted
      .filter((s) => s.stageId !== stageId)
      .map((s) => s.stageId);

    setSelectedStageId(remainingIds[0] ?? "");
  }

  function moveStage(stageId: string, dir: "up" | "down") {
    const arr = [...stagesSorted];
    const idx = arr.findIndex((s) => s.stageId === stageId);
    const swapWith = dir === "up" ? idx - 1 : idx + 1;

    if (idx === -1 || swapWith < 0 || swapWith >= arr.length) return;

    [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];

    const renumbered = arr.map((s, i) => ({ ...s, stageNumber: i + 1 }));
    const next: Record<string, StageDraft> = {};
    for (const s of renumbered) next[s.stageId] = s;
    setStageDraftsById(next);
  }

  function saveGuide() {
    if (!selectedGuideId) {
      Alert.alert("Missing guide", "Please select a guide first.");
      return;
    }

    if (!guideName.trim()) {
      Alert.alert("Missing name", "Please enter a guide name.");
      return;
    }

    if (stagesSorted.length === 0) {
      Alert.alert("Missing stages", "Please add at least one stage.");
      return;
    }

    const original = getGuideById(selectedGuideId);
    if (!original) {
      Alert.alert("Guide not found", "The selected guide could not be loaded.");
      return;
    }

    const guide: Guide = {
      id: selectedGuideId,
      name: guideName.trim(),
      status: original.status,
      createdAt: original.createdAt,
      updatedAt: Date.now(),
      activatedAt: original.activatedAt,
      completedAt: original.completedAt,
      cancelledAt: original.cancelledAt,
      estimatedDurationDays: original.estimatedDurationDays,
      stages: stagesSorted.map((st) => ({
        id: st.stageId,
        stageNumber: st.stageNumber,
        title: st.title.trim() || `Stage ${st.stageNumber}`,
        steps: st.steps
          .slice()
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .map((s) => ({
            id: s.id,
            stepNumber: s.stepNumber,
            instructionTitle: s.instructionTitle || "Instruction title...",
            code: s.code || "",
            explanation: s.explanation || "",
            imageUri: s.imageUri,
            attachmentName: s.attachmentName || "",
            attachmentUrl: s.attachmentUrl || "",
            isCompleted: s.isCompleted ?? false,
            completedAt: s.completedAt,
          })),
      })),
    };

    updateGuide(guide);

    upsertSection(guide.id, "overview", sectionDrafts.overview);
    upsertSection(guide.id, "architecture", sectionDrafts.architecture);
    upsertSection(guide.id, "requirements", sectionDrafts.requirements);
    upsertSection(guide.id, "build_plan", sectionDrafts.build_plan);
    upsertSection(guide.id, "security", sectionDrafts.security);
    upsertSection(guide.id, "database", sectionDrafts.database);
    upsertSection(guide.id, "testing", sectionDrafts.testing);
    upsertSection(guide.id, "deployment", sectionDrafts.deployment);
    upsertSection(guide.id, "handoff", sectionDrafts.handoff);

    Alert.alert("Updated", "Guide updated successfully.");
    navigation.navigate("Home");
  }

  return (
    <View style={{ flex: 1, backgroundColor: ZZ.colors.bg }}>
      <ZZHeader onMenuPress={openMenu} />
      <GuideTabBar value={tab} onChange={setTab} />
      <ScrollView
        ref={formScrollRef}
        onScroll={keyboardAware.onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}
      >
        <View
          style={{
            marginTop: 10,
            borderWidth: 1,
            borderColor: ZZ.colors.ink,
            borderRadius: 12,
            padding: 18,
            backgroundColor: "#FFFFFF",
          }}
        >
          <Text
            style={{
              fontFamily: ZZ.fonts.body,
              fontSize: 30,
              textAlign: "center",
              marginBottom: 18,
            }}
          >
            Update guide
          </Text>

          <Text style={{ fontSize: 18, marginBottom: 10, fontFamily: ZZ.fonts.body }}>
            Guide Name:
          </Text>

          <Pressable
            onPress={() => setGuidePickerOpen(true)}
            style={{
              borderWidth: 1,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Text style={{ fontFamily: ZZ.fonts.body }}>
              {selectedGuideName}
            </Text>
            <Text style={{ fontSize: 18 }}>▾</Text>
          </Pressable>

          {selectedGuideId ? (
            <TextInput
              value={guideName}
              onChangeText={setGuideName}
              placeholder="e.g. FullStack Portfolio + Dashboard"
              placeholderTextColor="rgba(0,0,0,0.35)"
              style={{
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                fontFamily: ZZ.fonts.body,
              }}
            />
          ) : (
            <View
              style={{
                borderWidth: 1,
                borderColor: "rgba(180,0,0,0.35)",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Text style={{ color: "rgba(180,0,0,0.9)", fontFamily: ZZ.fonts.body }}>
                Please select a guide before editing.
              </Text>
            </View>
          )}

          {selectedGuideId && !loadingGuide && tab === "overview" && (
            <View style={{ marginTop: 18 }}>
              
              {/* KEEP THIS (text field stays) */}
              <SectionField
                label="What you're building"
                value={sectionDrafts.overview.whatBuilding}
                onChangeText={(t) => setOverview({ whatBuilding: t })}
                placeholder="Describe the solution in one clear paragraph..."
                multiline
                ensureVisible={keyboardAware.ensureVisible}
              />

              {/* 🔁 REPLACED: whoFor */}
              <BulletListField
                label="Who it's for (client profile)"
                items={sectionDrafts.overview.whoFor}
                onChange={(items) => setOverview({ whoFor: items })}
              />

              {/* 🔁 REPLACED: acceptanceCriteriaText */}
              <ChecklistField
                label="Acceptance criteria (done means...)"
                items={sectionDrafts.overview.acceptanceCriteriaText}
                onChange={(items) =>
                  setOverview({ acceptanceCriteriaText: items })
                }
              />
            </View>
          )}
          {selectedGuideId && !loadingGuide && tab === "architecture" && (
            <View style={{ marginTop: 18 }}>
              <SectionField
                label="Frontend"
                value={sectionDrafts.architecture.techStack.frontend}
                onChangeText={(t) =>
                  setArchitecture({
                    techStack: { ...sectionDrafts.architecture.techStack, frontend: t },
                  })
                }
                placeholder="State the frontend technology..."
                ensureVisible={keyboardAware.ensureVisible}
              />

              <SectionField
                label="Backend"
                value={sectionDrafts.architecture.techStack.backend}
                onChangeText={(t) =>
                  setArchitecture({
                    techStack: { ...sectionDrafts.architecture.techStack, backend: t },
                  })
                }
                placeholder="State the backend technology..."
                ensureVisible={keyboardAware.ensureVisible}
              />

              <SectionField
                label="Database"
                value={sectionDrafts.architecture.techStack.db}
                onChangeText={(t) =>
                  setArchitecture({
                    techStack: { ...sectionDrafts.architecture.techStack, db: t },
                  })
                }
                placeholder="State the database choice..."
                ensureVisible={keyboardAware.ensureVisible}
              />

              <SectionField
                label="Auth"
                value={sectionDrafts.architecture.techStack.auth}
                onChangeText={(t) =>
                  setArchitecture({
                    techStack: { ...sectionDrafts.architecture.techStack, auth: t },
                  })
                }
                placeholder="State the authentication approach..."
                ensureVisible={keyboardAware.ensureVisible}
              />

              <SectionField
                label="Hosting"
                value={sectionDrafts.architecture.techStack.hosting}
                onChangeText={(t) =>
                  setArchitecture({
                    techStack: { ...sectionDrafts.architecture.techStack, hosting: t },
                  })
                }
                placeholder="State where the solution will be hosted..."
                ensureVisible={keyboardAware.ensureVisible}
              />

              <ArchitectureFlowField
                label="High-level diagram"
                items={sectionDrafts.architecture.diagram}
                onChange={(items) => setArchitecture({ diagram: items })}
              />

              <BulletListField
                label="Key modules"
                items={sectionDrafts.architecture.modulesText}
                onChange={(items) => setArchitecture({ modulesText: items })}
              />
            </View>
          )}
          {/* ===================== REQUIREMENTS ===================== */}
          {selectedGuideId && !loadingGuide && tab === "requirements" && (
            <View style={{ marginTop: 18 }}>
              <BulletListField
                label="Functional requirements (FR1…)"
                items={sectionDrafts.requirements.functionalText}
                onChange={(items) => setRequirements({ functionalText: items })}
              />

              <BulletListField
                label="Non-functional requirements"
                items={sectionDrafts.requirements.nonFunctionalText}
                onChange={(items) => setRequirements({ nonFunctionalText: items })}
              />

              <KeyValueListField
                label="Constraints"
                items={sectionDrafts.requirements.constraintsText}
                onChange={(items) => setRequirements({ constraintsText: items })}
              />
            </View>
          )}

          {/* ===================== BUILD PLAN ===================== */}
          {selectedGuideId && !loadingGuide && tab === "build_plan" && (
            <View style={{ marginTop: 18 }}>
              <BulletListField
                label="Milestones"
                items={sectionDrafts.build_plan.milestonesText}
                onChange={(items) => setBuildPlan({ milestonesText: items })}
              />

              <BulletListField
                label="Dependencies"
                items={sectionDrafts.build_plan.risksText.dependencies}
                onChange={(items) =>
                  setBuildPlan({
                    risksText: {
                      ...sectionDrafts.build_plan.risksText,
                      dependencies: items,
                    },
                  })
                }
              />

              <BulletListField
                label="Risks"
                items={sectionDrafts.build_plan.risksText.risks}
                onChange={(items) =>
                  setBuildPlan({
                    risksText: {
                      ...sectionDrafts.build_plan.risksText,
                      risks: items,
                    },
                  })
                }
              />

              <BulletListField
                label="Mitigations"
                items={sectionDrafts.build_plan.risksText.mitigations}
                onChange={(items) =>
                  setBuildPlan({
                    risksText: {
                      ...sectionDrafts.build_plan.risksText,
                      mitigations: items,
                    },
                  })
                }
              />
            </View>
          )}

          {/* ===================== SECURITY ===================== */}
          {selectedGuideId && !loadingGuide && tab === "security" && (
            <View style={{ marginTop: 18 }}>
              <SectionField
                label="Auth strategy"
                value={sectionDrafts.security.authStrategy}
                onChangeText={(t) => setSecurity({ authStrategy: t })}
                placeholder="Describe the authentication strategy..."
                multiline
                ensureVisible={keyboardAware.ensureVisible}
              />

              <ChecklistField
                label="Security checklist"
                items={sectionDrafts.security.checklistText}
                onChange={(items) => setSecurity({ checklistText: items })}
              />
            </View>
          )}

          {/* ===================== DATABASE ===================== */}
          {selectedGuideId && !loadingGuide && tab === "database" && (
            <View style={{ marginTop: 18 }}>
              <BulletListField
                label="ERD notes"
                items={sectionDrafts.database.erdNotes}
                onChange={(items) => setDatabase({ erdNotes: items })}
              />

              <StepListField
                label="Migrations strategy"
                items={sectionDrafts.database.migrations}
                onChange={(items) => setDatabase({ migrations: items })}
              />

              <SimpleTableField
                label="Indexes & constraints"
                value={sectionDrafts.database.indexesConstraints}
                onChange={(value) => setDatabase({ indexesConstraints: value })}
              />

              <BulletListField
                label="Seed data"
                items={sectionDrafts.database.seedData}
                onChange={(items) => setDatabase({ seedData: items })}
              />

              <StepListField
                label="Backup/restore"
                items={sectionDrafts.database.backupRestore}
                onChange={(items) => setDatabase({ backupRestore: items })}
              />
            </View>
          )}

          {/* ===================== TESTING ===================== */}
          {selectedGuideId && !loadingGuide && tab === "testing" && (
            <View style={{ marginTop: 18 }}>
              <BulletListField
                label="Unit tests"
                items={sectionDrafts.testing.unit}
                onChange={(items) => setTesting({ unit: items })}
              />

              <BulletListField
                label="API tests"
                items={sectionDrafts.testing.api}
                onChange={(items) => setTesting({ api: items })}
              />

              <ChecklistField
                label="Smoke checklist"
                items={sectionDrafts.testing.smokeText}
                onChange={(items) => setTesting({ smokeText: items })}
              />

              <ArchitectureFlowField
                label="E2E (optional)"
                items={sectionDrafts.testing.e2e}
                onChange={(items) => setTesting({ e2e: items })}
              />
            </View>
          )}

          {/* ===================== DEPLOYMENT ===================== */}
          {selectedGuideId && !loadingGuide && tab === "deployment" && (
            <View style={{ marginTop: 18 }}>
              <BulletListField
                label="Environments"
                items={sectionDrafts.deployment.environments}
                onChange={(items) => setDeployment({ environments: items })}
              />

              <ArchitectureFlowField
                label="Build & release steps"
                items={sectionDrafts.deployment.steps}
                onChange={(items) => setDeployment({ steps: items })}
              />

              <ChecklistField
                label="CI/CD checklist"
                items={sectionDrafts.deployment.cicd}
                onChange={(items) => setDeployment({ cicd: items })}
              />

              <BulletListField
                label="Monitoring/logging"
                items={sectionDrafts.deployment.monitoring}
                onChange={(items) => setDeployment({ monitoring: items })}
              />
            </View>
          )}

          {/* ===================== HANDOFF ===================== */}
          {selectedGuideId && !loadingGuide && tab === "handoff" && (
            <View style={{ marginTop: 18 }}>
              <BulletListField
                label="Admin credentials handover"
                items={sectionDrafts.handoff.adminHandover}
                onChange={(items) => setHandoff({ adminHandover: items })}
              />

              <StepListField
                label="User guide (short)"
                items={sectionDrafts.handoff.userGuide}
                onChange={(items) => setHandoff({ userGuide: items })}
              />

              <BulletListField
                label="Maintenance plan"
                items={sectionDrafts.handoff.maintenancePlan}
                onChange={(items) => setHandoff({ maintenancePlan: items })}
              />

              <SimpleTableField
                label="Pricing tiers"
                value={sectionDrafts.handoff.pricingTiers}
                onChange={(value) => setHandoff({ pricingTiers: value })}
              />
            </View>
          )}

          {selectedGuideId && !loadingGuide && tab === "implementation" && (
            <>
              <View style={{ marginTop: 18 }}>
                <Text style={{ fontSize: 18, marginBottom: 10, fontFamily: ZZ.fonts.body }}>
                  Stage:
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <Pressable
                    onPress={() => setStagePickerOpen(true)}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontFamily: ZZ.fonts.body }}>{stageDropdownLabel}</Text>
                    <Text style={{ fontSize: 18 }}>▾</Text>
                  </Pressable>

                  <Pill label="+" variant="solid" onPress={addStage} />
                  <Pill
                    label="−"
                    variant="danger"
                    onPress={() => {
                      if (!currentStage) return;
                      if (stagesSorted.length === 1) {
                        Alert.alert("Cannot remove", "A guide must have at least one stage.");
                        return;
                      }
                      Alert.alert(
                        "Remove stage",
                        `Remove Stage ${currentStage.stageNumber}? This deletes all steps in it.`,
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Remove", style: "destructive", onPress: () => removeStage(currentStage.stageId) },
                        ]
                      );
                    }}
                    disabled={!currentStage || stagesSorted.length === 1}
                  />
                </View>

                <TextInput
                  value={currentStage?.title ?? ""}
                  onChangeText={(t) => currentStage && updateStage(currentStage.stageId, { title: t })}
                  placeholder="Stage title..."
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  style={{
                    marginTop: 10,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    fontFamily: ZZ.fonts.body,
                  }}
                />
              </View>

              <View style={{ marginTop: 18 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 18, marginBottom: 10, fontFamily: ZZ.fonts.body }}>
                    Steps:
                  </Text>
                </View>

                {!currentStage ? (
                  <Text style={{ opacity: 0.7 }}>Select a stage to edit.</Text>
                ) : (
                  currentStage.steps
                    .slice()
                    .sort((a, b) => a.stepNumber - b.stepNumber)
                    .map((s) => (
                      <View
                        key={s.id}
                        style={{ marginBottom: 2 }}
                        // Remove onLayout
                        // onLayout={(e) => {
                        //   stepPositionsRef.current[s.id] = e.nativeEvent.layout.y;
                        // }}
                      >
                        <StepEditor
                          guideId={selectedGuideId}
                          value={s}
                          onChange={(next) => setStep(s.id, next)}
                          onAddStep={addStep}
                          onRemove={() => {
                            if (currentStage.steps.length === 1) {
                              Alert.alert("Cannot remove", "A stage must have at least one step.");
                              return;
                            }
                            Alert.alert(
                              "Remove step",
                              `Remove Step ${String(s.stepNumber).padStart(2, "0")} from this stage?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                { text: "Remove", style: "destructive", onPress: () => removeStep(s.id) },
                              ]
                            );
                          }}
                          ensureVisible={keyboardAware.ensureVisible}
                        />
                      </View>
                    ))
                )}
              </View>
            </>
          )}

          {loadingGuide && (
            <View style={{ marginTop: 18 }}>
              <Text style={{ fontFamily: ZZ.fonts.body, opacity: 0.7 }}>
                Loading selected guide...
              </Text>
            </View>
          )}

          <View style={{ marginTop: 18, alignItems: "center", gap: 12 }}>
            <Pressable
              onPress={saveGuide}
              style={{
                borderWidth: 1,
                borderRadius: 22,
                paddingVertical: 12,
                paddingHorizontal: 26,
                minWidth: 220,
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: ZZ.fonts.body }}>Save Updates</Text>
            </Pressable>

            <Pill label="Cancel" variant="danger" onPress={() => navigation.goBack()} />
          </View>
        </View>

        <Modal visible={guidePickerOpen} transparent animationType="fade" onRequestClose={() => setGuidePickerOpen(false)}>
          <Pressable
            onPress={() => setGuidePickerOpen(false)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              justifyContent: "center",
              padding: 18,
            }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: "white",
                borderRadius: 14,
                borderWidth: 1,
                padding: 14,
                maxHeight: "70%",
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 10 }}>Select Guide</Text>

              <FlatList
                data={guideOptions}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setSelectedGuideId(item.id);
                      setGuidePickerOpen(false);
                      loadGuide(item.id);
                    }}
                    style={{
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                      backgroundColor:
                        selectedGuideId === item.id ? "rgba(0,0,0,0.06)" : "white",
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>{item.name}</Text>
                  </Pressable>
                )}
              />

              <Pressable
                onPress={() => setGuidePickerOpen(false)}
                style={{ marginTop: 12, alignSelf: "center", paddingVertical: 8 }}
              >
                <Text style={{ color: ZZ.colors.faint }}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={stagePickerOpen} transparent animationType="fade" onRequestClose={() => setStagePickerOpen(false)}>
          <Pressable
            onPress={() => setStagePickerOpen(false)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              justifyContent: "center",
              padding: 18,
            }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: "white",
                borderRadius: 14,
                borderWidth: 1,
                padding: 14,
                maxHeight: "70%",
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 10 }}>Select Stage</Text>

              <FlatList
                data={stagesSorted}
                keyExtractor={(item) => item.stageId}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setSelectedStageId(item.stageId);
                      setStagePickerOpen(false);
                    }}
                    style={{
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                      backgroundColor:
                        selectedStageId === item.stageId ? "rgba(0,0,0,0.06)" : "white",
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>Stage {item.stageNumber}</Text>
                    <Text style={{ opacity: 0.75, marginTop: 4 }}>{item.title}</Text>
                  </Pressable>
                )}
              />

              <Pressable
                onPress={() => setStagePickerOpen(false)}
                style={{ marginTop: 12, alignSelf: "center", paddingVertical: 8 }}
              >
                <Text style={{ color: ZZ.colors.faint }}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </View>
  );
}

function SectionField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  onFocus,
  ensureVisible,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  onFocus?: () => void;
  ensureVisible?: (input: TextInput | null, extraGap?: number) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontFamily: ZZ.fonts.body,
          marginBottom: 6,
          color: ZZ.colors.ink,
        }}
      >
        {label}
      </Text>

      <KeyboardAwareTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(0,0,0,0.35)"
        multiline={multiline}
        onFocus={onFocus}
        ensureVisible={ensureVisible}
        extraGap={multiline ? 40 : 24}
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.35)",
          borderRadius: 12,
          padding: 12,
          minHeight: multiline ? 120 : 46,
          textAlignVertical: multiline ? "top" : "center",
          fontFamily: ZZ.fonts.body,
          backgroundColor: "#fff",
        }}
      />
    </View>
  );
}