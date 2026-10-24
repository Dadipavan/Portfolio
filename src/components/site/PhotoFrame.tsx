'use client';

import { mediaUrl } from '@/lib/media';
import type { ProfilePhoto } from '@/lib/types';
import { initialsOf } from './hooks';
import { usePortfolio } from './PortfolioProvider';

// The outline the picture is cut to. The looks decide which one they use (and style it in their own stylesheet).
export type PhotoShape = 'circle' | 'arch' | 'portrait' | 'square' | 'polaroid' | 'oval';

interface PhotoViewProps {
  photo?: ProfilePhoto;
  // the full name (for the description read out to people who cannot see the picture) and the short name (initials)
  name: string;
  shortName?: string;
  shape?: PhotoShape;
  className?: string;
  // load at once: for the picture at the top of the page
  priority?: boolean;
}

// The profile photo cut to a shape, with the crop chosen in Admin > Profile photo. Without a photo it shows the
// person's initials instead, so a look never has an empty hole where the picture would be.
// (The crop: the focus point stays where the admin put it, and zooming enlarges the picture around that point.)
export function PhotoView({
  photo,
  name,
  shortName,
  shape = 'circle',
  className = '',
  priority = false,
}: PhotoViewProps) {
  const file = photo?.file;
  const focusX = photo?.focusX ?? 50;
  const focusY = photo?.focusY ?? 50;
  const zoom = photo?.zoom ?? 1;

  return (
    <div
      className={`photo-frame ${className}`}
      data-shape={shape}
      data-has-photo={file ? 'true' : 'false'}
    >
      <div className="photo-clip">
        {file ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(file.path)}
            alt={file.alt || `Photo of ${name}`}
            width={file.width}
            height={file.height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            draggable={false}
            className="photo-img"
            style={{
              objectPosition: `${focusX}% ${focusY}%`,
              transformOrigin: `${focusX}% ${focusY}%`,
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            }}
          />
        ) : (
          <span aria-hidden="true" className="photo-monogram">
            {initialsOf(shortName || name)}
          </span>
        )}
      </div>
    </div>
  );
}

// The photo of the person whose portfolio this is
export default function PhotoFrame(props: Omit<PhotoViewProps, 'photo' | 'name' | 'shortName'>) {
  const { content } = usePortfolio();
  const { photo, name, shortName } = content.personalInfo;
  return <PhotoView photo={photo} name={name} shortName={shortName} {...props} />;
}
