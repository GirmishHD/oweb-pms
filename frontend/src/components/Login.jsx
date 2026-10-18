import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [capsLockActive, setCapsLockActive] = useState(false);

    const usernameInputRef = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem('oweb_remembered_username');
        if (saved) {
            setUsername(saved);
        }
    }, []);

    const handleSignInSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const cleanUsername = username.trim();
        const cleanPassword = password.trim() || 'password';
        if (rememberMe) {
            localStorage.setItem('oweb_remembered_username', cleanUsername);
        } else {
            localStorage.removeItem('oweb_remembered_username');
        }
        const errorMessage = await onLogin(cleanUsername, cleanPassword);
        setIsLoading(false);
        if (errorMessage) {
            setError(errorMessage);
        }
    };

    const handleKeyDetection = (e) => {
        if (e.getModifierState) {
            setCapsLockActive(e.getModifierState('CapsLock'));
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
            {/* Subtle ambient lighting */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Centered Login Card */}
            <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200/80 relative z-10 animate-fade-in">
                {/* Brand Logo & Bureau Identity */}
                <div className="text-center mb-6">
                    <div className="inline-flex p-3 bg-gradient-to-br from-sky-500 to-emerald-600 rounded-2xl shadow-lg shadow-sky-500/20 mb-3">
                        <Logo className="h-9 w-9 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                        Oromia Water Resource Bureau
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Program Management System (OWEB PB-PMS)
                    </p>
                </div>

                <div className="mb-5 pb-3 border-b border-slate-100 text-center">
                    <h2 className="text-lg font-bold text-slate-900">
                        Sign In
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Enter your bureau credentials to access the system
                    </p>
                </div>

                {/* Error Feedback */}
                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-shake">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold leading-relaxed">{error}</span>
                    </div>
                )}

                {/* Sign In Form */}
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                    {/* Username Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Username or Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <User className="w-4 h-4" />
                            </div>
                            <input
                                ref={usernameInputRef}
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username or email (e.g. admin)"
                                required
                                autoComplete="username"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setPassword('password')}
                                className="text-[11px] text-slate-400 hover:text-sky-600 transition"
                            >
                                Default: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold text-[10px]">password</code>
                            </button>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyUp={handleKeyDetection}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {capsLockActive && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                                <span>⚠️</span>
                                <span>Caps Lock is ON</span>
                            </div>
                        )}
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className="text-xs font-medium">Remember me on this device</span>
                        </label>
                    </div>

                    {/* Primary Sign In Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Security Footer Notice */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Authorized Bureau Personnel Only</span>
                </div>
            </div>

            {/* Simple Bottom Copyright */}
            <footer className="mt-6 text-center text-xs text-slate-500 relative z-10">
                © {new Date().getFullYear()} Oromia Water Resource Bureau (OWEB). All rights reserved.
            </footer>
        </div>
    );
};

export default Login;
