import LZString from "lz-string";
import type { Group } from "@/types";

/**
 * Upload group data via API route and return the shareable URL
 */
export async function createGroupGist(group: Group): Promise<string | null> {
  try {
    // Call our Next.js API route which will upload the file
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
 * Fetch and decode group data from shared file
 */
export async function fetchGroupFromGist(fileId: string): Promise<Group | null> {
  try {
    // Fetch the file from 0x0.st using the file ID
    // The file ID is the last part of the URL (e.g., abc123 from https://0x0.st/abc123.txt)
    const fileUrl = `https://0x0.st/${fileId}`;
    
    const response = await fetch(fileUrl, {
      headers: {
        "Accept": "text/plain",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch file:", response.status);
      return null;
    }

    const compressed = await response.text();
    
    if (!compressed) {
      console.error("File is empty");
      return null;
    }

    // Decompress and parse the group data
    const decompressed = LZString.decompressFromBase64(compressed.trim());
    if (!decompressed) {
      console.error("Failed to decompress group data");
      return null;
    }

    const group: Group = JSON.parse(decompressed);
    return group;
  } catch (error) {
    console.error("Error fetching group from file:", error);
    return null;
  }
}


