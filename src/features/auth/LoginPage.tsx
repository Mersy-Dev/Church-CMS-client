import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({ email: '', password: '', twoFaCode: '' });
  const [showPass, setShowPass] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser({
      email: form.email,
      password: form.password,
      ...(needs2FA && form.twoFaCode ? { twoFaCode: form.twoFaCode } : {}),
    }));
    if ((result.payload as any)?.requiresTwoFa) {
      setNeeds2FA(true);
      toast('Enter your 2FA code to continue', { icon: '🔐' });
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center font-display font-black text-bg-base text-lg">
            C
          </div>
          <div>
            <h1 className="font-display font-bold text-text-primary text-xl leading-none">ChurchOS</h1>
            <p className="text-text-muted text-xs mt-0.5">Church Management System</p>
          </div>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-text-primary text-xl mb-1">Welcome back</h2>
          <p className="text-text-muted text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!needs2FA ? (
              <>
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="admin@church.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <a href="/forgot-password" className="text-xs text-gold hover:text-gold-light transition-colors">
                    Forgot password?
                  </a>
                </div>
              </>
            ) : (
              <div>
                <label className="label">2FA Code</label>
                <input
                  type="text"
                  className="input text-center font-mono tracking-[0.5em] text-lg"
                  placeholder="000000"
                  maxLength={6}
                  value={form.twoFaCode}
                  onChange={(e) => setForm({ ...form, twoFaCode: e.target.value.replace(/\D/g, '') })}
                  autoFocus
                />
                <p className="text-text-muted text-xs mt-2 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
                <button
                  type="button"
                  onClick={() => setNeeds2FA(false)}
                  className="text-xs text-text-muted hover:text-gold mt-2 w-full text-center transition-colors"
                >
                  ← Back
                </button>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-gold w-full justify-center py-3">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <LogIn size={15} />
                  Sign in
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-4">
          ChurchOS © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
