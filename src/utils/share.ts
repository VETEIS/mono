import LZString from "lz-string";
import type { Group } from "@/types";

/**
 * Encode group data for sharing via URL
 * Uses LZ-String compression + base64 encoding
 */
export function encodeGroupForShare(group: Group): string {
  try {
    const jsonString = JSON.stringify(group);
    console.log("Encoding group, JSON length:", jsonString.length);
    
    // Use compressToBase64 and then encode for URL safety
    const compressed = LZString.compressToBase64(jsonString);
    if (!compressed) {
      throw new Error("Compression failed");
    }
    
    console.log("Compressed length:", compressed.length);
    
    // Encode for URL (handles special characters)
    const encoded = encodeURIComponent(compressed);
    console.log("Final encoded length:", encoded.length);
    
    return encoded;
  } catch (error) {
    console.error("Error encoding group for share:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    throw new Error("Failed to encode group data");
  }
}

/**
 * Decode group data from shared URL
 * Decompresses and parses the group JSON
 */
export function decodeGroupFromShare(encoded: string): Group | null {
  try {
    if (!encoded || encoded.trim() === "") {
      console.error("Empty encoded string");
      return null;
    }

    console.log("Decoding, input length:", encoded.length);
    console.log("First 50 chars:", encoded.substring(0, 50));

    // Next.js automatically decodes URL parameters, but we need to handle both cases
    let decoded = encoded;
    
    // Try to decode if it looks URL-encoded (contains %)
    if (encoded.includes("%")) {
      try {
        decoded = decodeURIComponent(encoded);
        console.log("URL decoded, new length:", decoded.length);
      } catch (e) {
        console.warn("Error decoding URI component, using as-is:", e);
        // If decoding fails, try using it as-is (might already be decoded)
        decoded = encoded;
      }
    } else {
      console.log("No URL encoding detected, using as-is");
    }
    
    if (!decoded || decoded.trim() === "") {
      console.error("Empty decoded string");
      return null;
    }
    
    // Try to decompress
    console.log("Attempting decompression...");
    const decompressed = LZString.decompressFromBase64(decoded);
    if (!decompressed) {
      console.error("Failed to decompress data - decompressed is null or empty");
      // Try one more time with the original encoded string in case of double encoding
      if (decoded !== encoded) {
        console.log("Retrying with original encoded string...");
        const retryDecompressed = LZString.decompressFromBase64(encoded);
        if (retryDecompressed) {
          const retryGroup = JSON.parse(retryDecompressed);
          if (retryGroup && retryGroup.id && retryGroup.members) {
            console.log("Successfully decompressed on retry");
            return retryGroup;
          }
        }
      }
      return null;
    }
    
    console.log("Decompressed successfully, length:", decompressed.length);
    
    const group: Group = JSON.parse(decompressed);
    console.log("Parsed group:", group.name, "with", group.members?.length || 0, "members");
    
    // Validate that it's a valid group
    if (!group || !group.id || !group.members || !Array.isArray(group.members)) {
      console.error("Invalid group structure:", {
        hasGroup: !!group,
        hasId: !!group?.id,
        hasMembers: !!group?.members,
        isArray: Array.isArray(group?.members),
      });
      return null;
    }
    
    return group;
  } catch (error) {
    console.error("Error decoding group from share:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return null;
  }
}

/**
 * Generate shareable URL for a group
 * Uses query parameter instead of path parameter to avoid encoding issues
 */
export function generateShareUrl(group: Group, baseUrl: string = ""): string {
  const encoded = encodeGroupForShare(group);
  const url = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  // Use query parameter to avoid Next.js path parameter encoding issues
  return `${url}/groups/view?data=${encoded}`;
}

