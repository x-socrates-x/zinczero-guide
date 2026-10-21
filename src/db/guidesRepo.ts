import { all, one, run } from "./db";
import { Guide, GuideStage, GuideStep } from "../types/guide";
import { deleteGuideImageFolder } from "../utils/files";

// Create using provided IDs (for full editor / permanent images)
export function createGuideFromObject(guide: Guide) {
  run(
    `INSERT INTO guides (
      id,
      name,
      status,
      created_at,
      updated_at,
      activated_at,
      completed_at,
      cancelled_at,
      estimated_duration_days
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      guide.id,
      guide.name,
      guide.status,
      guide.createdAt,
      guide.updatedAt,
      guide.activatedAt ?? null,
      guide.completedAt ?? null,
      guide.cancelledAt ?? null,
      guide.estimatedDurationDays ?? null,
    ]
  );

  for (const stage of guide.stages) {
    run(
      `INSERT INTO stages (id, guide_id, stage_number, title) VALUES (?, ?, ?, ?);`,
      [stage.id, guide.id, stage.stageNumber, stage.title]
    );

    for (const step of stage.steps) {
      run(
        `INSERT INTO steps (
          id,
          stage_id,
          step_number,
          instruction_title,
          code,
          explanation,
          image_uri,
          attachment_name,
          attachment_url,
          is_completed,
          completed_at
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          step.id,
          stage.id,
          step.stepNumber,
          step.instructionTitle,
          step.code,
          step.explanation,
          step.imageUri ?? null,
          step.attachmentName ?? null,
          step.attachmentUrl ?? null,
          step.isCompleted ? 1 : 0,
          step.completedAt ?? null,
        ]
      );
    }
  }

  return guide.id;
}

// Simple ID generator (good enough for MVP)
function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// 1) List guides for Home (with pagination)
export function listGuides(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;

  const rows = all<{
    id: string;
    name: string;
    status: Guide["status"];
    created_at: number;
    updated_at: number;
    activated_at: number | null;
    completed_at: number | null;
    cancelled_at: number | null;
    estimated_duration_days: number | null;
  }>(
    `SELECT
        id,
        name,
        status,
        created_at,
        updated_at,
        activated_at,
        completed_at,
        cancelled_at,
        estimated_duration_days
     FROM guides
     ORDER BY
       CASE
         WHEN status = 'active' THEN 0
         WHEN status = 'ready_for_testing' THEN 1
         WHEN status = 'ready_for_review' THEN 2
         WHEN status = 'inactive' THEN 3
         WHEN status = 'complete' THEN 4
         WHEN status = 'cancelled' THEN 5
         ELSE 6
       END,
       updated_at DESC
     LIMIT ? OFFSET ?;`,
    [pageSize, offset]
  );

  const totalRow = one<{ total: number }>(`SELECT COUNT(*) as total FROM guides;`);
  const total = totalRow?.total ?? 0;

  return {
    guides: rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status ?? "inactive",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      activatedAt: r.activated_at ?? undefined,
      completedAt: r.completed_at ?? undefined,
      cancelledAt: r.cancelled_at ?? undefined,
      estimatedDurationDays: r.estimated_duration_days ?? undefined,
      stages: [],
    })),
    total,
  };
}

// 2) Get full guide (viewer / update)
export function getGuideById(guideId: string): Guide | null {
  const g = one<{
    id: string;
    name: string;
    status: Guide["status"];
    created_at: number;
    updated_at: number;
    activated_at: number | null;
    completed_at: number | null;
    cancelled_at: number | null;
    estimated_duration_days: number | null;
  }>(
    `SELECT
        id,
        name,
        status,
        created_at,
        updated_at,
        activated_at,
        completed_at,
        cancelled_at,
        estimated_duration_days
     FROM guides
     WHERE id = ?;`,
    [guideId]
  );

  if (!g) return null;

  const stages = all<{ id: string; stage_number: number; title: string }>(
    `SELECT id, stage_number, title
     FROM stages
     WHERE guide_id = ?
     ORDER BY stage_number ASC;`,
    [guideId]
  );

  const stageObjects: GuideStage[] = stages.map((s) => {
    const steps = all<{
      id: string;
      step_number: number;
      instruction_title: string;
      code: string;
      explanation: string;
      image_uri: string | null;
      attachment_name: string | null;
      attachment_url: string | null;
      is_completed: number | null;
      completed_at: number | null;
    }>(
      `SELECT
          id,
          step_number,
          instruction_title,
          code,
          explanation,
          image_uri,
          attachment_name,
          attachment_url,
          is_completed,
          completed_at
       FROM steps
       WHERE stage_id = ?
       ORDER BY step_number ASC;`,
      [s.id]
    );

    const stepObjects: GuideStep[] = steps.map((st) => ({
      id: st.id,
      stepNumber: st.step_number,
      instructionTitle: st.instruction_title,
      code: st.code,
      explanation: st.explanation,
      imageUri: st.image_uri ?? undefined,
      attachmentName: st.attachment_name ?? undefined,
      attachmentUrl: st.attachment_url ?? undefined,
      isCompleted: st.is_completed === 1,
      completedAt: st.completed_at ?? undefined,
    }));

    return {
      id: s.id,
      stageNumber: s.stage_number,
      title: s.title,
      steps: stepObjects,
    };
  });

  return {
    id: g.id,
    name: g.name,
    status: g.status ?? "inactive",
    createdAt: g.created_at,
    updatedAt: g.updated_at,
    activatedAt: g.activated_at ?? undefined,
    completedAt: g.completed_at ?? undefined,
    cancelledAt: g.cancelled_at ?? undefined,
    estimatedDurationDays: g.estimated_duration_days ?? undefined,
    stages: stageObjects,
  };
}

