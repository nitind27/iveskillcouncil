import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  type CertificateTypeId,
  type CertificateDemoData,
  SAMPLE_CERTIFICATE_PRESETS,
} from "@/components/certificates/demo/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE_PATH = path.join(DATA_DIR, "certificate-templates-config.json");

async function readConfigFile(): Promise<{
  data: Record<CertificateTypeId, CertificateDemoData>;
  isDefault: boolean;
  updatedAt?: string;
}> {
  try {
    const raw = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    const stats = await fs.stat(CONFIG_FILE_PATH);
    if (parsed && typeof parsed === "object") {
      // Merge with sample presets to ensure all fields and all types are present
      const merged: Record<CertificateTypeId, CertificateDemoData> = {
        ...SAMPLE_CERTIFICATE_PRESETS,
        ...parsed,
      };
      return {
        data: merged,
        isDefault: false,
        updatedAt: stats.mtime.toISOString(),
      };
    }
  } catch {
    // Fall back to default
  }

  // Also try database if file wasn't found
  try {
    const dbRow = await prisma.globalSetting.findUnique({ where: { id: 1 } });
    const cfg = dbRow?.config as Record<string, unknown> | null;
    if (cfg && cfg.certificateTemplates && typeof cfg.certificateTemplates === "object") {
      const merged: Record<CertificateTypeId, CertificateDemoData> = {
        ...SAMPLE_CERTIFICATE_PRESETS,
        ...(cfg.certificateTemplates as Record<CertificateTypeId, CertificateDemoData>),
      };
      return {
        data: merged,
        isDefault: false,
        updatedAt: dbRow?.updatedAt?.toISOString(),
      };
    }
  } catch {
    // database offline or not initialized
  }

  return {
    data: SAMPLE_CERTIFICATE_PRESETS,
    isDefault: true,
  };
}

export async function GET() {
  try {
    const config = await readConfigFile();
    return NextResponse.json({
      success: true,
      ...config,
    });
  } catch (error) {
    console.error("Failed to read certificate templates config:", error);
    return NextResponse.json(
      {
        success: false,
        data: SAMPLE_CERTIFICATE_PRESETS,
        isDefault: true,
        error: "Failed to read configuration, using default presets",
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const existing = await readConfigFile();

    let updatedData: Record<CertificateTypeId, CertificateDemoData> = {
      ...existing.data,
    };

    if (body.data && typeof body.data === "object") {
      // Full replacement / bulk update
      updatedData = {
        ...updatedData,
        ...body.data,
      };
    } else if (body.type && body.singleTypeData && typeof body.singleTypeData === "object") {
      // Single certificate type update
      const typeKey = body.type as CertificateTypeId;
      updatedData[typeKey] = {
        ...updatedData[typeKey],
        ...body.singleTypeData,
      };
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid payload format. Expected 'data' object or 'type' with 'singleTypeData'." },
        { status: 400 }
      );
    }

    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Atomic write to file
    const tempFile = `${CONFIG_FILE_PATH}.tmp.${Date.now()}`;
    await fs.writeFile(tempFile, JSON.stringify(updatedData, null, 2), "utf-8");
    await fs.rename(tempFile, CONFIG_FILE_PATH);

    // Also attempt DB sync in background (non-blocking, tolerant to offline db)
    try {
      const existingDb = await prisma.globalSetting.findUnique({ where: { id: 1 } });
      const currentConfig = (existingDb?.config as Record<string, unknown>) || {};
      const newConfigJson = {
        ...currentConfig,
        certificateTemplates: updatedData,
      } as unknown as Prisma.InputJsonValue;

      await prisma.globalSetting.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          config: newConfigJson,
        },
        update: {
          config: newConfigJson,
        },
      });
    } catch {
      // Non-fatal if DB is offline or proxy not running
    }

    const updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: "Certificate templates configuration saved successfully",
      updatedAt,
      data: updatedData,
    });
  } catch (error) {
    console.error("Failed to save certificate templates config:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save configuration",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    try {
      await fs.unlink(CONFIG_FILE_PATH);
    } catch {
      // file might not exist
    }

    // Also clear from DB if possible
    try {
      const existingDb = await prisma.globalSetting.findUnique({ where: { id: 1 } });
      if (existingDb && existingDb.config) {
        const cfg = { ...(existingDb.config as Record<string, unknown>) };
        delete cfg.certificateTemplates;
        await prisma.globalSetting.update({
          where: { id: 1 },
          data: { config: cfg as unknown as Prisma.InputJsonValue },
        });
      }
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      message: "Certificate templates reset to factory default presets",
      data: SAMPLE_CERTIFICATE_PRESETS,
    });
  } catch (error) {
    console.error("Failed to reset certificate templates:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reset configuration",
      },
      { status: 500 }
    );
  }
}
