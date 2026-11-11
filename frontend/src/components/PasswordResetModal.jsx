import React, { useState, useEffect } from 'react';

export default function PasswordResetModal({
    isOpen,
    onClose,
    onResetSuccess,
    language = 'am',
    apiUrl = ''
}) {
    const [step, setResetStep] = useState(1); // 1: request code, 2: verify & set password
    const [phoneNumber, setPhoneNumber] = useState('');
    const [code, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [needsTelegramLink, setNeedsTelegramLink] = useState(false);
    const [botLink, setBotLink] = useState('https://t.me/fasterekub_bot');
    const [attemptsLeft, setAttemptsLeft] = useState(null);

    const [expiresIn, setExpiresIn] = useState(0);  // expiration countdown in seconds
    const [cooldown, setCooldown] = useState(0);    // resend cooldown in seconds

    const t = {
        title1: language === 'am' ? 'የይለፍ ቃል መርሳት' : 'Forgot Password',
        title2: language === 'am' ? 'አዲስ የይለፍ ቃል ያስቀምጡ' : 'Set New Password',
        phoneLabel: language === 'am' ? 'ስልክ ቁጥር' : 'Phone Number',
        phonePlaceholder: language === 'am' ? '0912345678 ወይም +251...' : '0912345678 or +251...',
        sendBtn: language === 'am' ? 'የማረጋገጫ ኮድ ላክ' : 'Send Verification Code',
        sending: language === 'am' ? 'በመላክ ላይ...' : 'Sending Code...',
        resendBtn: language === 'am' ? 'ኮድ ድጋሚ ላክ' : 'Resend Code',
        resendIn: (s) => language === 'am' ? `በ ${s} ሰከንድ ውስጥ ድጋሚ ላክ` : `Resend in ${s}s`,
        waitBtn: (s) => language === 'am' ? `${s} ሰከንድ ይጠብቁ` : `Wait ${s}s`,
        codeLabel: language === 'am' ? 'ባለ 6-አሃዝ የማረጋገጫ ኮድ' : '6-Digit Verification Code',
        newPwLabel: language === 'am' ? 'አዲስ የይለፍ ቃል (ቢያንስ 6 ፊደላት)' : 'New Password (Min 6 chars)',
        confirmPwLabel: language === 'am' ? 'የይለፍ ቃሉን ያረጋግጡ' : 'Confirm New Password',
        showPw: language === 'am' ? 'የይለፍ ቃል አሳይ' : 'Show Password',
        submitReset: language === 'am' ? 'የይለፍ ቃል ቀይር' : 'Reset Password',
        updating: language === 'am' ? 'በመቀየር ላይ...' : 'Updating Password...',
        changePhone: language === 'am' ? '← ስልክ ቁጥር ቀይር' : '← Change Phone',
        expiresLabel: language === 'am' ? 'የሚያበቃው በ:' : 'Expires in:',
        attemptsRemaining: (n) => language === 'am' ? `የቀሩ ሙከራዎች: ${n}` : `Attempts remaining: ${n}`,
        notLinkedTitle: language === 'am' ? 'መለያዎ ከቴሌግራም ጋር አልተገናኘም' : 'Telegram Account Not Linked',
        notLinkedDesc: language === 'am'
            ? 'የይለፍ ቃል መልሶ ማግኛ ኮድ በቴሌግራም ለመቀበል መጀመሪያ የእኛን ይፋዊ ቦት ከፍተው Start ይጫኑ።'
            : 'To receive verification codes via Telegram, open our official bot and tap Start.',
        openBotBtn: language === 'am' ? '@fasterekub_bot ን ክፈቱ →' : 'Open @fasterekub_bot →',
        pwMismatch: language === 'am' ? 'የይለፍ ቃሎች አይዛመዱም' : 'Passwords do not match',
        pwTooShort: language === 'am' ? 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት' : 'Password must be at least 6 characters',
        enterPhone: language === 'am' ? 'እባክዎ ስልክ ቁጥር ያስገቡ' : 'Please enter phone number',
        enterCode: language === 'am' ? 'እባክዎ ባለ 6-አሃዝ ኮድ ያስገቡ' : 'Please enter the 6-digit code',
        codeSentSuccess: language === 'am' ? 'የማረጋገጫ ኮድ ወደ ቴሌግራም መለያዎ ተልኳል!' : 'Verification code sent to your Telegram!',
        resetSuccessMsg: language === 'am' ? 'የይለፍ ቃል በተሳካ ሁኔታ ተቀይሯል! አሁን መግባት ይችላሉ።' : 'Password reset successfully! You can now log in.',
        networkError: language === 'am' ? 'የኔትወርክ ስህተት። እባክዎ እንደገና ይሞክሩ።' : 'Network error. Please try again.'
    };

    // Countdown timer effect
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            setExpiresIn(prev => (prev > 0 ? prev - 1 : 0));
            setCooldown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [isOpen]);

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleClose = () => {
        setResetStep(1);
        setPhoneNumber('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError(null);
        setSuccessMessage(null);
        setNeedsTelegramLink(false);
        setAttemptsLeft(null);
        if (onClose) onClose();
    };

    // Step 1: Request Verification Code
    const handleRequestCode = async (e) => {
        e?.preventDefault();
        setError(null);
        setNeedsTelegramLink(false);

        const cleanPhone = phoneNumber.trim();
        if (!cleanPhone) {
            setError(t.enterPhone);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/v1/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: cleanPhone })
            });
            const data = await res.json();

            if (!res.ok) {
                if (data.needsTelegramLink || data.needsStart || data.needsSetup) {
                    setNeedsTelegramLink(true);
                    if (data.botLink) setBotLink(data.botLink);
                    setError(data.error || t.notLinkedDesc);
                } else {
                    setError(data.error || 'Failed to send reset code');
                }
                if (data.cooldownSeconds) setCooldown(data.cooldownSeconds);
                return;
            }

            // Successfully sent
            setResetStep(2);
            setExpiresIn(data.expiresIn || 600);
            setCooldown(data.cooldownSeconds || 60);
            setSuccessMessage(data.message || t.codeSentSuccess);
        } catch {
            setError(t.networkError);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Confirm Code and Reset Password
    const handleResetPassword = async (e) => {
        e?.preventDefault();
        setError(null);

        const cleanCode = code.trim();
        if (!cleanCode || cleanCode.length < 4) {
            setError(t.enterCode);
            return;
        }
        if (newPassword.length < 6) {
            setError(t.pwTooShort);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t.pwMismatch);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/v1/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: phoneNumber.trim(),
                    code: cleanCode,
                    newPassword
                })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to reset password');
                if (data.attemptsLeft !== undefined) {
                    setAttemptsLeft(data.attemptsLeft);
                }
                return;
            }

            setSuccessMessage(t.resetSuccessMsg);
            setTimeout(() => {
                if (onResetSuccess) onResetSuccess();
                handleClose();
            }, 1500);
        } catch {
            setError(t.networkError);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md p-6 bg-[#0e172a] border border-gold-500/30 rounded-3xl shadow-2xl text-white">
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-black font-black text-sm shadow-md">
                            🔐
                        </span>
                        <h3 className="text-base font-bold text-gold-300">
                            {step === 1 ? t.title1 : t.title2}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-3 my-3 text-xs text-red-300 bg-red-950/70 border border-red-500/40 rounded-xl leading-relaxed">
                        {error}
                        {attemptsLeft !== null && (
                            <span className="block font-semibold mt-1 text-red-200">
                                {t.attemptsRemaining(attemptsLeft)}
                            </span>
                        )}
                    </div>
                )}

                {/* Success Banner */}
                {successMessage && (
                    <div className="p-3 my-3 text-xs text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 rounded-xl leading-relaxed flex items-center gap-2">
                        <span>✓</span>
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Telegram Bot Link Card */}
                {needsTelegramLink && (
                    <div className="p-4 my-3 bg-blue-950/50 border border-blue-500/30 rounded-2xl space-y-2.5 text-xs">
                        <div className="flex items-center gap-2 text-blue-300 font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                            <span>{t.notLinkedTitle}</span>
                        </div>
                        <p className="text-white/75 leading-relaxed">{t.notLinkedDesc}</p>
                        <a
                            href={botLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition shadow-md active:scale-95"
                        >
                            <span>{t.openBotBtn}</span>
                        </a>
                    </div>
                )}

                {/* STEP 1: Enter Phone Number */}
                {step === 1 && (
                    <form onSubmit={handleRequestCode} className="mt-4 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-white/70 mb-1.5">
                                {t.phoneLabel}
                            </label>
                            <input
                                type="tel"
                                placeholder={t.phonePlaceholder}
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition"
                                required
                            />
                        </div>

                        {/* Explanatory Info Box */}
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1.5 text-[11px] text-white/60">
                            <p className="font-semibold text-gold-300/90">ℹ️ {language === 'am' ? 'መመሪያ' : 'Information'}:</p>
                            <p>{language === 'am' ? 'የማረጋገጫ ኮድ ወደ ቴሌግራም መለያዎ በ @fasterekub_bot በኩል ይላካል።' : 'Verification code will be delivered to your Telegram account via @fasterekub_bot.'}</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || cooldown > 0}
                            className="w-full py-3.5 font-black rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-black text-sm transition shadow-lg shadow-gold-500/20 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? t.sending : cooldown > 0 ? t.waitBtn(cooldown) : t.sendBtn}
                        </button>
                    </form>
                )}

                {/* STEP 2: Enter 6-Digit Code & New Password */}
                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="mt-4 space-y-3.5">
                        <div className="flex items-center justify-between text-xs text-white/60 bg-white/5 px-3 py-2 rounded-xl">
                            <span>{t.phoneLabel}: <b className="text-white font-mono">{phoneNumber}</b></span>
                            <span className="text-gold-400 font-mono font-bold">
                                {t.expiresLabel} {formatTimer(expiresIn)}
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-white/70 mb-1.5">
                                {t.codeLabel}
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="123456"
                                value={code}
                                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-3 tracking-widest text-center text-xl font-mono font-bold bg-white/5 border border-white/10 rounded-xl text-gold-300 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-white/70 mb-1.5">
                                {t.newPwLabel}
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-white/70 mb-1.5">
                                {t.confirmPwLabel}
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-0.5">
                            <input
                                type="checkbox"
                                id="showPwCheckbox"
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                                className="accent-gold-500 h-4 w-4 rounded cursor-pointer"
                            />
                            <label htmlFor="showPwCheckbox" className="text-xs text-white/70 cursor-pointer select-none">
                                {t.showPw}
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || expiresIn === 0}
                            className="w-full py-3.5 font-black rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-black text-sm transition shadow-lg shadow-gold-500/20 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? t.updating : t.submitReset}
                        </button>

                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                            <button
                                type="button"
                                onClick={() => setResetStep(1)}
                                className="text-white/50 hover:text-white transition"
                            >
                                {t.changePhone}
                            </button>
                            <button
                                type="button"
                                onClick={handleRequestCode}
                                disabled={cooldown > 0 || loading}
                                className="text-gold-400 hover:text-gold-300 font-semibold disabled:text-white/30 transition"
                            >
                                {cooldown > 0 ? t.resendIn(cooldown) : t.resendBtn}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

