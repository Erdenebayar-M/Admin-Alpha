export interface R2UploadResult {
  url: string;
  base64: string;
  fileName: string;
}

export async function uploadImageToR2(
  blob: Blob,
  options?: { onProgress?: (progress: number) => void }
): Promise<R2UploadResult> {
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');
  formData.append('type', 'image');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload image');
  }

  const result = await response.json();
  return result.data;
}

export async function uploadAudioToR2(
  blob: Blob,
  options?: { onProgress?: (progress: number) => void }
): Promise<R2UploadResult> {
  const formData = new FormData();
  formData.append('file', blob, 'audio.m4a');
  formData.append('type', 'audio');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload audio');
  }

  const result = await response.json();
  return result.data;
}

export async function base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}
