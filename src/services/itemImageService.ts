import { supabase } from '../lib/supabase';
import { convertToWebP, generateWebPFilename } from '../utils/imageUtils';

export const itemImageService = {
  async upload(
    file: File,
    itemId: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    if (onProgress) onProgress(5);

    const webpBlob = await convertToWebP(file);
    const filename = generateWebPFilename(`item`);
    const filePath = `${itemId}/${filename}`;

    if (onProgress) onProgress(15);

    const { data: existing } = await supabase
      .from('items')
      .select('image_path')
      .eq('id', itemId)
      .maybeSingle();

    if (existing?.image_path) {
      await supabase.storage
        .from('item-images')
        .remove([existing.image_path]);
    }

    if (onProgress) onProgress(25);

    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(filePath, webpBlob, { upsert: true, contentType: 'image/webp' });

    if (uploadError) throw uploadError;

    if (onProgress) onProgress(75);

    const { error: dbError } = await supabase
      .from('items')
      .update({ image_path: filePath })
      .eq('id', itemId);

    if (dbError) {
      await supabase.storage.from('item-images').remove([filePath]);
      throw dbError;
    }

    if (onProgress) onProgress(100);

    return filePath;
  },

  async remove(itemId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('items')
      .select('image_path')
      .eq('id', itemId)
      .maybeSingle();

    if (existing?.image_path) {
      await supabase.storage
        .from('item-images')
        .remove([existing.image_path]);
    }

    const { error } = await supabase
      .from('items')
      .update({ image_path: null })
      .eq('id', itemId);

    if (error) throw error;
  },

  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('item-images')
      .getPublicUrl(filePath);
    return data.publicUrl;
  },
};
