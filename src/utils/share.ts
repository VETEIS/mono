import LZString from "lz-string";
import type { Group } from "@/types";

/**
 * Encode group data for sharing via URL
 * Uses LZ-String compression + base64 encoding
 */
export function encodeGroupForShare(group: Group): string {
  try {
    const jsonString = JSON.stringify(group);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    return compressed;
  } catch (error) {
    console.error("Error encoding group for share:", error);
    throw new Error("Failed to encode group data");
  }
}

/**
 * Decode group data from shared URL
 * Decompresses and parses the group JSON
 */
export function decodeGroupFromShare(encoded: string): Group | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    if (!decompressed) {
      return null;
    }
    const group: Group = JSON.parse(decompressed);
    return group;
  } catch (error) {
    console.error("Error decoding group from share:", error);
    return null;
  }
}

/**
 * Generate shareable URL for a group
 */
export function generateShareUrl(group: Group, baseUrl: string = ""): string {
  const encoded = encodeGroupForShare(group);
  const url = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${url}/groups/view/${encoded}`;
}

