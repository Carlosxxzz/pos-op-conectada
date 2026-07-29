import { Image } from '@/components/ui/image';

interface ResponsiveImageDisplayProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Responsive image display component for patient photos
 * Ensures images are:
 * - Fully responsive and fit within containers
 * - Never exceed screen width
 * - Maintain aspect ratio (object-fit: contain)
 * - Centered horizontally
 * - Max height: 450px desktop / 300px mobile
 * - With rounded corners
 */
export default function ResponsiveImageDisplay({
  src,
  alt,
  className = '',
  onClick,
}: ResponsiveImageDisplayProps) {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-full overflow-hidden rounded-xl border border-secondary/20">
        <div className="flex items-center justify-center bg-background w-full h-auto max-h-[300px] sm:max-h-[450px] overflow-hidden">
          <Image
            src={src}
            alt={alt}
            className={`w-full h-full object-contain ${className}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          />
        </div>
      </div>
    </div>
  );
}
