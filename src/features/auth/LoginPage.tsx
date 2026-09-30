import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { Eye, EyeOff, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Logo colors extracted from WORD HOUSE branding ─── */
// Navy:    #1E2060   Royal Blue: #2B52C8
// Teal:    #00B4D8   Green:      #3AB85C
// Amber:   #F5A623   Red-orange: #E8432E

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

  :root {
    --navy:        #1E2060;
    --navy-deep:   #13154A;
    --royal:       #2B52C8;
    --teal:        #00B4D8;
    --green:       #3AB85C;
    --amber:       #F5A623;
    --red:         #E8432E;

    --form-bg:     #F4F3EF;
    --card-bg:     #FFFFFF;
    --txt-primary: #12131F;
    --txt-sub:     #5A5B6E;
    --txt-muted:   #9A9BAD;
    --border:      #E2E1DC;
    --inp-border:  #CED0D9;
    --inp-focus-s: rgba(30,32,96,0.14);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .lr-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    display: flex;
  }

  /* ── LEFT PANEL ── */
  .lr-left {
    width: 55%;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Church image, blurred */
  .lr-bg-img {
    position: absolute;
    inset: 0;
    background-image: url('https://images.unsplash.com/photo-1445445290350-18a3b86e0b5a?w=1400&auto=format&fit=crop&q=80');
    background-size: cover;
    background-position: center top;
    filter: blur(3px) brightness(0.38) saturate(0.6);
    transform: scale(1.06);
  }

  /* Navy tint overlay */
  .lr-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      160deg,
      rgba(19,21,74,0.82) 0%,
      rgba(30,32,96,0.70) 50%,
      rgba(13,15,45,0.88) 100%
    );
  }

  /* Rainbow stripe bottom — book pages motif */
  .lr-stripe {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg,
      #E8432E 0%, #F5A623 20%, #F5D623 35%,
      #3AB85C 50%, #00B4D8 65%, #2B52C8 82%, #7B2FBE 100%
    );
  }

  .lr-left-inner {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 44px 52px;
  }

  /* ── LOGO ── */
  .lr-logo { display: flex; align-items: center; gap: 12px; }
  .lr-logo-icon {
    width: 46px; height: 46px; border-radius: 12px;
    background: linear-gradient(135deg, #2B52C8 0%, #1E2060 100%);
    border: 2px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    overflow: hidden; flex-shrink: 0;
  }
  .lr-logo-text h1 {
    font-family: 'Playfair Display', serif;
    font-weight: 700; font-size: 20px;
    color: #fff; line-height: 1; letter-spacing: -0.01em;
  }
  .lr-logo-text span {
    font-size: 10px; color: rgba(255,255,255,0.38);
    letter-spacing: 0.14em; text-transform: uppercase;
    margin-top: 3px; display: block;
  }

  /* ── HERO ── */
  .lr-hero {
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    max-width: 440px;
  }

  .lr-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 20px; padding: 5px 13px;
    margin-bottom: 24px; width: fit-content;
  }
  .lr-badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--teal); box-shadow: 0 0 8px var(--teal); flex-shrink: 0;
  }
  .lr-badge span { font-size: 11px; color: rgba(255,255,255,0.55); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500; }

  .lr-headline {
    font-family: 'Playfair Display', serif; font-weight: 700;
    font-size: clamp(34px, 3.5vw, 50px);
    line-height: 1.1; color: #fff; letter-spacing: -0.01em; margin-bottom: 18px;
  }
  .lr-headline em {
    font-style: italic;
    background: linear-gradient(90deg, var(--teal), #7EC8F5);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  .lr-sub { font-size: 15px; color: rgba(255,255,255,0.45); line-height: 1.75; font-weight: 300; margin-bottom: 32px; }

  .lr-pills { display: flex; flex-wrap: wrap; gap: 8px; }
  .lr-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10);
    border-radius: 20px; padding: 5px 12px;
    font-size: 11.5px; color: rgba(255,255,255,0.55); font-weight: 400; letter-spacing: 0.02em;
  }

  /* ── TESTIMONIAL ── */
  .lr-testimonial { border-top: 1px solid rgba(255,255,255,0.09); padding-top: 24px; margin-top: 4px; }
  .lr-quote-mark { font-family: 'Playfair Display', serif; font-size: 52px; line-height: 1; color: rgba(0,180,216,0.3); margin-bottom: -8px; display: block; }
  .lr-quote-text { font-size: 13.5px; color: rgba(255,255,255,0.6); line-height: 1.7; font-weight: 300; margin-bottom: 14px; }
  .lr-quote-author { display: flex; align-items: center; gap: 10px; }
  .lr-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--royal), var(--navy));
    border: 1.5px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.9);
  }
  .lr-author-name { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.85); }
  .lr-author-role { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 1px; }

  /* ── RIGHT PANEL ── */
  .lr-right {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 40px 28px; background: var(--form-bg); position: relative;
  }
  .lr-right::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 10%, rgba(43,82,200,0.06) 0%, transparent 60%);
    pointer-events: none;
  }

  .lr-form-wrap { width: 100%; max-width: 360px; position: relative; z-index: 1; }

  .lr-form-title {
    font-family: 'Playfair Display', serif; font-weight: 700; font-size: 32px;
    color: var(--txt-primary); line-height: 1.15; letter-spacing: -0.01em; margin-bottom: 6px;
  }
  .lr-form-sub { font-size: 14px; color: var(--txt-sub); font-weight: 300; margin-bottom: 28px; }

  .lr-field { display: flex; flex-direction: column; gap: 6px; }
  .lr-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase; color: var(--txt-sub); }

  .lr-input {
    width: 100%; background: var(--card-bg); border: 1.5px solid var(--inp-border);
    border-radius: 10px; padding: 11px 14px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: var(--txt-primary);
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .lr-input:focus { border-color: var(--navy); box-shadow: 0 0 0 3.5px var(--inp-focus-s); }
  .lr-input::placeholder { color: var(--txt-muted); }

  .lr-input-wrap { position: relative; }
  .lr-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--txt-muted);
    display: flex; align-items: center; padding: 0; transition: color 0.15s;
  }
  .lr-eye:hover { color: var(--txt-sub); }

  .lr-forgot { text-align: right; }
  .lr-forgot a { font-size: 12px; color: var(--royal); text-decoration: none; font-weight: 500; transition: color 0.15s; }
  .lr-forgot a:hover { color: var(--navy); }

  .lr-btn {
    width: 100%;
    background: linear-gradient(135deg, #2B52C8 0%, #1E2060 100%);
    color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600; font-size: 14px; padding: 13px 24px;
    border-radius: 10px; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.2s; letter-spacing: 0.01em;
    box-shadow: 0 4px 18px rgba(30,32,96,0.28);
  }
  .lr-btn:hover:not(:disabled) {
    transform: translateY(-1.5px); box-shadow: 0 8px 26px rgba(30,32,96,0.38);
    background: linear-gradient(135deg, #3460D8 0%, #252777 100%);
  }
  .lr-btn:active:not(:disabled) { transform: translateY(0); }
  .lr-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .lr-spinner {
    width: 15px; height: 15px;
    border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff;
    border-radius: 50%; animation: spin 0.65s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .lr-security { display: flex; align-items: center; gap: 7px; margin-top: 16px; }
  .lr-security span { font-size: 11px; color: var(--txt-muted); }

  .lr-otp { text-align: center; letter-spacing: 0.55em; padding-left: 0.55em; font-size: 24px; font-weight: 700; }

  .lr-2fa-icon {
    width: 50px; height: 50px; border-radius: 14px;
    background: linear-gradient(135deg, rgba(43,82,200,0.1), rgba(30,32,96,0.06));
    border: 1px solid rgba(30,32,96,0.12);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px; color: var(--royal);
  }

  .lr-back-btn {
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    width: 100%; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--txt-muted); transition: color 0.15s; padding: 4px;
  }
  .lr-back-btn:hover { color: var(--txt-sub); }

  .fu { opacity: 0; transform: translateY(16px); animation: fu 0.5s ease forwards; }
  .fu1 { animation-delay: 0.04s; }
  .fu2 { animation-delay: 0.10s; }
  .fu3 { animation-delay: 0.17s; }
  .fu4 { animation-delay: 0.24s; }
  .fu5 { animation-delay: 0.31s; }
  .fu6 { animation-delay: 0.38s; }
  @keyframes fu { to { opacity: 1; transform: translateY(0); } }

  .lr-stack { display: flex; flex-direction: column; gap: 16px; }

  .lr-mobile-logo { display: none; align-items: center; gap: 10px; margin-bottom: 28px; }
  .lr-mobile-logo .icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: linear-gradient(135deg, #2B52C8, #1E2060);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-weight: 700; font-size: 18px; color: #fff;
  }
  .lr-mobile-logo .name { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 20px; color: var(--txt-primary); }

  @media (max-width: 900px) {
    .lr-left { display: none; }
    .lr-right { min-height: 100vh; padding: 48px 24px; align-items: flex-start; }
    .lr-mobile-logo { display: flex; }
    .lr-form-wrap { max-width: 100%; }
  }
`;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({ email: '', password: '', twoFaCode: '' });
  const [showPass, setShowPass] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/admin', { replace: true }); }, [isAuthenticated, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

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
    <>
      <style>{STYLES}</style>
      <div className="lr-root">

        {/* ══════════ LEFT PANEL ══════════ */}
        <div className="lr-left">
          <div className="lr-bg-img" />
          <div className="lr-overlay" />
          <div className="lr-stripe" />

          <div className="lr-left-inner">

            {/* Logo */}
            <div className="lr-logo">
              <div className="lr-logo-icon">
                <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', padding: '5px' }}>
                  {/* Open book — rainbow pages matching WORD HOUSE logo */}
                  <path d="M9 28 Q23 11 37 28" stroke="#E8432E" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M10.5 29.5 Q23 13 35.5 29.5" stroke="#F5A623" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M12 31 Q23 15.5 34 31" stroke="#F5D623" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M14 32 Q23 17.5 32 32" stroke="#3AB85C" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M16 33 Q23 20 30 33" stroke="#00B4D8" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M18.5 34 Q23 22 27.5 34" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  {/* Book spine */}
                  <line x1="23" y1="13" x2="23" y2="35" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
                  {/* Base */}
                  <line x1="9" y1="35" x2="37" y2="35" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="lr-logo-text">
                <h1>Word House</h1>
                <span>Church Management System</span>
              </div>
            </div>

            {/* Hero */}
            <div className="lr-hero">
              <div className="lr-badge">
                <span className="lr-badge-dot" />
                <span>Church Operations Platform</span>
              </div>
              <h2 className="lr-headline">
                Empowering your<br />
                <em>congregation</em><br />
                to flourish
              </h2>
              <p className="lr-sub">
                Members, attendance, giving, events, and communications — unified for Word House Church.
              </p>
              <div className="lr-pills">
                {['Member Records', 'Tithes & Giving', 'Event Scheduling', 'Attendance', 'Announcements'].map((f) => (
                  <span key={f} className="lr-pill">
                    <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="#00B4D8" /></svg>
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            <div className="lr-testimonial">
              <span className="lr-quote-mark">"</span>
              <p className="lr-quote-text">
                Managing our congregation has never been smoother. This system gives us clarity and saves hours every week.
              </p>
              <div className="lr-quote-author">
                <div className="lr-avatar">OP</div>
                <div>
                  <div className="lr-author-name">Pastor Ope Rowland</div>
                  <div className="lr-author-role">Senior Pastor, Word House Church</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ══════════ RIGHT PANEL ══════════ */}
        <div className="lr-right">
          <div className="lr-form-wrap">

            {/* Mobile logo */}
            <div className="lr-mobile-logo">
              <div className="icon">W</div>
              <span className="name">Word House</span>
            </div>

            {!needs2FA ? (
              <>
                <div className="fu fu1">
                  <h2 className="lr-form-title">Welcome back</h2>
                  <p className="lr-form-sub">Sign in to your church dashboard</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="lr-stack">
                    <div className="lr-field fu fu2">
                      <label className="lr-label">Email address</label>
                      <input
                        type="email" className="lr-input"
                        placeholder="admin@wordhouse.org"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required autoFocus
                      />
                    </div>

                    <div className="lr-field fu fu3">
                      <label className="lr-label">Password</label>
                      <div className="lr-input-wrap">
                        <input
                          type={showPass ? 'text' : 'password'}
                          className="lr-input" style={{ paddingRight: 40 }}
                          placeholder="••••••••••"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          required
                        />
                        <button type="button" className="lr-eye" onClick={() => setShowPass(!showPass)}>
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div className="lr-forgot fu fu4">
                      <a href="/forgot-password">Forgot password?</a>
                    </div>

                    <div className="fu fu5">
                      <button type="submit" disabled={isLoading} className="lr-btn">
                        {isLoading
                          ? <><div className="lr-spinner" />Signing in…</>
                          : <>Sign in <ArrowRight size={15} /></>}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="lr-security fu fu6">
                  <ShieldCheck size={13} style={{ color: 'var(--txt-muted)', flexShrink: 0 }} />
                  <span>Secured with 256-bit encryption & optional 2FA</span>
                </div>
              </>
            ) : (
              <>
                <div className="fu fu1">
                  <div className="lr-2fa-icon"><ShieldCheck size={22} /></div>
                  <h2 className="lr-form-title">Two-factor auth</h2>
                  <p className="lr-form-sub">Enter the 6-digit code from your authenticator app</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="lr-stack">
                    <div className="lr-field fu fu2">
                      <label className="lr-label">Verification code</label>
                      <input
                        type="text" className="lr-input lr-otp"
                        placeholder="000000" maxLength={6}
                        value={form.twoFaCode}
                        onChange={(e) => setForm({ ...form, twoFaCode: e.target.value.replace(/\D/g, '') })}
                        autoFocus inputMode="numeric" autoComplete="one-time-code"
                      />
                    </div>

                    <div className="fu fu3">
                      <button type="submit" disabled={isLoading || form.twoFaCode.length < 6} className="lr-btn">
                        {isLoading
                          ? <><div className="lr-spinner" />Verifying…</>
                          : <>Verify & Sign in <ArrowRight size={15} /></>}
                      </button>
                    </div>

                    <div className="fu fu4">
                      <button type="button" className="lr-back-btn"
                        onClick={() => { setNeeds2FA(false); setForm({ ...form, twoFaCode: '' }); }}>
                        <ChevronLeft size={14} /> Back to sign in
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}

            <p style={{ marginTop: 36, textAlign: 'center', fontSize: 11, color: 'var(--txt-muted)' }}>
              Word House © {new Date().getFullYear()} · All rights reserved
            </p>
          </div>
        </div>

      </div>
    </>
  );
}