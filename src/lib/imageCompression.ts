/**
 * Image compression and validation utilities
 * Handles image optimization for medical photo uploads
 */

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface CompressionResult {
  compressedBase64: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (safe for WDE0109)
const MIN_DIMENSION = 640; // Minimum width or height
const MAX_DIMENSION = 2048; // Maximum width or height
const TARGET_QUALITY = 0.75; // JPEG quality for compression
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates image file before processing
 */
export function validateImage(file: File): ImageValidationResult {
  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      isValid: false,
      error: 'Formato não suportado. Use JPEG, PNG ou WebP.',
    };
  }

  // Check file size (initial check)
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `Arquivo muito grande (${formatFileSize(file.size)}). Máximo: ${formatFileSize(MAX_FILE_SIZE)}.`,
    };
  }

  return { isValid: true };
}

/**
 * Compresses image to safe size for upload
 * Handles resizing and quality reduction
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = calculateOptimalDimensions(img.width, img.height);

          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Não foi possível criar contexto de canvas'));
            return;
          }

          // Draw image with high quality
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with quality setting
          const compressedBase64 = canvas.toDataURL('image/jpeg', TARGET_QUALITY);

          // Calculate compression ratio
          const originalSize = file.size;
          const compressedSize = Math.round((compressedBase64.length * 3) / 4);
          const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

          resolve({
            compressedBase64,
            originalSize,
            compressedSize,
            compressionRatio,
          });
        } catch (error) {
          reject(new Error('Erro ao comprimir imagem'));
        }
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Calculates optimal dimensions maintaining aspect ratio
 * Ensures image is suitable for medical documentation
 */
function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale up if too small
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    const scale = Math.max(MIN_DIMENSION / width, MIN_DIMENSION / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  // Scale down if too large
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  return { width, height };
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Gets image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsDataURL(file);
  });
}
