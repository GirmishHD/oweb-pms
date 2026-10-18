import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { 
    Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, 
    Droplets, Activity, Layers, CheckCircle2, Globe, HelpCircle, 
    X, KeyRound, Check
} from 'lucide-react';

const TRANSLATIONS = {
    EN: {
        bureauName: 'OROMIA WATER BUREAU',
        bureauSub: 'National Regional State of Oromia',
        tagline: 'Sustainable Water Services for Every Community',
        description: 'Coordinating sustainable water supply, comprehensive sanitation, hygiene, and climate-resilient water infrastructure across all 6 administrative clusters of Oromia.',
        pillar1Title: 'Water Infrastructure Delivery',
        pillar1Desc: 'Deep boreholes, multi-village pipelines, and urban treatment plants.',
        pillar2Title: 'Partner & Program Alignment',
        pillar2Desc: 'Transparent donor coordination across COWASH, OWNP, UWSSP-II, and Borana Resilience.',
        pillar3Title: 'Climate & Drought Resilience',
        pillar3Desc: 'Pastoralist water corridors, solar pumping conversions, and hydrological monitoring.',
        welcomeTitle: 'Welcome Back',
        welcomeSub: 'Sign in to access the Oromia Water Bureau digital platform.',
        usernameLabel: 'Username or Bureau Email',
        usernamePlaceholder: 'Enter your username or email (e.g. admin)',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter your password',
        defaultCredHint: 'Default password:',
        rememberMe: 'Remember me on this device',
        forgotPassword: 'Forgot password?',
        signInButton: 'Sign In to Portal',
        authenticating: 'Authenticating...',
        capsLockWarning: 'Caps Lock is ON',
        authorizedOnly: 'Official government system — Authorized personnel only',
        forgotModalTitle: 'Account Recovery & Access Assistance',
        forgotModalDesc: 'In accordance with Oromia Water Bureau security policies, automated public email password resets are restricted to protect critical regional infrastructure systems.',
        forgotModalStepsTitle: 'Standard Bureau Recovery Protocol:',
        forgotModalStep1: 'Contact your Zonal or Cluster IT Administrator or Head Office ICT Directorate.',
        forgotModalStep2: 'Provide your official Bureau Staff ID / Employee Number and assigned duty station.',
        forgotModalStep3: 'Your account credentials will be securely reset and provided via verified internal channels.',
        forgotContactDirect: 'OWEB ICT Support Desk: support.ict@oweb.gov.et | Internal Ext: 4410 / 4412',
        closeModal: 'Close & Return to Sign In',
        language: 'Language',
        publicPortalLink: 'Public Transparency Portal'
    },
    OM: {
        bureauName: 'BIIROO QABEENYA BISHAANII OROMIYAA',
        bureauSub: 'Mootummaa Naannoo Oromiyaa',
        tagline: 'Tajaajila Bishaanii Itti-Fufiinsa Qabu Hawaasa Hundaaf',
        description: 'Dhiyeessii bishaan dhugaatii qulqulluu, eegumsa fayyaa naannoo, fi ijaarsa bu\'uuraalee misooma bishaanii daminoolee naannoo 6 keessatti qindeessuu.',
        pillar1Title: 'Ijaarsa Bu\'uuraalee Misooma Bishaanii',
        pillar1Desc: 'Boraayiloota gadi fagoowwan, sarara bishaanii gandoota heddduu, fi warshaalee calaltuu bishaanii magaalaa.',
        pillar2Title: 'Qindoomina Michoota Misoomaa',
        pillar2Desc: 'Sagantaalee COWASH, OWNP, UWSSP-II, fi BRWDLP waliin qindaa\'uu.',
        pillar3Title: 'Dandeettii Dandamannaa Hongee',
        pillar3Desc: 'Bishaanii fi paampii anniisaa aduutiin hojjetan bakka tikfatee fi jireenya hawaasaatti babal\'isuu.',
        welcomeTitle: 'Baga Nagaan Dhuftan',
        welcomeSub: 'Pilaatfoormii dijitaalaa Biiroo Qabeenya Bishaanii Oromiyaa seenuuf galmaa\'aa.',
        usernameLabel: 'Maqaa Fayyadamaa ykn Imeelii Biiroo',
        usernamePlaceholder: 'Maqaa fayyadamaa ykn imeelii galchaa (fkn. admin)',
        passwordLabel: 'Jecha Icchitii',
        passwordPlaceholder: 'Jecha icchiitii keessan galchaa',
        defaultCredHint: 'Jecha icchiitii idilee:',
        rememberMe: 'Meesshaa kanarratti na yaadadhu',
        forgotPassword: 'Jecha icchiitii dagattanii?',
        signInButton: 'Gara Pilaatfoormiitti Seenaa',
        authenticating: 'Mirkaneessaa jira...',
        capsLockWarning: 'Caps Lock banee jira',
        authorizedOnly: 'Sirna mootummaa eeggamaa — Hojjetoota heyyama qabaniif qofa',
        forgotModalTitle: 'Gargaarsa Deebisanii Banuu Herregaa',
        forgotModalDesc: 'Akka qajeelfama nageenya odeeffannoo Biiroo Bishaanii Oromiyaatti, sirna eegumsa bu\'uuraaleetiif jecha icchiitii deebisuun qaamaan mirkanaa\'a.',
        forgotModalStepsTitle: 'Tartiiba Deebisanii Argachuu:',
        forgotModalStep1: 'Qindeessaa IT Dambii/Kilaastaraa ykn Daayirektooreetii Saayinsii fi Teknooloojii Biiroo qunnamaa.',
        forgotModalStep2: 'Waraqaa eenyummaa hojjetaa (Staff ID) fi bakka ramaddii keessan dhiyeessaa.',
        forgotModalStep3: 'Odeeffannoon seensaa haaraan karaa nageenyi isaa mirkanaa\'een isiniif kennama.',
        forgotContactDirect: 'Gargaarsa ICT Biiroo: support.ict@oweb.gov.et | Sarara Keessaa: 4410 / 4412',
        closeModal: 'Cufiitii Seensaatti Deebi\'i',
        language: 'Afaan',
        publicPortalLink: 'Pootaalii Iftoomina Uummataa'
    },
    AM: {
        bureauName: 'የኦሮሚያ የውሃ ቢሮ',
        bureauSub: 'የኦሮሚያ ብሔራዊ ክልላዊ መንግሥት',
        tagline: 'ዘላቂ የውሃ አገልግሎት ለመላው ማህበረሰብ',
        description: 'በኦሮሚያ 6 ክላስተሮች ውስጥ አስተማማኝ ንጹህ የመጠጥ ውሃ፣ የአካባቢ ጽዳትና ንጽህና፣ እንዲሁም ከአየር ንብረት ጋር የሚጣጣሙ የውሃ መሠረተ ልማቶችን ማስተባበር።',
        pillar1Title: 'የውሃ መሠረተ ልማት ዝርጋታ',
        pillar1Desc: 'ጥልቅ የከርሰ ምድር ጉድጓዶች፣ የበርካታ መንደሮች የውሃ መስመሮች እና የከተሞች ማጣሪያዎች።',
        pillar2Title: 'የልማት አጋሮችና ፕሮግራሞች ቅንጅት',
        pillar2Desc: 'ከCOWASH፣ OWNP፣ UWSSP-II እና ቦረና ድርቅ መቋቋሚያ ፕሮግራሞች ጋር ግልጽ አጋርነት።',
        pillar3Title: 'የአየር ንብረትና ድርቅ መቋቋም',
        pillar3Desc: 'የፀሐይ ብርሃን ኃይል የውሃ ፓምፖች፣ የእንስሳት ውሃ ማጠጫ ኮሪደሮች እና የውሃ ሃብት ቁጥጥር።',
        welcomeTitle: 'እንኳን ደህና መጡ',
        welcomeSub: 'ወደ ኦሮሚያ የውሃ ቢሮ ዲጂታል መድረክ ለመግባት መለያዎን ያስገቡ።',
        usernameLabel: 'የተጠቃሚ ስም ወይም የቢሮ ኢሜይል',
        usernamePlaceholder: 'የተጠቃሚ ስም ወይም ኢሜይል ያስገቡ (ለምሳሌ admin)',
        passwordLabel: 'የይለፍ ቃል',
        passwordPlaceholder: 'የይለፍ ቃልዎን ያስገቡ',
        defaultCredHint: 'ነባሪ የይለፍ ቃል:',
        rememberMe: 'በዚህ መሣሪያ ላይ አስታውሰኝ',
        forgotPassword: 'የይለፍ ቃል ረሱ?',
        signInButton: 'ወደ መድረክ ግባ',
        authenticating: 'በማረጋገጥ ላይ...',
        capsLockWarning: 'Caps Lock በርቷል',
        authorizedOnly: 'ይፋዊ የመንግስት ስርዓት — ለተፈቀደላቸው ሰራተኞች ብቻ',
        forgotModalTitle: 'የመለያ መልሶ ማግኛ እና ድጋፍ',
        forgotModalDesc: 'በኦሮሚያ የውሃ ቢሮ የደህንነት መመሪያ መሠረት፣ የክልሉን የውሃ መሠረተ ልማት ለመጠበቅ የይለፍ ቃል ዳግም ማስጀመር የሚከናወነው በተረጋገጠ የውስጥ አሰራር ነው።',
        forgotModalStepsTitle: 'የይለፍ ቃል ለማስጀመር ቅደም ተከተል:',
        forgotModalStep1: 'የክላስተር የአይቲ አስተዳዳሪዎን ወይም የዋናው ቢሮ የአይሲቲ ዳይሬክቶሬትን ያነጋግሩ።',
        forgotModalStep2: 'የቢሮ መታወቂያ ቁጥርዎን (Staff ID) እና የተመደቡበትን የስራ ቦታ ያሳውቁ።',
        forgotModalStep3: 'አዲሱ የይለፍ ቃል በተረጋገጠ አስተማማኝ ውስጣዊ መስመር ይሰጥዎታል።',
        forgotContactDirect: 'የቢሮው አይሲቲ ድጋፍ: support.ict@oweb.gov.et | የውስጥ መስመር: 4410 / 4412',
        closeModal: 'ዝጋና ወደ መግቢያ ተመለስ',
        language: 'ቋንቋ',
        publicPortalLink: 'የህዝብ ግልጽነት ፖርታል'
    }
};