// 3) Create a guide (Create screen)
export function createGuide(input: {
  name: string;
  estimatedDurationDays?: number;
  stages?: Array<{
    stageNumber: number;
    title: string;
    steps?: Array<Omit<GuideStep, "id">>;
  }>;
}): string {
  const guideId = id("guide");
  const now = Date.now();

  run(
    `INSERT INTO guides (
      id,
      name,
      status,
      created_at,
      updated_at,
      activated_at,
      completed_at,
      cancelled_at,
      estimated_duration_days
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      guideId,
      input.name,
      "inactive",
      now,
      now,
      null,
      null,
      null,
      input.estimatedDurationDays ?? null,
    ]
  );

  const stages = input.stages ?? [];
  for (const s of stages) {
    const stageId = id("stage");
    run(
      `INSERT INTO stages (id, guide_id, stage_number, title) VALUES (?, ?, ?, ?);`,
      [stageId, guideId, s.stageNumber, s.title]
    );

    const steps = s.steps ?? [];
    for (const step of steps) {
      const stepId = id("step");
      run(
        `INSERT INTO steps (
          id,
          stage_id,
          step_number,
          instruction_title,
          code,
          explanation,
          image_uri,
          attachment_name,
          attachment_url,
          is_completed,
          completed_at
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          stepId,
          stageId,
          step.stepNumber,
          step.instructionTitle,
          step.code,
          step.explanation,
          step.imageUri ?? null,
          step.attachmentName ?? null,
          step.attachmentUrl ?? null,
          step.isCompleted ? 1 : 0,
          step.completedAt ?? null,
        ]
      );
    }
  }

  return guideId;
}

// 4) Update a guide (simple + reliable approach: replace children)
export function updateGuide(guide: Guide) {
  const now = Date.now();

  run(
    `UPDATE guides
     SET
       name = ?,
       status = ?,
       updated_at = ?,
       activated_at = ?,
       completed_at = ?,
       cancelled_at = ?,
       estimated_duration_days = ?
     WHERE id = ?;`,
    [
      guide.name,
      guide.status,
      now,
      guide.activatedAt ?? null,
      guide.completedAt ?? null,
      guide.cancelledAt ?? null,
      guide.estimatedDurationDays ?? null,
      guide.id,
    ]
  );

  // Replace stages+steps (safe MVP approach)
  // Because of ON DELETE CASCADE, deleting stages deletes steps
  run(`DELETE FROM stages WHERE guide_id = ?;`, [guide.id]);

  for (const s of guide.stages) {
    const stageId = s.id || id("stage");
    run(
      `INSERT INTO stages (id, guide_id, stage_number, title) VALUES (?, ?, ?, ?);`,
      [stageId, guide.id, s.stageNumber, s.title]
    );

    for (const st of s.steps) {
      const stepId = st.id || id("step");
      run(
        `INSERT INTO steps (
          id,
          stage_id,
          step_number,
          instruction_title,
          code,
          explanation,
          image_uri,
          attachment_name,
          attachment_url,
          is_completed,
          completed_at
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          stepId,
          stageId,
          st.stepNumber,
          st.instructionTitle,
          st.code,
          st.explanation,
          st.imageUri ?? null,
          st.attachmentName ?? null,
          st.attachmentUrl ?? null,
          st.isCompleted ? 1 : 0,
          st.completedAt ?? null,
        ]
      );
    }
  }
}

// 5) Enforce only one active guide at a time
export function activateGuide(guideId: string) {
  const now = Date.now();

  run(`UPDATE guides SET status = 'inactive', updated_at = ? WHERE status = 'active' AND id != ?;`, [
    now,
    guideId,
  ]);

  run(
    `UPDATE guides
     SET status = 'active',
         activated_at = COALESCE(activated_at, ?),
         updated_at = ?
     WHERE id = ?;`,
    [now, now, guideId]
  );
}

export function markGuideReadyForTesting(guideId: string) {
  run(
    `UPDATE guides
     SET status = 'ready_for_testing',
         updated_at = ?
     WHERE id = ?;`,
    [Date.now(), guideId]
  );
}

export function markGuideReadyForReview(guideId: string) {
  run(
    `UPDATE guides
     SET status = 'ready_for_review',
         updated_at = ?
     WHERE id = ?;`,
    [Date.now(), guideId]
  );
}

export function completeGuide(guideId: string) {
  const now = Date.now();

  run(
    `UPDATE guides
     SET status = 'complete',
         completed_at = ?,
         updated_at = ?
     WHERE id = ?;`,
    [now, now, guideId]
  );
}

export function cancelGuide(guideId: string) {
  const now = Date.now();

  run(
    `UPDATE guides
     SET status = 'cancelled',
         cancelled_at = ?,
         updated_at = ?
     WHERE id = ?;`,
    [now, now, guideId]
  );
}

// 6) Delete a guide (Delete screen)
export async function deleteGuide(guideId: string) {
  // Remove images from app storage first
  await deleteGuideImageFolder(guideId);

  // Then delete DB rows (stages/steps cascade)
  run(`DELETE FROM guides WHERE id = ?;`, [guideId]);
}

export function seedGuides(count = 12) {
  for (let i = 1; i <= count; i++) {
    createGuide({ name: `Guide #${i}` });
  }
}

// 7) Revert a guide's status
export function revertGuideToInactive(guideId: string) {
  const guide = getGuideById(guideId);
  if (!guide) return;

  const resetStages = guide.stages.map((stage) => ({
    ...stage,
    steps: stage.steps.map((step) => ({
      ...step,
      isCompleted: false,
      completedAt: undefined,
    })),
  }));

  const updatedGuide: Guide = {
    ...guide,
    status: "inactive",
    updatedAt: Date.now(),
    stages: resetStages,
  };
  updateGuide(updatedGuide);
}