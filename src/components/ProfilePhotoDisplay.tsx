import React, { useState } from 'react';
import { Edit2, User } from 'lucide-react';
import ProfilePhotoUpload from './ProfilePhotoUpload';
import { Image } from '@/components/ui/image';

interface ProfilePhotoDisplayProps {
  photo?: string;
  name?: string;
  onPhotoUpdate: (photo: Blob) => Promise<void>;
  onPhotoRemove?: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  showEditIcon?: boolean;
  isLoading?: boolean;
}

export default function ProfilePhotoDisplay({
  photo,
  name,
  onPhotoUpdate,
  onPhotoRemove,
  size = 'md',
  showEditIcon = true,
  isLoading = false,
}: ProfilePhotoDisplayProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const editIconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <>
      <div className="relative inline-block group">
        {/* Photo Container */}
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-primary overflow-hidden bg-gray-100 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:border-primary/80`}
        >
          {photo ? (
            <Image src={photo} alt={name || 'Foto de perfil'} className="w-full h-full object-cover" />
          ) : (
            <User className={`${iconSizes[size]} text-gray-400`} />
          )}
        </div>

        {/* Edit Icon */}
        {showEditIcon && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 rounded-full p-2 shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 transform group-hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Alterar foto de perfil"
            disabled={isLoading}
          >
            <Edit2 className={`${editIconSizes[size]} text-white`} />
          </button>
        )}

        {/* Hover Tooltip */}
        {showEditIcon && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            Alterar foto de perfil
          </div>
        )}
      </div>

      <ProfilePhotoUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSave={onPhotoUpdate}
        currentPhoto={photo}
        onRemove={onPhotoRemove}
        isLoading={isLoading}
      />
    </>
  );
}
