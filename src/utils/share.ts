import LZString from "lz-string";
import type { Group } from "@/types";

// LocalStorage key for temporary shared groups
const SHARED_GROUPS_STORAGE_KEY = "mono_shared_groups";
const SHARED_GROUP_EXPIRY_DAYS = 30; // Groups expire after 30 days

// Generate a short random ID (URL-safe, 12 characters)
function generateShortId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Store shared group in LocalStorage with expiration
function storeSharedGroup(id: string, group: Group): void {
  if (typeof window === "undefined") return;
  
  try {
    const stored = localStorage.getItem(SHARED_GROUPS_STORAGE_KEY);
    const sharedGroups: Record<string, { group: Group; expiresAt: string }> = stored ? JSON.parse(stored) : {};
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SHARED_GROUP_EXPIRY_DAYS);
    
    sharedGroups[id] = {
      group,
      expiresAt: expiresAt.toISOString(),
    };
    
    // Clean up expired entries
    const now = new Date();
    Object.keys(sharedGroups).forEach((key) => {
      if (new Date(sharedGroups[key].expiresAt) < now) {
        delete sharedGroups[key];
      }
    });
    
    localStorage.setItem(SHARED_GROUPS_STORAGE_KEY, JSON.stringify(sharedGroups));
  } catch (error) {
    console.error("Error storing shared group:", error);
  }
}

// Retrieve shared group from LocalStorage
export function getSharedGroup(id: string): Group | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(SHARED_GROUPS_STORAGE_KEY);
    if (!stored) return null;
    
    const sharedGroups: Record<string, { group: Group; expiresAt: string }> = JSON.parse(stored);
    const entry = sharedGroups[id];
    
    if (!entry) return null;
    
    // Check if expired
    if (new Date(entry.expiresAt) < new Date()) {
      delete sharedGroups[id];
      localStorage.setItem(SHARED_GROUPS_STORAGE_KEY, JSON.stringify(sharedGroups));
      return null;
    }
    
    return entry.group;
  } catch (error) {
    console.error("Error retrieving shared group:", error);
    return null;
  }
}

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
    console.log("Contains %:", encoded.includes("%"));

    // Next.js automatically decodes URL parameters, but we need to handle both cases
    // Try multiple decoding strategies
    let decoded = encoded;
    let attempts = [];
    
    // Strategy 1: Try decoding if it contains % (URL encoded) - Next.js might not have decoded it
    if (encoded.includes("%")) {
      try {
        const decoded1 = decodeURIComponent(encoded);
        attempts.push({ name: "decodeURIComponent", value: decoded1 });
      } catch (e) {
        console.warn("decodeURIComponent failed:", e);
      }
    }
    
    // Strategy 2: Use as-is (Next.js might have already decoded it)
    attempts.push({ name: "as-is", value: encoded });
    
    // Strategy 3: Try double decoding (in case it was double-encoded)
    if (encoded.includes("%")) {
      try {
        const decoded1 = decodeURIComponent(encoded);
        if (decoded1.includes("%")) {
          const decoded2 = decodeURIComponent(decoded1);
          attempts.push({ name: "double-decode", value: decoded2 });
        }
      } catch (e) {
        // Ignore
      }
    }
    
    // Try each strategy until one works
    for (const attempt of attempts) {
      console.log(`Trying strategy: ${attempt.name}, length: ${attempt.value.length}`);
      
      try {
        const decompressed = LZString.decompressFromBase64(attempt.value);
        if (decompressed) {
          console.log(`✓ Strategy "${attempt.name}" succeeded!`);
          const group: Group = JSON.parse(decompressed);
          
          // Validate that it's a valid group
          if (group && group.id && group.members && Array.isArray(group.members)) {
            console.log("Parsed group:", group.name, "with", group.members.length, "members");
            return group;
          } else {
            console.warn(`Strategy "${attempt.name}" decompressed but invalid structure`);
          }
        } else {
          console.log(`✗ Strategy "${attempt.name}" failed to decompress`);
        }
      } catch (e) {
        console.log(`✗ Strategy "${attempt.name}" threw error:`, e);
      }
    }
    
    console.error("All decoding strategies failed");
    return null;
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
 * Uses URL encoding with chunking for very long groups
 */
export function generateShareUrl(group: Group, baseUrl: string = ""): string {
  const url = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  
  // Try encoding in URL
  const encoded = encodeGroupForShare(group);
  const urlWithData = `${url}/groups/view?data=${encoded}`;
  
  // If URL is too long, use chunking (split into multiple query params)
  const MAX_CHUNK_SIZE = 1500; // Safe size per chunk
  if (urlWithData.length > 2000 && encoded.length > MAX_CHUNK_SIZE) {
    // Split into chunks
    const chunks: string[] = [];
    for (let i = 0; i < encoded.length; i += MAX_CHUNK_SIZE) {
      chunks.push(encoded.substring(i, i + MAX_CHUNK_SIZE));
    }
    
    // Build URL with multiple data chunks
    const chunkParams = chunks.map((chunk, index) => `data${index}=${chunk}`).join("&");
    return `${url}/groups/view?chunks=${chunks.length}&${chunkParams}`;
  }
  
  // For shorter URLs, use the encoded data directly
  return urlWithData;
}

