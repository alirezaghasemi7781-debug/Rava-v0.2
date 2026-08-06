import React, { useState } from 'react';
import { Camera, Check, User } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { storageService } from '../../../services/storageService';
import { AudioGraph } from '../../../services/audioGraph';
import { ModalShell, ModalCard, ModalHeader, Button, Input } from '../../../components/ui';

interface IdentityModalProps {
  onClose: () => void;
}

export const IdentityModal: React.FC<IdentityModalProps> = ({ onClose }) => {
  const { user, updateProfile } = useAuthStore();
  const [username, setUsername] = useState(user?.user_metadata?.username || user?.email?.split('@')[0] || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setFeedback(null);
    try {
      const publicUrl = await storageService.uploadAvatar(file, user.id, user.user_metadata?.avatar_url);
      await updateProfile({ avatar_url: publicUrl });
      AudioGraph.getInstance().playCoinSound();
    } catch {
      setFeedback({ type: 'error', message: 'خطا در آپلود عکس' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      await updateProfile({ username });
      AudioGraph.getInstance().playTickSound();
      onClose();
    } catch {
      setFeedback({ type: 'error', message: 'خطا در بروزرسانی' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell open={true} onClose={onClose} contentClassName="max-w-sm">
      <ModalCard>
        <ModalHeader title="ویرایش هویت" subtitle="Elite Identity" onClose={onClose} icon={<User size={28} />} />

        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-rava-xl border-2 border-white/5 bg-neutral-800 shadow-2xl">
              {uploading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-rava-gold border-t-transparent" />
              ) : user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <User size={48} className="text-white/10" />
              )}
            </div>
            <label className="absolute -bottom-2 -end-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-rava-lg bg-rava-gold text-black shadow-xl transition-transform active:scale-90">
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              <Camera size={20} />
            </label>
          </div>
        </div>

        <div className="space-y-6 text-right">
          <div className="space-y-2">
            <label className="me-2 text-rava-xs font-black uppercase tracking-widest text-white/20">نام نمایشی شما</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          {feedback ? (
            <p className={`text-center text-rava-xs font-bold ${feedback.type === 'success' ? 'text-green-400' : 'text-rava-danger'}`}>
              {feedback.message}
            </p>
          ) : null}
          <Button fullWidth size="lg" onClick={handleSave} disabled={loading || uploading} loading={loading} leadingIcon={!loading ? <Check size={20} /> : undefined}>
            تایید و ثبت
          </Button>
        </div>
      </ModalCard>
    </ModalShell>
  );
};
