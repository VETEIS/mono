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

    // Use 0x0.st - free anonymous file hosting service
    // Upload the compressed data as a file
    const formData = new FormData();
    const blob = new Blob([compressed], { type: "text/plain" });
    formData.append("file", blob, "group.json");

    const response = await fetch("https://0x0.st", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error("0x0.st API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      return NextResponse.json(
        {
          error: `Failed to upload file: ${errorText || response.statusText}`,
        },
        { status: response.status }
      );
    }

    // 0x0.st returns the URL directly as plain text
    const fileUrl = (await response.text()).trim();
    
    if (!fileUrl || !fileUrl.startsWith("http")) {
      throw new Error("Invalid response from file hosting service");
    }

    // Extract the file ID from the URL (e.g., https://0x0.st/abc123.txt -> abc123)
    const fileId = fileUrl.split("/").pop()?.replace(/\.[^/.]+$/, "") || "";
    
    // Return our app URL with the file ID
    const baseUrl = request.headers.get("origin") || request.nextUrl.origin;
    const appUrl = `${baseUrl}/groups/view/${fileId}`;

    return NextResponse.json({
      url: appUrl,
      fileUrl: fileUrl, // Also return the direct file URL for reference
    });
  } catch (error) {
    console.error("Error in file upload API route:", error);
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

