import { useState } from "react"

// Alternative compression function for blob files
export const compressBlobImage = async (
  file: File,
  maxSizeMB = 1
): Promise<File> => {
  // For blob files from canvas, use a different approach
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const maxDimension = 1920
      let { width, height } = img

      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width
        width = maxDimension
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height
        height = maxDimension
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type || "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            reject(new Error("Failed to create blob"))
          }
        },
        file.type || "image/jpeg",
        0.8 // Quality setting
      )
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(file)
  })
}

export const compressImage = async (
  file: File,
  maxSizeMB = 1
): Promise<File> => {
  // Validate input file
  if (!file || !(file instanceof File) || file.size === 0) {
    console.warn("Invalid file provided for compression, returning original")
    return file
  }

  const options = {
    maxSizeMB: maxSizeMB,
    // Use webworker for faster compression with
    // the help of threads
    useWebWorker: true,
    // Add more specific options for better compatibility
    maxWidthOrHeight: 1920, // Limit max dimension
    fileType: file.type || "image/jpeg", // Preserve original type
  }
// TODO: Implement compression
  try {
    const compressedBlob = await Compress(file, options)

    // Validate the compressed blob
    if (!compressedBlob || compressedBlob.size === 0) {
      console.warn(
        "Compression resulted in empty blob, returning original file"
      )
      return file
    }

    const convertedBlobFile = new File([compressedBlob], file.name, {
      type: file.type || "image/jpeg",
      lastModified: Date.now(),
    })

    console.log(
      "File sizeCompressed from: ",
      (file.size / (1024 * 1024)).toFixed(2),
      "MB to ",
      (convertedBlobFile.size / (1024 * 1024)).toFixed(2),
      "MB"
    )

    return convertedBlobFile
  } catch (e) {
    console.log("Error Compressing File: ", e)
    return file // Return original file if compression fails
  }
}
