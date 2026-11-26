import { useState } from 'react';
import { ShieldCheck, UserCheck, UserPlus, X } from 'lucide-react';
import type { User } from '../types/library';

interface AuthModalProps {
  isOpen: boolean;
  users: User[];
  currentUser: User;
  onClose: () => void;
  onSwitchUser: (userId: string) => Promise<void>;
  onRegisterMember: (name: string, email: string) => Promise<void>;
}

export function AuthModal({
  isOpen,
  users,
  currentUser,
  onClose,
  onSwitchUser,
  onRegisterMember,
}: AuthModalProps) {
  const [mode, setMode] = useState<'switch' | 'register'>('switch');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const admins = users.filter((u) => u.role === 'admin');
  const members = users.filter((u) => u.role === 'member');

  const handleSelectUser = async (userId: string) => {
    setIsSubmitting(true);
    try {
      await onSwitchUser(userId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onRegisterMember(name, email);
      setName('');
      setEmail('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#241418]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#EDD8DC] rounded-2xl max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#F3E5E8]">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#241418]">
              Akses Akun &amp; Peran
            </h2>
            <p className="text-xs text-[#6C5258] mt-0.5">
              Beralih antara Dashboard Admin dan Member Acelivre
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#6C5258] hover:text-[#241418] rounded-lg hover:bg-[#F9EEF0] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F9EEF0] rounded-lg border border-[#EDD8DC] mt-4">
          <button
            type="button"
            onClick={() => setMode('switch')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'switch'
                ? 'bg-white text-[#6D1A36] shadow-xs'
                : 'text-[#6C5258] hover:text-[#241418]'
            }`}
          >
            Pilih Akun Aktif
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#6D1A36] shadow-xs'
                : 'text-[#6C5258] hover:text-[#241418]'
            }`}
          >
            Daftar Member Baru
          </button>
        </div>

        {mode === 'switch' ? (
          <div className="mt-4 space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div>
              <p className="text-[11px] font-semibold text-[#6D1A36] uppercase tracking-wider mb-2">
                Admin Pustakawan
              </p>
              <div className="space-y-2">
                {admins.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectUser(u.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      currentUser.id === u.id
                        ? 'bg-[#F9EEF0] border-[#6D1A36]'
                        : 'bg-white border-[#EDD8DC] hover:border-[#C96B88]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#6D1A36] text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#241418] truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-[#6C5258] truncate">
                          {u.memberCode} · {u.email}
                        </p>
                      </div>
                    </div>
                    {currentUser.id === u.id && (
                      <span className="text-xs font-medium text-[#6D1A36] shrink-0">
                        Aktif
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-[#6C5258] uppercase tracking-wider mb-2">
                Anggota / Member ({members.length})
              </p>
              <div className="space-y-2">
                {members.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectUser(u.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      currentUser.id === u.id
                        ? 'bg-[#F9EEF0] border-[#6D1A36]'
                        : 'bg-white border-[#EDD8DC] hover:border-[#C96B88]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#F3D5DE] text-[#6D1A36] flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#241418] truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-[#6C5258] truncate">
                          {u.memberCode} · {u.email}
                        </p>
                      </div>
                    </div>
                    {currentUser.id === u.id && (
                      <span className="text-xs font-medium text-[#6D1A36] shrink-0">
                        Aktif
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5D474D] mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Alya Rahmadani"
                className="w-full px-3 py-2 text-sm bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D474D] mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3 py-2 text-sm bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#6D1A36] hover:bg-[#531228] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Mendaftarkan...' : 'Daftar & Masuk Sebagai Member'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
