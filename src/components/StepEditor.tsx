import React, { useState } from "react"; // removed useRef from React
import { View, Text, TextInput, Pressable, Image, Alert } from "react-native"; // added TextInput
import KeyboardAwareTextInput from "./KeyboardAwareTextInputTemp";
import * as ImagePicker from "expo-image-picker";
import { ZZ } from "../theme/zzTheme";
import { saveStepImagePermanently, deleteStepImage } from "../utils/files";

function PillButton({
  label,
  onPress,
  variant = "outline",
}: {
  label: string;
  onPress: () => void;
  variant?: "outline" | "danger";
}) {
  const isDanger = variant === "danger";

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: isDanger ? "rgba(180,0,0,0.55)" : "rgba(0,0,0,0.45)",
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: "transparent",
      }}
    >
      <Text style={{ color: isDanger ? "rgba(180,0,0,0.9)" : "rgba(0,0,0,0.8)" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export type StepDraft = {
  id: string;
  stepNumber: number;
  instructionTitle: string;
  code: string;
  explanation: string;
  imageUri?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  isCompleted: boolean;
  completedAt?: number;
};

export default function StepEditor({
  guideId,
  value,
  onChange,
  onRemove,
  onAddStep,
  ensureVisible,
  // onFocusScroll,
}: {
  guideId: string;
  value: StepDraft;
  onChange: (next: StepDraft) => void;
  onRemove?: () => void;
  onAddStep?: () => void;
  ensureVisible?: (input: TextInput | null, extraGap?: number) => void;
  // onFocusScroll?: (fieldOffsetY: number) => void;
}) {
  // Removed this, since we're not using useRef anymore
  // const codeYRef = useRef(0);
  // const explanationYRef = useRef(0);

  const [showAttachmentFields, setShowAttachmentFields] = useState(
    !!value.attachmentName || !!value.attachmentUrl
  );

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access to attach code screenshots.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (res.canceled) return;

    const pickedUri = res.assets[0].uri;

    if (value.imageUri) {
      await deleteStepImage(value.imageUri);
    }

    const permanentUri = await saveStepImagePermanently({
      guideId,
      stepId: value.id,
      sourceUri: pickedUri,
    });

    onChange({ ...value, imageUri: permanentUri });
  }

  async function removeImage() {
    if (!value.imageUri) return;
    await deleteStepImage(value.imageUri);
    onChange({ ...value, imageUri: undefined });
  }

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: ZZ.colors.ink,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        padding: 16,
        marginBottom: 18,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 22, color: ZZ.colors.ink }}>
          Step {String(value.stepNumber).padStart(2, "0")}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {onAddStep ? (
            <View style={{ marginRight: 8 }}>
              <PillButton label="+ Add Step" onPress={onAddStep} />
            </View>
          ) : null}

          {onRemove ? (
            <PillButton label="Remove Step" variant="danger" onPress={onRemove} />
          ) : null}
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.2)", marginTop: 10 }} />

      <Text style={{ marginTop: 12, fontSize: 18, color: "rgba(0,0,0,0.75)" }}>
        Instruction Title
      </Text>

      <KeyboardAwareTextInput
        value={value.instructionTitle}
        onChangeText={(t) => onChange({ ...value, instructionTitle: t })}
        placeholder="Instruction title..."
        ensureVisible={ensureVisible}
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.25)",
          borderRadius: 10,
          padding: 10,
          marginTop: 10,
        }}
      />

      <View
        style={{
          marginTop: 12,
          borderWidth: 1,
          borderColor: ZZ.colors.faint, // replaced soft with faint
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <View
          style={{ padding: 12, minHeight: 120 }}
          // Removed onLayout
          // onLayout={(e) => {
          //   codeYRef.current = e.nativeEvent.layout.y;
          // }}
        >
          <KeyboardAwareTextInput
            value={value.code}
            onChangeText={(t) => onChange({ ...value, code: t })}
            placeholder="<Code>"
            multiline
            ensureVisible={ensureVisible}
            extraGap={40}
            style={{
              fontFamily: ZZ.fonts.mono,
              fontSize: 12,
              minHeight: 90,
              textAlignVertical: "top",
            }}
          />
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.15)",
            padding: 10,
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <Pressable onPress={pickImage}>
            <Text style={{ fontSize: 18 }}>🖼️</Text>
          </Pressable>

          <Pressable onPress={() => setShowAttachmentFields((prev) => !prev)}>
            <Text style={{ fontSize: 18 }}>🔗</Text>
          </Pressable>
        </View>

        <View
          style={{ padding: 12 }}
          // Removed onLayout
          // onLayout={(e) => {
          //   explanationYRef.current = e.nativeEvent.layout.y;
          // }}
        >
          <KeyboardAwareTextInput
            value={value.explanation}
            onChangeText={(t) => onChange({ ...value, explanation: t })}
            placeholder="Explanation"
            multiline
            ensureVisible={ensureVisible}
            extraGap={40}
            style={{
              minHeight: 70,
              textAlignVertical: "top",
            }}
          />
        </View>
      </View>

      {value.imageUri ? (
        <View style={{ marginTop: 12 }}>
          <Image
            source={{ uri: value.imageUri }}
            style={{ width: "100%", height: 180, borderRadius: 12 }}
            resizeMode="cover"
          />
          <Pressable onPress={removeImage} style={{ marginTop: 10 }}>
            <Text style={{ color: "red" }}>Remove image</Text>
          </Pressable>
        </View>
      ) : null}
      {showAttachmentFields ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 16, color: "rgba(0,0,0,0.75)" }}>
            Attachment Name
          </Text>

          <KeyboardAwareTextInput
            value={value.attachmentName || ""}
            onChangeText={(t) => onChange({ ...value, attachmentName: t })}
            placeholder="e.g. API Documentation"
            ensureVisible={ensureVisible}
            style={{
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.25)",
              borderRadius: 10,
              padding: 10,
              marginTop: 8,
            }}
          />

          <Text style={{ marginTop: 12, fontSize: 16, color: "rgba(0,0,0,0.75)" }}>
            Attachment Cloud Link
          </Text>

          <KeyboardAwareTextInput
            value={value.attachmentUrl || ""}
            onChangeText={(t) => onChange({ ...value, attachmentUrl: t })}
            placeholder="https://drive.google.com/..."
            ensureVisible={ensureVisible}
            style={{
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.25)",
              borderRadius: 10,
              padding: 10,
              marginTop: 8,
            }}
          />

          <Text style={{ marginTop: 8, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
            Use a shareable cloud link if you want exports to keep working outside the app.
          </Text>
        </View>
      ) : null}
    </View>
  );
}