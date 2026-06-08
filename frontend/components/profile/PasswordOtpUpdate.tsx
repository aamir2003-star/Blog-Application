'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/auth-context';

interface PasswordOtpUpdateProps {
  user: User;
}

export default function PasswordOtpUpdate({ user }: PasswordOtpUpdateProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer effect for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to dispatch verification code.');
      }

      setStep('verify');
      setResendCooldown(60);
      setSuccess('Verification code sent to your email.');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    if (!isValid) {
      setError('Please fulfill all password requirements.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          otp: code,
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setSuccess('Password updated successfully!');
      setCode('');
      setPassword('');
      setConfirmPassword('');
      setStep('request');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {step === 'request' ? (
        <div className="space-y-4 text-center py-2">
          <span className="material-symbols-outlined text-primary text-[32px] animate-pulse block">mail</span>
          <p className="text-xs text-on-surface-variant font-medium max-w-xs mx-auto">
            To reset your password using email, we will send a secure 6-digit verification code to <span className="font-semibold text-on-surface">{user.email}</span>.
          </p>
          
          {error && (
            <p className="text-xs text-error font-semibold flex items-center justify-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}

          <button 
            type="button" 
            onClick={handleSendOtp}
            disabled={saving}
            className="w-full bg-primary-container text-on-primary-container disabled:opacity-50 py-3 rounded-xl font-label-caps text-xs font-bold uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            {saving ? (
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            ) : 'Send Verification Code'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface-variant block" htmlFor="otp-code">6-Digit Code</label>
            <input 
              id="otp-code"
              type="text" 
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-2.5 bg-white border border-outline-variant/50 rounded-xl font-body-md text-sm text-center font-bold tracking-widest outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface-variant block" htmlFor="otp-pass">New Password</label>
            <input 
              id="otp-pass"
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-white border border-outline-variant/50 rounded-xl font-body-md text-sm outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface-variant block" htmlFor="conf-otp-pass">Confirm New Password</label>
            <input 
              id="conf-otp-pass"
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-white border border-outline-variant/50 rounded-xl font-body-md text-sm outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>

          {/* Security checklist */}
          {password.length > 0 && (
            <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3.5 space-y-2 select-none">
              <p className="font-label-caps text-[9px] text-on-surface-variant tracking-wider block uppercase font-bold">New Password Requirements</p>
              <div className="flex items-center gap-2 text-[11px] font-medium">
                <span className={`material-symbols-outlined text-[14px] ${hasMinLength ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                  {hasMinLength ? 'check_circle' : 'circle'}
                </span>
                <span className={hasMinLength ? 'text-on-surface' : 'text-on-surface-variant/75'}>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium">
                <span className={`material-symbols-outlined text-[14px] ${hasUppercase ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                  {hasUppercase ? 'check_circle' : 'circle'}
                </span>
                <span className={hasUppercase ? 'text-on-surface' : 'text-on-surface-variant/75'}>Uppercase & lowercase letters</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium">
                <span className={`material-symbols-outlined text-[14px] ${hasNumber ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                  {hasNumber ? 'check_circle' : 'circle'}
                </span>
                <span className={hasNumber ? 'text-on-surface' : 'text-on-surface-variant/75'}>At least one digit/number</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium border-t border-outline-variant/20 pt-2 mt-1">
                <span className={`material-symbols-outlined text-[14px] ${passwordsMatch ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                  {passwordsMatch ? 'check_circle' : 'circle'}
                </span>
                <span className={passwordsMatch ? 'text-on-surface' : 'text-on-surface-variant/75'}>Passwords match</span>
              </div>
            </div>
          )}

          {success && (
            <p className="text-xs text-primary font-semibold text-center mt-2 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {success}
            </p>
          )}

          {error && (
            <p className="text-xs text-error font-semibold text-center mt-2 flex items-center justify-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={saving || code.length !== 6 || !isValid}
            className="w-full bg-primary-container text-on-primary-container disabled:opacity-50 py-3 rounded-xl font-label-caps text-xs font-bold uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            {saving ? (
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            ) : 'Verify & Reset Password'}
          </button>

          <div className="flex justify-between items-center text-xs mt-4 select-none">
            <button
              type="button"
              onClick={() => { setStep('request'); setCode(''); setError(''); setSuccess(''); }}
              className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer bg-transparent border-none font-medium"
            >
              ← Back
            </button>
            
            {resendCooldown > 0 ? (
              <span className="text-on-surface-variant/50 font-medium font-body-md">Resend in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-primary hover:underline font-semibold cursor-pointer bg-transparent border-none"
              >
                Resend code
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
