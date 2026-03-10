import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ImageThumbnailProps {
  imageUrl?: string | null;
  altText?: string;
}

export const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  imageUrl,
  altText = 'Item',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!imageUrl || error) {
    return (
      <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        <Package size={20} className="text-white/40" />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative bg-white/10">
      {!loaded && (
        <div className="absolute inset-0 bg-white/10 animate-pulse rounded-lg" />
      )}
      <img
        src={imageUrl}
        alt={altText}
        className={`w-14 h-14 object-cover rounded-lg transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};
