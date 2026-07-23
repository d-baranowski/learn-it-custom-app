// src/mammoth.tsx
import mammoth from "mammoth";

/**
 * Converts a Word document (.docx) ArrayBuffer to HTML using Mammoth.
 * @param arrayBuffer - The ArrayBuffer of the Word document.
 * @returns A promise that resolves to the HTML string.
 */
export const convertDocxToHtml = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const { value } = await mammoth.convertToHtml({ arrayBuffer });
    return value;
  } catch (error) {
    console.error("Error converting Word document to HTML:", error);
    throw new Error("Failed to convert document to HTML.");
  }
};
