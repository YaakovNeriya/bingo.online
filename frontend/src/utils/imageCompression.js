import imageCompression from 'browser-image-compression';

/**
 * Compresses an image client-side before uploading to the server.
 * This prevents the server from using excessive RAM and avoids 413 Payload Too Large errors.
 * 
 * @param {File} imageFile - The original image file from the input
 * @returns {Promise<File>} - The compressed image file (or original if small enough/failed)
 */
export const compressImageClientSide = async (imageFile) => {
  // If the file is already small (under 1MB), no need to compress
  if (imageFile.size <= 1024 * 1024) {
    return imageFile;
  }

  const options = {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg', // Force jpeg (smaller, and backend will convert to webp anyway)
  };

  try {
    const compressedBlob = await imageCompression(imageFile, options);
    
    // Convert the Blob back to a File object so it can be handled normally by FormData
    return new File([compressedBlob], imageFile.name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Client side compression failed:", error);
    // If compression fails, return the original file as fallback
    return imageFile;
  }
};
