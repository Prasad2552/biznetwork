"use server"

export async function extractPdfText(url: string) {
  try {
    console.log(`[Server Action] Extracting text from ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to fetch PDF:", response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return "PDF content cannot be loaded, check server logs"
  } catch (error) {
    console.error("[Server Action] PDF extraction error:", error);
    throw error
  }
}