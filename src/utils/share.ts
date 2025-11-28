import LZString from "lz-string";
import type { Group } from "@/types";

/**
 * Upload group data via API route and return the shareable URL
 */
export async function createGroupGist(group: Group): Promise<string | null> {
  try {
    // Call our Next.js API route which will upload to dpaste.com
    const response = await fetch("/api/gists/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(group),
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        const text = await response.text().catch(() => "");
        errorData = { error: text || response.statusText };
      }

      const errorMessage = errorData.error || "Failed to create share link";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.url || null;
  } catch (error) {
    console.error("Error creating share link:", error);
    // Re-throw to allow caller to handle the error message
    throw error;
  }
}

/**
 * Fetch and decode group data from shared paste
 */
export async function fetchGroupFromGist(pasteId: string): Promise<Group | null> {
  try {
    // Fetch the paste from dpaste.com using the paste ID
    // Try different URL formats
    let pasteUrl = `https://dpaste.com/${pasteId}.txt`;
    let response = await fetch(pasteUrl, {
      headers: {
        "Accept": "text/plain",
      },
    });

    // If .txt doesn't work, try without extension
    if (!response.ok) {
      pasteUrl = `https://dpaste.com/${pasteId}`;
      response = await fetch(pasteUrl, {
        headers: {
          "Accept": "text/plain",
        },
      });
    }

    // If still not working, try raw format
    if (!response.ok) {
      pasteUrl = `https://dpaste.com/${pasteId}/raw`;
      response = await fetch(pasteUrl, {
        headers: {
          "Accept": "text/plain",
        },
      });
    }

    if (!response.ok) {
      console.error("Failed to fetch paste:", {
        status: response.status,
        statusText: response.statusText,
        pasteId,
        triedUrls: [`https://dpaste.com/${pasteId}.txt`, `https://dpaste.com/${pasteId}`, `https://dpaste.com/${pasteId}/raw`],
      });
      return null;
    }

    const compressed = await response.text();
    
    if (!compressed) {
      console.error("Paste is empty");
      return null;
    }

    // Decompress and parse the group data
    const decompressed = LZString.decompressFromBase64(compressed.trim());
    if (!decompressed) {
      console.error("Failed to decompress group data. Compressed length:", compressed.length);
      return null;
    }

    const group: Group = JSON.parse(decompressed);
    return group;
  } catch (error) {
    console.error("Error fetching group from paste:", error);
    return null;
  }
}
