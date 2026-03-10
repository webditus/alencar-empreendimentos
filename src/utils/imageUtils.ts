const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_WIDTH = 1600;
const QUALITY = 0.8;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ImageValidationError {
  type: 'file_too_large' | 'invalid_type';
  message: string;
}

export function validateImageFile(file: File): ImageValidationError | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      type: 'invalid_type',
      message: 'Formato inválido. Use JPG, PNG ou WEBP.',
    };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return {
      type: 'file_too_large',
      message: 'Arquivo muito grande. O tamanho máximo é 10MB.',
    };
  }
  return null;
}

export function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível obter contexto do canvas.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao converter imagem para WebP.'));
            return;
          }
          resolve(blob);
        },
        'image/webp',
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao carregar imagem.'));
    };

    img.src = objectUrl;
  });
}

export function generateWebPFilename(prefix?: string): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}-${uuid}.webp` : `${uuid}.webp`;
}
