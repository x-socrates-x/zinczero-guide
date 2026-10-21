import * as FileSystem from "expo-file-system/legacy";

async function ensureDir(dirUri: string) {
  const info = await FileSystem.getInfoAsync(dirUri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
}

function extFromUri(uri: string) {
  const clean = uri.split("?")[0];
  const dot = clean.lastIndexOf(".");
  if (dot === -1) return "jpg";
  return clean.slice(dot + 1).toLowerCase();
}

export async function saveStepImagePermanently(params: {
  guideId: string;
  stepId: string;
  sourceUri: string;
}) {
  const { guideId, stepId, sourceUri } = params;

  const baseDir = `${FileSystem.documentDirectory}zz_images/`;
  const guideDir = `${baseDir}${guideId}/`;

  await ensureDir(baseDir);
  await ensureDir(guideDir);

  const ext = extFromUri(sourceUri);
  const destUri = `${guideDir}${stepId}.${ext}`;

  // Copy image into app sandbox
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });

  return destUri; // <- store this in SQLite
}

export async function deleteStepImage(uri?: string) {
  if (!uri) return;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // ignore delete errors (MVP-friendly)
  }
}

export async function deleteGuideImageFolder(guideId: string) {
  const dir = `${FileSystem.documentDirectory}zz_images/${guideId}/`;
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (info.exists) {
      await FileSystem.deleteAsync(dir, { idempotent: true });
    }
  } catch {
    // ignore (MVP-friendly)
  }
}