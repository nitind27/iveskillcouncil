import path from "path";
import { promises as fs } from "fs";

/** Stamp / signatures a franchise (ATC) uploads for its printed certificates and results. */
export type FranchiseDocumentSignatures = {
  atcStampUrl?: string;
  atcSignatureUrl?: string;
  atcSignatoryName?: string;
  coordinatorSignatureUrl?: string;
  coordinatorName?: string;
  updatedAt?: string;
};

export const SIGNATURE_SLOTS = ["atcStamp", "atcSignature", "coordinatorSignature"] as const;
export type SignatureSlot = (typeof SIGNATURE_SLOTS)[number];

export const SLOT_FIELD: Record<SignatureSlot, keyof FranchiseDocumentSignatures> = {
  atcStamp: "atcStampUrl",
  atcSignature: "atcSignatureUrl",
  coordinatorSignature: "coordinatorSignatureUrl",
};

const FILE_PATH = path.join(process.cwd(), "data", "franchise-document-signatures.json");

type Store = Record<string, FranchiseDocumentSignatures>;

async function readStore(): Promise<Store> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE_PATH, "utf-8"));
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function getFranchiseSignatures(franchiseId: string | bigint): Promise<FranchiseDocumentSignatures> {
  const store = await readStore();
  return store[String(franchiseId)] ?? {};
}

export async function getAllFranchiseSignatures(): Promise<Store> {
  return readStore();
}

export async function updateFranchiseSignatures(
  franchiseId: string | bigint,
  patch: Partial<FranchiseDocumentSignatures>
): Promise<FranchiseDocumentSignatures> {
  const store = await readStore();
  const key = String(franchiseId);
  const next: FranchiseDocumentSignatures = { ...(store[key] ?? {}) };
  for (const [k, v] of Object.entries(patch) as [keyof FranchiseDocumentSignatures, string | undefined][]) {
    if (v === undefined || v === null || v === "") delete next[k];
    else next[k] = v;
  }
  next.updatedAt = new Date().toISOString();
  store[key] = next;
  await writeStore(store);
  return next;
}
