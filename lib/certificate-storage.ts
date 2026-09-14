import {
  type CertificateTypeId,
  type CertificateDemoData,
  SAMPLE_CERTIFICATE_PRESETS,
} from "@/components/certificates/demo/types";

export const CERTIFICATE_STORAGE_KEY = "ivesdc_certificate_templates_config_v2";

/**
 * Uploads an image asset to /api/certificates/templates/upload.
 * If server is unreachable or errors, falls back to a base64 Data URL so the user
 * can continue editing without interruption.
 */
export async function uploadCertificateAsset(
  file: File,
  category: string = "asset"
): Promise<{ url: string; isServerUpload: boolean }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const res = await fetch("/api/certificates/templates/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.url === "string") {
        return { url: data.url, isServerUpload: true };
      }
    }
  } catch (err) {
    console.warn("Server upload failed, falling back to base64 Data URL:", err);
  }

  // Fallback to Base64 Data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ url: (reader.result as string) || "", isServerUpload: false });
    };
    reader.onerror = () => {
      resolve({ url: "", isServerUpload: false });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Loads saved configuration synchronously from localStorage on initial render.
 * Avoids any flash of default values if user has customized templates.
 */
export function loadInitialCertificateConfig(): Record<
  CertificateTypeId,
  CertificateDemoData
> {
  if (typeof window === "undefined") {
    return JSON.parse(JSON.stringify(SAMPLE_CERTIFICATE_PRESETS));
  }

  try {
    const local = localStorage.getItem(CERTIFICATE_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === "object") {
        return {
          ...SAMPLE_CERTIFICATE_PRESETS,
          ...parsed,
        };
      }
    }
  } catch {
    // Ignore localStorage parse error
  }

  return JSON.parse(JSON.stringify(SAMPLE_CERTIFICATE_PRESETS));
}

/**
 * Fetches the saved configuration from the server endpoint.
 */
export async function fetchServerCertificateConfig(): Promise<{
  data: Record<CertificateTypeId, CertificateDemoData>;
  isDefault: boolean;
  updatedAt?: string;
} | null> {
  try {
    const res = await fetch("/api/certificates/templates/config", {
      method: "GET",
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        // Also sync to localStorage
        try {
          localStorage.setItem(CERTIFICATE_STORAGE_KEY, JSON.stringify(json.data));
        } catch {
          // Ignore quota error
        }
        return {
          data: {
            ...SAMPLE_CERTIFICATE_PRESETS,
            ...json.data,
          },
          isDefault: !!json.isDefault,
          updatedAt: json.updatedAt,
        };
      }
    }
  } catch (err) {
    console.warn("Failed to fetch server certificate config:", err);
  }
  return null;
}

/**
 * Saves certificate configuration to both localStorage and the server.
 */
export async function saveCertificateConfigToServer(
  data: Record<CertificateTypeId, CertificateDemoData>
): Promise<{ success: boolean; updatedAt?: string; error?: string }> {
  // 1. Save immediately to localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CERTIFICATE_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("localStorage quota exceeded or unavailable:", err);
    }
  }

  // 2. Persist to server API
  try {
    const res = await fetch("/api/certificates/templates/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, updatedAt: json.updatedAt };
    }
    return { success: false, error: json.error || "Server rejected save" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error while saving",
    };
  }
}

/**
 * Resets configuration back to defaults on server and localStorage.
 */
export async function resetCertificateConfigOnServer(): Promise<{
  success: boolean;
  data: Record<CertificateTypeId, CertificateDemoData>;
}> {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(CERTIFICATE_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  try {
    const res = await fetch("/api/certificates/templates/config", {
      method: "DELETE",
    });
    if (res.ok) {
      const json = await res.json();
      return {
        success: true,
        data: json.data || JSON.parse(JSON.stringify(SAMPLE_CERTIFICATE_PRESETS)),
      };
    }
  } catch (err) {
    console.warn("Server reset error:", err);
  }

  return {
    success: true,
    data: JSON.parse(JSON.stringify(SAMPLE_CERTIFICATE_PRESETS)),
  };
}
