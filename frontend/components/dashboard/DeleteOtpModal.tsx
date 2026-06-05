'use client';

interface DeleteOtpModalProps {
  deletingPost: any;
  otpCode: string;
  setOtpCode: (val: string) => void;
  otpError: string | null;
  setOtpError: (val: string | null) => void;
  sendingOtp: boolean;
  deleting: boolean;
  showOtpInput: boolean;
  setShowOtpInput: (val: boolean) => void;
  onRequestOtp: () => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
}

export default function DeleteOtpModal({
  deletingPost,
  otpCode,
  setOtpCode,
  otpError,
  setOtpError,
  sendingOtp,
  deleting,
  showOtpInput,
  setShowOtpInput,
  onRequestOtp,
  onConfirmDelete,
  onCancel,
}: DeleteOtpModalProps) {
  if (!deletingPost) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant/30 max-w-sm w-full rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 space-y-4">
          
          {/* Modal Warning Header */}
          <div className="flex items-center gap-3 text-error">
            <div className="p-2.5 bg-error/10 rounded-xl">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <h3 className="font-headline-lg text-lg font-bold text-on-surface">Delete Publication</h3>
          </div>

          {/* Warning Content description */}
          <div className="space-y-2">
            <p className="font-body-md text-sm text-on-surface leading-normal">
              Are you absolutely sure you want to delete **"{deletingPost.title}"**?
            </p>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              This action is permanent and cannot be undone. All story data, assets, and analytics will be wiped.
            </p>
          </div>

          {/* Step-up security authorization for published stories */}
          {deletingPost.status === 'PUBLISHED' && (
            <div className="pt-2 border-t border-outline-variant/20 space-y-3">
              {!showOtpInput ? (
                <div className="space-y-3">
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                      🛡️ Deleting a published publication requires step-up security. We will send a 6-digit authorization code to your email.
                    </p>
                  </div>
                  
                  {otpError && (
                    <p className="text-xs text-error font-medium">{otpError}</p>
                  )}

                  <button
                    onClick={onRequestOtp}
                    disabled={sendingOtp}
                    className="w-full bg-primary text-on-primary font-label-caps text-xs py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
                  >
                    {sendingOtp ? (
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                    )}
                    {sendingOtp ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold font-label-caps uppercase text-on-surface-variant">
                      Enter 6-Digit Email Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ''));
                        setOtpError(null);
                      }}
                      className="w-full text-center tracking-[0.5em] text-lg font-bold bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
                    />
                  </div>

                  {otpError && (
                    <p className="text-xs text-error font-medium">{otpError}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span>Didn't receive it?</span>
                    <button 
                      onClick={onRequestOtp} 
                      disabled={sendingOtp}
                      className="text-primary hover:underline font-semibold disabled:opacity-50 bg-transparent border-none"
                    >
                      {sendingOtp ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action layout buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => {
                onCancel();
                setShowOtpInput(false);
                setOtpCode('');
                setOtpError(null);
              }}
              disabled={deleting}
              className="font-label-caps text-xs text-on-surface-variant hover:text-on-surface px-4 py-2.5 rounded-full border border-outline-variant/30 hover:bg-surface-container-low hover:text-on-surface transition-all font-semibold cursor-pointer disabled:opacity-50 focus:outline-none bg-transparent"
            >
              Cancel
            </button>
            
            {/* Delete button only active if draft OR otp is sent */}
            {(deletingPost.status !== 'PUBLISHED' || showOtpInput) && (
              <button
                onClick={onConfirmDelete}
                disabled={deleting || (deletingPost.status === 'PUBLISHED' && otpCode.length !== 6)}
                className="bg-error text-on-error font-label-caps text-xs px-5 py-2.5 rounded-full hover:bg-error/90 transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus:outline-none border-none"
              >
                {deleting ? (
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                ) : null}
                Confirm Deletion
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
