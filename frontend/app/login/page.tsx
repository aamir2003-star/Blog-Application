'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const BACKEND = 'http://localhost:5001';

// ─── OTP Segmented Input Component ───────────────────────────────────────────
interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
}

function OtpInput({ value, onChange }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, ' ').split('').slice(0, 6);

  const handleChange = (i: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit === ' ' ? '' : digit;
    onChange(next.join('').replace(/ /g, ''));
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d === ' ' ? '' : d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="
            w-11 h-14 text-center font-display-xl text-xl
            bg-white border border-outline-variant/50 rounded-lg text-on-surface
            focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none
            transition-all caret-primary
          "
        />
      ))}
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ5L6Ha4PAKSJji5U_8Zt2BsvYl0FY1uG3nfQ_0nP140mRWZ_9bjpY-t7cIhkIzUDG8LHyuvRhPyqsqYnQmhgbKoO1HdDE-wvQuzM8PCpXIDfXXeLlXxdOItm3w2xetV0_xTfDXhyAzL4QvXVCQXmm4da-X8TIRChzBTGEjlyZ2t-g-FtlSsRrX1871oIMTQoPnHSwx9iBz9Ab3BHG61C7h6wFmRshNB-wzgJDrPenzR9XG8eJWGRPeu3FzbWyREmI5zFw6_oYZ1c" />
  );
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5 fill-on-surface" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  // Sign In States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot Password Steps: 'email' | 'otp' | 'success'
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'success'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  
  // Forgot Password Validation & Input States
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Real-time password verification rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const isResetSubmitEnabled = isPasswordValid && forgotOtp.length === 6;

  useEffect(() => {
    if (!loading && user) router.replace('/onboarding');
  }, [user, loading, router]);

  // Timed redirect back to login state upon success
  useEffect(() => {
    if (forgotStep !== 'success') return;
    if (countdown <= 0) {
      // Completely reset forgot states and return to sign in
      setIsForgotPasswordView(false);
      setForgotStep('email');
      setForgotEmail('');
      setForgotOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setForgotSuccess('');
      setForgotError('');
      setCountdown(3);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [forgotStep, countdown]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to dispatch verification code');
      }
      setForgotStep('otp');
      setForgotSuccess(data.message || 'We sent a 6-digit verification code to your email.');
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!isResetSubmitEnabled) return;

    setForgotError('');
    setForgotSuccess('');
    setForgotSubmitting(true);

    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to configure new password');
      }

      setForgotStep('success');
      setForgotSuccess(data.message || 'Password successfully reset!');
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const resetRecoveryWizard = () => {
    setIsForgotPasswordView(false);
    setForgotStep('email');
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotSuccess('');
    setForgotError('');
  };

  if (loading) return null;

  return (
    <main className="min-h-screen flex items-center justify-center pt-24 pb-12 px-margin-mobile md:px-margin-desktop relative">
      <Link href="/" className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-2 font-label-caps text-sm text-secondary hover:text-on-surface transition-colors">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Go back to Home
      </Link>
      <div className="w-full max-w-[480px] space-y-6">
        
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-8 md:p-12 editorial-shadow relative z-10">
          
          {/* 1. CORE SIGN IN VIEW */}
          {!isForgotPasswordView && (
            <>
              <div className="text-center mb-10">
                <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Welcome back</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Sign in to your Writen account.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <a href={`${BACKEND}/api/auth/google`} className="flex items-center justify-center gap-2 border border-outline-variant/50 py-3 rounded-lg hover:bg-surface-container transition-all cursor-pointer">
                  <GoogleIcon />
                  <span className="font-label-caps text-label-caps uppercase text-on-surface">Google</span>
                </a>
                <a href={`${BACKEND}/api/auth/github`} className="flex items-center justify-center gap-2 border border-outline-variant/50 py-3 rounded-lg hover:bg-surface-container transition-all cursor-pointer">
                  <GitHubIcon />
                  <span className="font-label-caps text-label-caps uppercase text-on-surface">GitHub</span>
                </a>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/30"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface-container-lowest px-4 text-on-surface-variant font-label-caps">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant block" htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ada@writen.engineering"
                    className="w-full px-4 py-3 bg-white border border-outline-variant/50 rounded-lg font-body-md text-body-md input-focus-ring transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-label-caps text-label-caps text-on-surface-variant block" htmlFor="password">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordView(true);
                        setForgotError('');
                        setForgotSuccess('');
                      }}
                      className="font-label-caps text-[11px] text-primary hover:underline transition-all cursor-pointer bg-transparent border-0"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white border border-outline-variant/50 rounded-lg font-body-md text-body-md input-focus-ring transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm border border-error/20">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase py-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : 'Sign In'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-primary font-semibold hover:underline transition-all">Create one</Link>
                </p>
              </div>
            </>
          )}

          {/* 2. FORGOT PASSWORD: REQUEST EMAIL STEP */}
          {isForgotPasswordView && forgotStep === 'email' && (
            <>
              <div className="text-center mb-10">
                <span className="material-symbols-outlined text-4xl text-primary mb-4 animate-pulse">lock_reset</span>
                <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Reset Password</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Enter your email to request a secure 6-digit recovery code.</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant block" htmlFor="forgot-email">Email address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ada@writen.engineering"
                    className="w-full px-4 py-3 bg-white border border-outline-variant/50 rounded-lg font-body-md text-body-md input-focus-ring transition-all"
                  />
                </div>

                {forgotError && (
                  <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm border border-error/20">
                    {forgotError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="w-full bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase py-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {forgotSubmitting ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : 'Send Verification Code'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={resetRecoveryWizard}
                  className="text-primary font-semibold hover:underline transition-all cursor-pointer bg-transparent border-0 font-body-md text-body-md"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          {/* 3. FORGOT PASSWORD: ENTER OTP & NEW PASSWORD STEP */}
          {isForgotPasswordView && forgotStep === 'otp' && (
            <>
              <div className="text-center mb-8">
                <span className="material-symbols-outlined text-4xl text-primary mb-4 animate-bounce">mail</span>
                <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Check Your Email</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">We sent a 6-digit recovery code to:</p>
                <div className="font-body-sm text-[12px] bg-surface-container px-3 py-1.5 rounded-full inline-block mt-3 text-on-surface-variant font-medium">
                  <span className="text-on-surface font-semibold">{forgotEmail}</span>{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('email');
                      setForgotOtp('');
                      setForgotSuccess('');
                      setForgotError('');
                    }}
                    className="text-primary hover:underline ml-1 cursor-pointer bg-transparent border-0 font-bold"
                  >
                    (Change)
                  </button>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-3">
                  <label className="font-label-caps text-label-caps text-on-surface-variant block text-center">Enter 6-Digit Code</label>
                  <OtpInput value={forgotOtp} onChange={setForgotOtp} />
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant block" htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white border border-outline-variant/50 rounded-lg font-body-md text-body-md input-focus-ring transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant block" htmlFor="confirm-new-password">Confirm New Password</label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white border border-outline-variant/50 rounded-lg font-body-md text-body-md input-focus-ring transition-all"
                  />
                </div>

                {/* Real-time Requirements checklist grid */}
                <div className="bg-surface-container/30 border border-outline-variant/20 rounded-lg p-4 space-y-2.5">
                  <p className="font-label-caps text-[10px] text-on-surface-variant tracking-wider block uppercase mb-1">Security Checklist</p>
                  
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={`material-symbols-outlined text-[16px] ${hasMinLength ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                      {hasMinLength ? 'check_circle' : 'circle'}
                    </span>
                    <span className={hasMinLength ? 'text-on-surface' : 'text-on-surface-variant/70'}>At least 8 characters</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={`material-symbols-outlined text-[16px] ${hasUppercase ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                      {hasUppercase ? 'check_circle' : 'circle'}
                    </span>
                    <span className={hasUppercase ? 'text-on-surface' : 'text-on-surface-variant/70'}>At least one uppercase letter</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={`material-symbols-outlined text-[16px] ${hasLowercase ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                      {hasLowercase ? 'check_circle' : 'circle'}
                    </span>
                    <span className={hasLowercase ? 'text-on-surface' : 'text-on-surface-variant/70'}>At least one lowercase letter</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={`material-symbols-outlined text-[16px] ${hasNumber ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                      {hasNumber ? 'check_circle' : 'circle'}
                    </span>
                    <span className={hasNumber ? 'text-on-surface' : 'text-on-surface-variant/70'}>At least one digit/number</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium border-t border-outline-variant/20 pt-2.5 mt-2">
                    <span className={`material-symbols-outlined text-[16px] ${passwordsMatch ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                      {passwordsMatch ? 'check_circle' : 'circle'}
                    </span>
                    <span className={passwordsMatch ? 'text-on-surface' : 'text-on-surface-variant/70'}>Passwords match</span>
                  </div>
                </div>

                {forgotSuccess && (
                  <div className="bg-primary/5 text-primary px-4 py-3 rounded-lg text-sm border border-primary/20 text-center">
                    {forgotSuccess}
                  </div>
                )}

                {forgotError && (
                  <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm border border-error/20 text-center">
                    {forgotError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotSubmitting || !isResetSubmitEnabled}
                  className="w-full bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase py-4 rounded-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {forgotSubmitting ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : 'Reset Password'}
                </button>
              </form>

              <div className="mt-8 text-center flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={forgotSubmitting}
                  className="text-primary font-semibold hover:underline text-xs bg-transparent border-0 cursor-pointer disabled:opacity-50"
                >
                  Resend Verification Code
                </button>
                <button
                  type="button"
                  onClick={resetRecoveryWizard}
                  className="text-on-surface-variant font-medium hover:underline text-sm bg-transparent border-0 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          {/* 4. FORGOT PASSWORD: RESET SUCCESS SCREEN */}
          {isForgotPasswordView && forgotStep === 'success' && (
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">Password Updated</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mx-auto">
                Your new password has been successfully configured.
              </p>
              <div className="bg-primary/5 text-primary px-4 py-3 rounded-lg text-sm border border-primary/20 max-w-xs mx-auto font-medium">
                Returning to Sign In in {countdown}s...
              </div>
              <button
                type="button"
                onClick={resetRecoveryWizard}
                className="font-label-caps text-label-caps uppercase text-primary hover:underline font-semibold block mx-auto cursor-pointer bg-transparent border-0 mt-4"
              >
                Sign In Immediately
              </button>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
