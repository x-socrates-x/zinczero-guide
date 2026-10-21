export type GuideStatus =
  | "inactive"
  | "active"
  | "ready_for_testing"
  | "ready_for_review"
  | "complete"
  | "cancelled";

export type GuideStep = {
  id: string;
  stepNumber: number;
  instructionTitle: string;
  code: string;
  explanation: string;
  imageUri?: string;
  isCompleted: boolean;
  completedAt?: number;
  attachmentName?: string;
  attachmentUrl?: string;
};

export type GuideStage = {
  id: string;
  stageNumber: number;
  title: string;
  steps: GuideStep[];
};

export type Guide = {
  id: string;
  name: string;
  status: GuideStatus;
  createdAt: number;
  updatedAt: number;
  activatedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  estimatedDurationDays?: number;
  stages: GuideStage[];
};