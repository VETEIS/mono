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
    const response = await fetch("https://dpaste.com/api/v2/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        content: compressed,
        syntax: "text",
        expiry_days: "365", // Keep for 1 year
      }),
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
    
    if (!pasteUrl || !pasteUrl.startsWith("http")) {
      throw new Error("Invalid response from paste service");
    }

    // Extract the paste ID from the URL (e.g., https://dpaste.com/abc123 -> abc123)
    const pasteId = pasteUrl.split("/").pop()?.split(".")[0] || "";
    
    if (!pasteId) {
      throw new Error("Could not extract paste ID from URL");
    }
    
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