export const Login = ({ onLogin, onOpenExternalPortal }) => {
    const [lang, setLang] = useState('EN');
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);

    const usernameInputRef = useRef(null);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

    useEffect(() => {
        const saved = localStorage.getItem('oweb_remembered_username');
        if (saved) {
            setUsername(saved);
        }
        const savedLang = localStorage.getItem('oweb_preferred_language');
        if (savedLang && TRANSLATIONS[savedLang]) {
            setLang(savedLang);
        }
    }, []);

    const handleLanguageChange = (newLang) => {
        setLang(newLang);
        localStorage.setItem('oweb_preferred_language', newLang);
    };

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
        <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
            {/* Ambient Water Lighting / Gradient Glows */}
            <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-sky-600/15 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] bg-teal-500/15 rounded-full blur-[180px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-700/10 rounded-full blur-[200px] pointer-events-none" />

            {/* Container - Two Column Enterprise Layout */}
            <div className="w-full max-w-6xl bg-slate-900/90 rounded-3xl shadow-2xl border border-slate-800/80 backdrop-blur-xl relative z-10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-fade-in my-auto">
                
                {/* LEFT COLUMN: Institutional Water Sector Branding & Identity */}
                <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 bg-gradient-to-br from-slate-900 via-sky-950/80 to-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between relative overflow-hidden">
                    {/* Subtle Top Wave Pattern overlay */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-radial-gradient from-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10">
                        {/* Bureau Header with Official Emblem */}
                        <div className="flex items-start gap-4 mb-8">
                            <div className="p-3 bg-gradient-to-br from-sky-500 via-cyan-600 to-teal-700 rounded-2xl shadow-xl shadow-sky-500/20 border border-sky-400/30 flex-shrink-0">
                                <Logo className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <div className="inline-block px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-[11px] font-semibold text-sky-300 tracking-wider uppercase mb-1">
                                    {t.bureauSub}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                                    {t.bureauName}
                                </h1>
                                <p className="text-xs sm:text-sm text-sky-200/80 font-medium italic mt-0.5">
                                    "{t.tagline}"
                                </p>
                            </div>
                        </div>

                        {/* Mission Description */}
                        <p className="text-sm text-slate-300 leading-relaxed max-w-xl mb-8">
                            {t.description}
                        </p>

                        {/* Water Sector Pillars */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
                            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-sky-500/40 transition">
                                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2.5">
                                    <Droplets className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                                    {t.pillar1Title}
                                </h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    {t.pillar1Desc}
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/40 transition">
                                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2.5">
                                    <Layers className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                                    {t.pillar2Title}
                                </h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    {t.pillar2Desc}
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-teal-500/40 transition">
                                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2.5">
                                    <Activity className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                                    {t.pillar3Title}
                                </h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    {t.pillar3Desc}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Left Bottom Footer: Transparency Portal & Standards Badges */}
                    <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700">
                                6 Regional Clusters
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700">
                                WHO / CES 58 Standards
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-[11px] font-semibold text-emerald-400 border border-emerald-800/60 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" />
                                RBAC Verified
                            </span>
                        </div>

                        {onOpenExternalPortal && (
                            <button
                                type="button"
                                onClick={onOpenExternalPortal}
                                className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition group"
                            >
                                <Globe className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition" />
                                <span>{t.publicPortalLink}</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Modern Secure Authentication Form */}
                <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 bg-slate-900/95 flex flex-col justify-between">
                    <div>
                        {/* Top Language Selector */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                <span>{t.language}:</span>
                            </span>
                            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                                {['EN', 'OM', 'AM'].map((langCode) => (
                                    <button
                                        key={langCode}
                                        type="button"
                                        onClick={() => handleLanguageChange(langCode)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                            lang === langCode 
                                                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/40' 
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {langCode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Card Heading */}
                        <div className="mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                {t.welcomeTitle}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                {t.welcomeSub}
                            </p>
                        </div>

                        {/* Error Feedback */}
                        {error && (
                            <div className="mb-5 p-3.5 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-shake">
                                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                                <span className="font-semibold leading-relaxed">{error}</span>
                            </div>
                        )}

                        {/* Sign In Form */}
                        <form onSubmit={handleSignInSubmit} className="space-y-4">
                            {/* Username Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    {t.usernameLabel}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        ref={usernameInputRef}
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder={t.usernamePlaceholder}
                                        required
                                        autoComplete="username"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:bg-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                                        {t.passwordLabel}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setPassword('password')}
                                        className="text-[11px] text-slate-400 hover:text-sky-400 transition"
                                    >
                                        {t.defaultCredHint} <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-sky-300 font-bold text-[10px]">password</code>
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyUp={handleKeyDetection}
                                        placeholder={t.passwordPlaceholder}
                                        required
                                        autoComplete="current-password"
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:bg-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {capsLockActive && (
                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
                                        <span>⚠️</span>
                                        <span>{t.capsLockWarning}</span>
                                    </div>
                                )}
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500/30"
                                    />
                                    <span className="text-xs font-medium text-slate-300">{t.rememberMe}</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline transition"
                                >
                                    {t.forgotPassword}
                                </button>
                            </div>

                            {/* Primary Sign In Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-3"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{t.authenticating}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t.signInButton}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Bottom Security Banner */}
                    <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{t.authorizedOnly}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Copyright */}
            <footer className="mt-6 text-center text-xs text-slate-400 relative z-10">
                © {new Date().getFullYear()} Oromia Water Bureau (OWEB). All rights reserved. &bull; Sustainable Water Services for Every Community
            </footer>

            {/* Forgot Password / Account Recovery Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                        <button
                            type="button"
                            onClick={() => setShowForgotModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">
                                    {t.forgotModalTitle}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Oromia Water Bureau ICT Security Protocol
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                            {t.forgotModalDesc}
                        </p>

                        <div className="space-y-2.5 mb-5">
                            <p className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                                {t.forgotModalStepsTitle}
                            </p>
                            <div className="flex items-start gap-2.5 text-xs text-slate-300">
                                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 font-bold text-[11px]">1</span>
                                <span>{t.forgotModalStep1}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs text-slate-300">
                                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 font-bold text-[11px]">2</span>
                                <span>{t.forgotModalStep2}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs text-slate-300">
                                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 font-bold text-[11px]">3</span>
                                <span>{t.forgotModalStep3}</span>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 mb-5 font-mono">
                            {t.forgotContactDirect}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                            >
                                {t.closeModal}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
