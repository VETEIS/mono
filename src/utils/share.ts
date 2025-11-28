import LZString from "lz-string";
import type { Group } from "@/types";

/**
 * Upload group data to GitHub Gist via API route and return the shareable URL
 */
export async function createGroupGist(group: Group): Promise<string | null> {
  try {
    // Call our Next.js API route which will proxy the request to GitHub
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

      const errorMessage = errorData.error || "Failed to create gist";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.url || null;
  } catch (error) {
    console.error("Error creating GitHub Gist:", error);
    // Re-throw to allow caller to handle the error message
    throw error;
  }
}

/**
 * Fetch and decode group data from GitHub Gist
 */
export async function fetchGroupFromGist(gistUrl: string): Promise<Group | null> {
  try {
    // Extract gist ID from URL (handles both gist.github.com and api.github.com URLs)
    let gistId = "";
    if (gistUrl.includes("gist.github.com")) {
      // Extract from https://gist.github.com/username/gistId or https://gist.github.com/gistId
      const match = gistUrl.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]+)/i) || 
                    gistUrl.match(/gist\.github\.com\/([a-f0-9]+)/i);
      if (match) {
        gistId = match[1];
      }
    } else if (gistUrl.includes("api.github.com/gists")) {
      // Extract from API URL
      const match = gistUrl.match(/gists\/([a-f0-9]+)/i);
      if (match) {
        gistId = match[1];
      }
    } else {
      // Assume it's just the gist ID
      gistId = gistUrl;
    }

    if (!gistId) {
      console.error("Could not extract gist ID from URL:", gistUrl);
      return null;
    }

    // Fetch the gist from GitHub API
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch gist:", response.status);
      return null;
    }

    const gistData = await response.json();
    const file = gistData.files?.["group.json"];
    
    if (!file || !file.content) {
      console.error("Gist does not contain group.json file");
      return null;
    }

    // Decompress and parse the group data
    const decompressed = LZString.decompressFromBase64(file.content);
    if (!decompressed) {
      console.error("Failed to decompress group data");
      return null;
    }

    const group: Group = JSON.parse(decompressed);
    return group;
  } catch (error) {
    console.error("Error fetching group from Gist:", error);
    return null;
  }
}


