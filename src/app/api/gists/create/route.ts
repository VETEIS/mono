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

    // Create a public gist with the compressed group data
    const response = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "MONO-App/1.0", // GitHub API requires User-Agent
      },
      body: JSON.stringify({
        description: `MONO Group Share: ${group.name}`,
        public: true,
        files: {
          "group.json": {
            content: compressed,
          },
        },
      }),
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        const text = await response.text().catch(() => "");
        errorData = { message: text || response.statusText };
      }

      console.error("GitHub Gist API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      // Provide more specific error messages
      if (response.status === 403) {
        return NextResponse.json(
          { error: "GitHub API rate limit exceeded. Please try again later." },
          { status: 403 }
        );
      } else if (response.status === 401) {
        return NextResponse.json(
          { error: "GitHub API authentication failed." },
          { status: 401 }
        );
      } else if (response.status >= 500) {
        return NextResponse.json(
          { error: "GitHub API server error. Please try again later." },
          { status: 502 }
        );
      } else {
        return NextResponse.json(
          {
            error: `GitHub API error: ${errorData.message || response.statusText}`,
          },
          { status: response.status }
        );
      }
    }

    const gistData = await response.json();
    // Return the HTML URL which is more user-friendly
    return NextResponse.json({
      url: gistData.html_url || gistData.url || null,
    });
  } catch (error) {
    console.error("Error in gist creation API route:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create gist. Please try again.",
      },
      { status: 500 }
    );
  }
}

