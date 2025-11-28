import { NextRequest, NextResponse } from "next/server";
import LZString from "lz-string";
import type { Group } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const group: Group = await request.json();

    if (!group || !group.name) {
      return NextResponse.json(
        { error: "Invalid group data" },
        { status: 400 }
      );
    }

    const jsonString = JSON.stringify(group);
    const compressed = LZString.compressToBase64(jsonString);

    // Use dpaste.com API - free anonymous paste service
    // API endpoint: https://dpaste.com/api/v2/
    // Parameters: content (required), syntax (optional), expiry_days (optional, max 365)
    const formData = new URLSearchParams({
      content: compressed,
      syntax: "text",
      expiry_days: "365", // Keep for 1 year
    });

    const response = await fetch("https://dpaste.com/api/v2/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error("dpaste.com API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      return NextResponse.json(
        {
          error: `Failed to create paste: ${errorText || response.statusText}`,
        },
        { status: response.status }
      );
    }

    // dpaste.com returns the URL directly as plain text
    const pasteUrl = (await response.text()).trim();
    
    console.log("dpaste.com response:", pasteUrl);
    
    if (!pasteUrl || !pasteUrl.startsWith("http")) {
      console.error("Invalid paste URL response:", pasteUrl);
      throw new Error("Invalid response from paste service");
    }

    // Extract the paste ID from the URL
    // dpaste.com URLs can be: https://dpaste.com/abc123 or https://dpaste.com/abc123.txt
    let pasteId = pasteUrl.split("/").pop() || "";
    // Remove .txt extension if present
    pasteId = pasteId.replace(/\.txt$/, "");
    
    if (!pasteId) {
      console.error("Could not extract paste ID from URL:", pasteUrl);
      throw new Error("Could not extract paste ID from URL");
    }
    
    console.log("Extracted paste ID:", pasteId);
    
    // Return our app URL with the paste ID
    const baseUrl = request.headers.get("origin") || request.nextUrl.origin;
    const appUrl = `${baseUrl}/groups/view/${pasteId}`;

    return NextResponse.json({
      url: appUrl,
      pasteUrl: pasteUrl, // Also return the direct paste URL for reference
    });
  } catch (error) {
    console.error("Error in paste creation API route:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create share link. Please try again.",
      },
      { status: 500 }
    );
  }
}
