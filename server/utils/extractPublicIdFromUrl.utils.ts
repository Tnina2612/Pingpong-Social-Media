/**
 * Extracts the Cloudinary public_id from a full secure_url.
 * Handles URLs with or without version numbers and nested folders.
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes("cloudinary.com")) {
    return null; // Not a valid Cloudinary URL
  }

  try {
    // Regex explanation:
    // \/upload\/  : Matches the literal string "/upload/"
    // (?:v\d+\/)? : Non-capturing group for the optional version number (e.g., v1612345/)
    // ([^\.]+)    : Capturing group 1: Matches everything up to the first period (.)
    const regex = /\/upload\/(?:v\d+\/)?([^.]+)/;
    const match = url.match(regex);

    if (match?.[1]) {
      // match[1] will contain the folder path and the filename (the exact public_id)
      // e.g., "social-network-uploads/my-image"
      return match[1];
    }

    return null;
  } catch (error) {
    console.error("Error parsing Cloudinary URL:", error);
    return null;
  }
}
