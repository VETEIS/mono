import LZString from "lz-string";
import type { Group } from "@/types";

/**
 * Encode group data for sharing via URL
 * Uses LZ-String compression + base64 encoding
 */
export function encodeGroupForShare(group: Group): string {
  try {
    const jsonString = JSON.stringify(group);
    // Use compressToBase64 and then encode for URL safety
    const compressed = LZString.compressToBase64(jsonString);
    // Encode for URL (handles special characters)
    return encodeURIComponent(compressed);
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
    // Decode URL component first (Next.js might have decoded it, but we need to handle both cases)
    let decoded = encoded;
    try {
      // Try decoding in case it's still encoded
      decoded = decodeURIComponent(encoded);
    } catch {
      // If already decoded, use as is
      decoded = encoded;
    }
    
    const decompressed = LZString.decompressFromBase64(decoded);
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

