'use client';

import { useState, useRef } from 'react';
import { User } from '@/lib/auth-context';

interface AvatarUploadProps {
  user: User;
  accessToken: string | null;
  refreshUser: () => Promise<void>;
}

export default function AvatarUpload({ user, accessToken, refreshUser }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB limit.');
      setSuccess('');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('taskType', 'avatars');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/uploads/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload image to Cloudinary');
      }

      if (data.success && data.url) {
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ avatar: data.url }),
        });

        const profileData = await profileRes.json();
        if (!profileRes.ok) {
          throw new Error(profileData.message || 'Failed to update user profile avatar.');
        }

        await refreshUser();
        setSuccess('Profile picture updated successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-24 h-24 rounded-full group border border-outline-variant/30 overflow-hidden shadow-inner flex items-center justify-center bg-primary/10 text-primary">
        {uploading ? (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
            <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
          </div>
        ) : (
          <div 
            onClick={handleAvatarClick} 
            className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-300 select-none"
          >
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            <span className="text-[10px] uppercase font-bold mt-1 font-label-caps">Change</span>
          </div>
        )}
        
        {user.avatar ? (
          <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
        ) : (
          <span className="font-display-xl text-3xl font-bold tracking-tight">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleAvatarChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {success && (
        <p className="text-[10px] text-primary font-semibold mt-2 flex items-center justify-center gap-0.5">
          <span className="material-symbols-outlined text-[12px]">check_circle</span>
          {success}
        </p>
      )}

      {error && (
        <p className="text-[10px] text-error font-semibold mt-2 flex items-center justify-center gap-0.5 animate-pulse">
          <span className="material-symbols-outlined text-[12px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
