import { supabase } from '../lib/supabase';
import { convertToWebP, generateWebPFilename } from '../utils/imageUtils';

export interface ContainerImage {
  id: string;
  container_size_id: string;
  image_url: string;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export const containerImageService = {
  async getAll(): Promise<ContainerImage[]> {
    const { data, error } = await supabase
      .from('container_images')
      .select('*')
      .order('container_size_id');

    if (error) throw error;
    return data || [];
  },

  async upload(
    file: File,
    containerSizeId: string,
    onProgress?: (percent: number) => void
  ): Promise<ContainerImage> {
    if (onProgress) onProgress(5);

    const webpBlob = await convertToWebP(file);
    const filename = generateWebPFilename(`container-${containerSizeId}`);
    const filePath = `${containerSizeId}/${filename}`;

    if (onProgress) onProgress(15);

    const { data: existing } = await supabase
      .from('container_images')
      .select('file_path')
      .eq('container_size_id', containerSizeId)
      .maybeSingle();

    if (existing?.file_path) {
      await supabase.storage
        .from('container-images')
        .remove([existing.file_path]);
    }

    if (onProgress) onProgress(25);

    const { error: uploadError } = await supabase.storage
      .from('container-images')
      .upload(filePath, webpBlob, { upsert: true, contentType: 'image/webp' });

    if (uploadError) throw uploadError;

    if (onProgress) onProgress(75);

    const { data: urlData } = supabase.storage
      .from('container-images')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    if (onProgress) onProgress(90);

    let result: ContainerImage;

    if (existing) {
      const { data, error } = await supabase
        .from('container_images')
        .update({
          image_url: imageUrl,
          file_path: filePath,
          updated_at: new Date().toISOString(),
        })
        .eq('container_size_id', containerSizeId)
        .select()
        .single();

      if (error) {
        await supabase.storage.from('container-images').remove([filePath]);
        throw error;
      }
      result = data;
    } else {
      const { data, error } = await supabase
        .from('container_images')
        .insert({
          container_size_id: containerSizeId,
          image_url: imageUrl,
          file_path: filePath,
        })
        .select()
        .single();

      if (error) {
        await supabase.storage.from('container-images').remove([filePath]);
        throw error;
      }
      result = data;
    }

    if (onProgress) onProgress(100);

    return result;
  },

  async remove(containerSizeId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('container_images')
      .select('file_path')
      .eq('container_size_id', containerSizeId)
      .maybeSingle();

    if (existing?.file_path) {
      await supabase.storage
        .from('container-images')
        .remove([existing.file_path]);
    }

    const { error } = await supabase
      .from('container_images')
      .delete()
      .eq('container_size_id', containerSizeId);

    if (error) throw error;
  },
};
