import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { Guide } from "../types/guide";
import * as ImageManipulator from "expo-image-manipulator";
import { Asset } from "expo-asset";

const imageDataUriCache = new Map<string, string>();

async function ensureDir(dirUri: string) {
  const info = await FileSystem.getInfoAsync(dirUri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
}

function safeFileName(name: string) {
  return name
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function escapeHtml(str: string) {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function imageToDataUri(uri: string) {
  const cached = imageDataUriCache.get(uri);
  if (cached) return cached;

  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG }
  );

  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const dataUri = `data:image/jpeg;base64,${base64}`;
  imageDataUriCache.set(uri, dataUri);
  return dataUri;
}

export function guideToMarkdown(guide: Guide) {
  const lines: string[] = [];

  lines.push(`# ${guide.name}`);
  lines.push(``);
  lines.push(`- Created: ${new Date(guide.createdAt).toLocaleString()}`);
  lines.push(`- Updated: ${new Date(guide.updatedAt).toLocaleString()}`);
  lines.push(``);

  for (const stage of guide.stages.sort((a, b) => a.stageNumber - b.stageNumber)) {
    lines.push(`## Stage ${stage.stageNumber}: ${stage.title}`);
    lines.push(``);

    for (const step of stage.steps.sort((a, b) => a.stepNumber - b.stepNumber)) {
      lines.push(`### Step ${String(step.stepNumber).padStart(2, "0")}: ${step.instructionTitle}`);
      lines.push(``);

      lines.push(`**Code:**`);
      lines.push("```");
      lines.push(step.code || "");
      lines.push("```");
      lines.push(``);

      lines.push(`**Explanation:**`);
      lines.push(step.explanation || "");
      lines.push(``);

      if (step.imageUri) {
        lines.push(`**Image:** (attached in the app; export PDF for embedded images)`);
        lines.push(``);
      }

      if (step.attachmentName || step.attachmentUrl) {
        lines.push(`**Attachment Name:** ${step.attachmentName || ""}`);
        lines.push(`**Attachment Cloud Link:** ${step.attachmentUrl || ""}`);
        lines.push(``);
      }
    }
  }

  return lines.join("\n");
}

export function guideToJson(guide: Guide) {
  return JSON.stringify(guide, null, 2);
}

export async function exportGuideAsMarkdownFile(guide: Guide) {
  const dir = `${FileSystem.cacheDirectory}zz_exports/`;
  await ensureDir(dir);

  const filename = `${safeFileName(guide.name)}.md`;
  const uri = `${dir}${filename}`;

  await FileSystem.writeAsStringAsync(uri, guideToMarkdown(guide), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return uri;
}

export async function exportGuideAsJsonFile(guide: Guide) {
  const dir = `${FileSystem.cacheDirectory}zz_exports/`;
  await ensureDir(dir);

  const filename = `${safeFileName(guide.name)}.json`;
  const uri = `${dir}${filename}`;

  await FileSystem.writeAsStringAsync(uri, guideToJson(guide), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return uri;
}

async function bundledImageAssetToDataUri(moduleId: number) {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();

  const base64 = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return `data:image/png;base64,${base64}`;
}

export async function exportGuideAsPdfFile(guide: Guide) {
  const logoDataUri = await bundledImageAssetToDataUri(
    require("../assets/images/zz-ios-logo.png")
  );

  let body = `
    <div class="cover">
      <img class="coverLogo" src="${logoDataUri}" />
      <div class="title">ZincZero Guide</div>
      <div class="subtitle">${escapeHtml(guide.name)}</div>
      <div class="meta">
        Created: ${escapeHtml(new Date(guide.createdAt).toLocaleString())}<br/>
        Updated: ${escapeHtml(new Date(guide.updatedAt).toLocaleString())}
      </div>
    </div>
  `;

  for (const stage of guide.stages.sort((a, b) => a.stageNumber - b.stageNumber)) {
    body += `<h2>Stage ${stage.stageNumber}: ${escapeHtml(stage.title)}</h2>`;

    for (const step of stage.steps.sort((a, b) => a.stepNumber - b.stepNumber)) {
      body += `
        <div class="step">
          <div class="stepTitle">
            Step ${String(step.stepNumber).padStart(2, "0")}: ${escapeHtml(step.instructionTitle)}
          </div>

          <div class="label">Code</div>
          <pre class="code"><code>${escapeHtml(step.code || "")}</code></pre>

          <div class="label">Explanation</div>
          <div class="explain">${escapeHtml(step.explanation || "")}</div>
      `;

      if (step.imageUri) {
        try {
          const dataUri = await imageToDataUri(step.imageUri);
          body += `<img class="img" src="${dataUri}" />`;
        } catch {
          body += `<div class="warn">[Image could not be embedded]</div>`;
        }
      }

      if (step.attachmentName || step.attachmentUrl) {
        body += `
          <div class="label">Attachment</div>
          <div class="attachmentBox">
            ${
              step.attachmentName
                ? `<div class="attachmentName">${escapeHtml(step.attachmentName)}</div>`
                : ""
            }
            ${
              step.attachmentUrl
                ? `<a class="attachmentLink" href="${escapeHtml(step.attachmentUrl)}">${escapeHtml(step.attachmentUrl)}</a>`
                : ""
            }
          </div>
        `;
      }

      body += `</div>`;
    }
  }

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            padding: 22px;
            color: #111;
          }

          .title {
            text-align: center;
            font-size: 26px;
            font-weight: 700;
            margin-top: 4px;
          }

          .subtitle {
            text-align: center;
            font-size: 18px;
            margin-top: 10px;
          }

          .meta {
            text-align: center;
            opacity: 0.75;
            margin-top: 10px;
            margin-bottom: 24px;
            font-size: 12px;
          }

          h2 {
            margin-top: 22px;
            border-top: 1px solid rgba(0, 0, 0, 0.2);
            padding-top: 16px;
          }

          .step {
            border: 1px solid rgba(0, 0, 0, 0.25);
            border-radius: 12px;
            padding: 14px;
            margin-top: 14px;
          }

          .stepTitle {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 10px;
          }

          .label {
            font-size: 12px;
            font-weight: 700;
            margin-top: 10px;
            opacity: 0.85;
          }

          .code {
            background: #f6f6f6;
            border-radius: 10px;
            padding: 12px;
            overflow-x: auto;
            white-space: pre-wrap;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
              "Liberation Mono", "Courier New", monospace;
            font-size: 11px;
          }

          .explain {
            font-size: 12px;
            margin-top: 8px;
            white-space: pre-wrap;
          }

          .img {
            width: 100%;
            max-height: 380px;
            object-fit: contain;
            margin-top: 12px;
            border-radius: 10px;
            border: 1px solid rgba(0, 0, 0, 0.2);
          }

          .warn {
            margin-top: 10px;
            color: #900;
            font-size: 12px;
          }

          .cover {
            text-align: center;
            margin-top: 6px;
            margin-bottom: 18px;
          }

          .coverLogo {
            width: 96px;
            height: 96px;
            object-fit: contain;
            margin: 0 auto;
            display: block;
          }

          .attachmentBox {
            margin-top: 8px;
            padding: 12px;
            border: 1px solid rgba(0, 0, 0, 0.15);
            border-radius: 10px;
            background: #f8f8f8;
          }

          .attachmentName {
            font-size: 12px;
            font-weight: 600;
            color: #111;
            margin-bottom: 6px;
            word-break: break-word;
          }

          .attachmentLink {
            font-size: 11px;
            color: #1565c0;
            text-decoration: underline;
            word-break: break-all;
          }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `;

  const fileName = safeFileName(guide.name);

  const result = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const dir = `${FileSystem.cacheDirectory}zz_exports/`;
  await ensureDir(dir);

  const destUri = `${dir}${fileName}.pdf`;
  await FileSystem.copyAsync({ from: result.uri, to: destUri });

  return destUri;
}