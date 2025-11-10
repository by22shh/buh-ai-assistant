import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

interface TempUploadMeta {
  uploadId: string;
  originalName: string;
  mimeType: string;
  size: number;
  extension: string;
  createdAt: string;
}

const legacyStorageRoot = process.env.TEMPLATE_STORAGE_PATH;
const BASE_STORAGE_ROOT =
  process.env.TEMPLATE_STORAGE_ROOT ??
  legacyStorageRoot ??
  (process.env.NODE_ENV === "production"
    ? path.join(os.tmpdir(), "template-storage")
    : path.join(process.cwd(), "storage"));

const storageRoot = path.resolve(path.join(BASE_STORAGE_ROOT, "template-bodies"));
const tmpRoot = path.resolve(
  process.env.TEMPLATE_STORAGE_TMP_ROOT ??
    process.env.TEMPLATE_STORAGE_TMP_PATH ??
    path.join(BASE_STORAGE_ROOT, "tmp")
);

const META_SUFFIX = ".json";

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureStorageRoots() {
  await Promise.all([ensureDir(storageRoot), ensureDir(tmpRoot)]);
}

function buildTempFileName(uploadId: string, extension: string) {
  return `${uploadId}${extension}`;
}

function buildTempMetaPath(uploadId: string) {
  return path.join(tmpRoot, `${uploadId}${META_SUFFIX}`);
}

function sanitizeTemplateCode(code: string) {
  return code.replace(/[^a-zA-Z0-9/_-]+/g, "-");
}

export interface SaveTempUploadParams {
  fileBuffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface SaveTempUploadResult {
  uploadId: string;
  absolutePath: string;
  meta: TempUploadMeta;
}

export async function saveTempUpload({ fileBuffer, originalName, mimeType, size }: SaveTempUploadParams): Promise<SaveTempUploadResult> {
  await ensureStorageRoots();

  const uploadId = crypto.randomUUID();
  const extension = path.extname(originalName) || ".docx";
  const fileName = buildTempFileName(uploadId, extension);
  const absolutePath = path.join(tmpRoot, fileName);
  const meta: TempUploadMeta = {
    uploadId,
    originalName,
    mimeType,
    size,
    extension,
    createdAt: new Date().toISOString(),
  };

  await fs.writeFile(absolutePath, fileBuffer);
  await fs.writeFile(buildTempMetaPath(uploadId), JSON.stringify(meta, null, 2), "utf-8");

  return { uploadId, absolutePath, meta };
}

export async function loadTempUpload(uploadId: string) {
  await ensureStorageRoots();
  const metaPath = buildTempMetaPath(uploadId);
  const metaRaw = await fs.readFile(metaPath, "utf-8");
  const meta = JSON.parse(metaRaw) as TempUploadMeta;
  const filePath = path.join(tmpRoot, buildTempFileName(uploadId, meta.extension));
  const fileBuffer = await fs.readFile(filePath);
  return { meta, fileBuffer, filePath };
}

export async function discardTempUpload(uploadId: string) {
  const { meta } = await loadTempUpload(uploadId);
  const filePath = path.join(tmpRoot, buildTempFileName(uploadId, meta.extension));
  await Promise.allSettled([
    fs.unlink(filePath),
    fs.unlink(buildTempMetaPath(uploadId)),
  ]);
}

export interface FinalizeUploadParams {
  uploadId: string;
  templateCode: string;
  previousRelativePath?: string | null;
}

export interface FinalizeUploadResult {
  relativePath: string;
  absolutePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  docHash: string;
  originalName: string;
  buffer: Buffer;
}

export async function finalizeUpload({ uploadId, templateCode, previousRelativePath }: FinalizeUploadParams): Promise<FinalizeUploadResult> {
  const { meta, fileBuffer } = await loadTempUpload(uploadId);
  const sanitizedCode = sanitizeTemplateCode(templateCode);
  const templateDir = path.join(storageRoot, sanitizedCode);
  await ensureDir(templateDir);

  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const finalFileName = `${Date.now()}_${hash.slice(0, 8)}${meta.extension}`;
  const absolutePath = path.join(templateDir, finalFileName);
  await fs.writeFile(absolutePath, fileBuffer);

  if (previousRelativePath) {
    await deleteStoredFile(previousRelativePath);
  }

  await discardTempUpload(uploadId);

  return {
    relativePath: path.relative(storageRoot, absolutePath),
    absolutePath,
    fileName: meta.originalName,
    fileSize: meta.size,
    mimeType: meta.mimeType,
    docHash: hash,
    originalName: meta.originalName,
    buffer: fileBuffer,
  };
}

export async function deleteStoredFile(relativePath?: string | null) {
  if (!relativePath) return;
  const absolutePath = path.join(storageRoot, relativePath);
  await fs.rm(absolutePath, { force: true });
  const parentDir = path.dirname(absolutePath);
  try {
    const remainingEntries = await fs.readdir(parentDir);
    if (remainingEntries.length === 0) {
      await fs.rmdir(parentDir);
    }
  } catch (error) {
    // ignore errors when removing parent dir
  }
}

export function resolveStoredPath(relativePath: string) {
  return path.join(storageRoot, relativePath);
}

export async function ensureStorageReady() {
  await ensureStorageRoots();
}
