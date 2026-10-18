import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { 
    Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, 
    Droplets, Activity, Layers, CheckCircle2, Globe, HelpCircle, 
    X, KeyRound, Check, Sparkles, Building2, MapPin
} from 'lucide-react';

const TRANSLATIONS = {
    EN: {
        bureauName: 'OROMIA WATER BUREAU',
        bureauSub: 'National Regional State of Oromia',
        heroTitle: 'Welcome to Oromia Water Bureau',
        heroSubtitle: 'Sustainable Water Services for Every Community across 6 Clusters.',
        tagline: 'Sustainable Water Services for Every Community',
        missionQuote: '“Empowering communities through reliable, climate-resilient water infrastructure, institutional governance, and transparent partnership delivery.”',
        welcomeBack: 'Welcome Back',
        signInPrompt: 'Sign in to access your bureau dashboard and project portfolio.',
        usernameLabel: 'Username or Bureau Email',
        usernamePlaceholder: 'Username (e.g. admin)',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Password',
        defaultCredHint: 'Default password:',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        signInButton: 'Sign In',
        authenticating: 'Authenticating...',
        capsLockWarning: 'Caps Lock is ON',
        authorizedNotice: 'Authorized Bureau Personnel Only',
        switchPersonaLabel: 'Select Authorized Staff Persona',
        personaTitle: 'Quick Persona Access (Development / Testing)',
        forgotModalTitle: 'Account Recovery & Access Assistance',
        forgotModalDesc: 'In accordance with Oromia Water Bureau cybersecurity protocols, public self-service password resets are restricted to protect critical regional infrastructure systems.',
        forgotModalStepsTitle: 'Bureau Verification & Recovery Procedure:',
        forgotModalStep1: 'Contact your Zonal/Cluster IT Administrator or Head Office ICT Directorate.',
        forgotModalStep2: 'Provide your official Bureau Staff ID / Employee Number and duty station.',
        forgotModalStep3: 'Your credentials will be securely reset and provided via verified internal channels.',
        forgotContactDirect: 'OWEB ICT Support Desk: support.ict@oweb.gov.et | Internal Ext: 4410 / 4412',
        closeModal: 'Close & Return to Sign In',
        language: 'Language',
        publicPortalLink: 'Public Transparency Portal',
        clustersPill: '6 Administrative Clusters',
        standardsPill: 'WHO & CES 58 Verified',
        rbacPill: 'Multi-Role RBAC Active'
    },
    OM: {
        bureauName: 'BIIROO QABEENYA BISHAANII OROMIYAA',
        bureauSub: 'Mootummaa Naannoo Oromiyaa',
        heroTitle: 'Baga Nagaan Gara Biiroo Bishaanii Dhuftan',
        heroSubtitle: 'Tajaajila bishaanii itti-fufiinsa qabu hawaasa hundumaaf kilaastaroota 6 keessatti.',
        tagline: 'Tajaajila Bishaanii Itti-Fufiinsa Qabu Hawaasa Hundaaf',
        missionQuote: '“Ijaarsa bu\'uuraalee misooma bishaanii dandamanna qabuu fi dhiyeessii bishaan dhugaatii qulqulluu mirkaneessuu.”',
        welcomeBack: 'Baga Nagaan Dhuftan',
        signInPrompt: 'Pilaatfoormii hojii fi piroojektiiwwan bishaanii ilaaluuf seenaa.',
        usernameLabel: 'Maqaa Fayyadamaa ykn Imeelii Biiroo',
        usernamePlaceholder: 'Maqaa fayyadamaa (fkn. admin)',
        passwordLabel: 'Jecha Icchitii',
        passwordPlaceholder: 'Jecha icchiitii',
        defaultCredHint: 'Jecha icchiitii idilee:',
        rememberMe: 'Na yaadadhu',
        forgotPassword: 'Jecha icchiitii dagattanii?',
        signInButton: 'Gara Pilaatfoormiitti Seenaa',
        authenticating: 'Mirkaneessaa jira...',
        capsLockWarning: 'Caps Lock banee jira',
        authorizedNotice: 'Hojjetoota Heyyama Qabaniif Qofa',
        switchPersonaLabel: 'Gahee Hojjetaa Filadhaa',
        personaTitle: 'Seensa Qaxxaamuraa (Qorannoo Hojiif)',
        forgotModalTitle: 'Gargaarsa Deebisanii Banuu Herregaa',
        forgotModalDesc: 'Akka qajeelfama nageenya odeeffannoo Biiroo Bishaanii Oromiyaatti, sirna eegumsa bu\'uuraaleetiif jecha icchiitii deebisuun qaamaan mirkanaa\'a.',
        forgotModalStepsTitle: 'Tartiiba Deebisanii Argachuu:',
        forgotModalStep1: 'Qindeessaa IT Dambii/Kilaastaraa ykn Daayirektooreetii Saayinsii fi Teknooloojii Biiroo qunnamaa.',
        forgotModalStep2: 'Waraqaa eenyummaa hojjetaa (Staff ID) fi bakka ramaddii keessan dhiyeessaa.',
        forgotModalStep3: 'Odeeffannoon seensaa haaraan karaa nageenyi isaa mirkanaa\'een isiniif kennama.',
        forgotContactDirect: 'Gargaarsa ICT Biiroo: support.ict@oweb.gov.et | Sarara Keessaa: 4410 / 4412',
        closeModal: 'Cufiitii Seensaatti Deebi\'i',
        language: 'Afaan',
        publicPortalLink: 'Pootaalii Iftoomina Uummataa',
        clustersPill: 'Daminoolee Kilaastaraa 6',
        standardsPill: 'Ulaagaa WHO & CES 58',
        rbacPill: 'Eegumsa Heyyama RBAC'
    },
    AM: {
        bureauName: 'የኦሮሚያ የውሃ ቢሮ',
        bureauSub: 'የኦሮሚያ ብሔራዊ ክልላዊ መንግሥት',
        heroTitle: 'ወደ ኦሮሚያ የውሃ ቢሮ እንኳን ደህና መጡ',
        heroSubtitle: 'በሁሉም 6 ክላስተሮች ውስጥ ዘላቂና አስተማማኝ ንጹህ የመጠጥ ውሃ አገልግሎት።',
        tagline: 'ዘላቂ የውሃ አገልግሎት ለመላው ማህበረሰብ',
        missionQuote: '“ዘላቂ የውሃ መሠረተ ልማትን በመገንባት፣ የህብረተሰቡን ተጠቃሚነት ማረጋገጥ እና የተቋማዊ ግልጽነትን ማስፈን።”',
        welcomeBack: 'እንኳን ደህና መጡ',
        signInPrompt: 'የቢሮውን ዳሽቦርድ እና የውሃ ፕሮጀክቶችን ለማግኘት መለያዎን ያስገቡ።',
        usernameLabel: 'የተጠቃሚ ስም ወይም የቢሮ ኢሜይል',
        usernamePlaceholder: 'የተጠቃሚ ስም (ለምሳሌ admin)',
        passwordLabel: 'የይለፍ ቃል',
        passwordPlaceholder: 'የይለፍ ቃል',
        defaultCredHint: 'ነባሪ የይለፍ ቃል:',
        rememberMe: 'አስታውሰኝ',
        forgotPassword: 'የይለፍ ቃል ረሱ?',
        signInButton: 'ወደ መድረክ ግባ',
        authenticating: 'በማረጋገጥ ላይ...',
        capsLockWarning: 'Caps Lock በርቷል',
        authorizedNotice: 'ለተፈቀደላቸው ሰራተኞች ብቻ የተዘጋጀ',
        switchPersonaLabel: 'የተፈቀደ የሰራተኛ ሚና ይምረጡ',
        personaTitle: 'ፈጣን የሙከራ ሚናዎች (Persona Access)',
        forgotModalTitle: 'የመለያ መልሶ ማግኛ እና ድጋፍ',
        forgotModalDesc: 'በኦሮሚያ የውሃ ቢሮ የደህንነት መመሪያ መሠረት፣ የክልሉን የውሃ መሠረተ ልማት ለመጠበቅ የይለፍ ቃል ዳግም ማስጀመር የሚከናወነው በተረጋገጠ የውስጥ አሰራር ነው።',
        forgotModalStepsTitle: 'የይለፍ ቃል ለማስጀመር ቅደም ተከተል:',
        forgotModalStep1: 'የክላስተር የአይቲ አስተዳዳሪዎን ወይም የዋናው ቢሮ የአይሲቲ ዳይሬክቶሬትን ያነጋግሩ።',
        forgotModalStep2: 'የቢሮ መታወቂያ ቁጥርዎን (Staff ID) እና የተመደቡበትን የስራ ቦታ ያሳውቁ።',
        forgotModalStep3: 'አዲሱ የይለፍ ቃል በተረጋገጠ አስተማማኝ ውስጣዊ መስመር ይሰጥዎታል።',
        forgotContactDirect: 'የቢሮው አይሲቲ ድጋፍ: support.ict@oweb.gov.et | የውስጥ መስመር: 4410 / 4412',
        closeModal: 'ዝጋና ወደ መግቢያ ተመለስ',
        language: 'ቋንቋ',
        publicPortalLink: 'የህዝብ ግልጽነት ፖርታል',
        clustersPill: '6 የክልል ክላስተሮች',
        standardsPill: 'የWHO እና CES 58 መስፈርት',
        rbacPill: 'የተጠበቀ የRBAC ፈቃድ'
    }
};

const SAMPLE_PERSONAS = [
    { username: 'admin', role: 'System Administrator', name: 'Girma Worku', tag: 'Admin' },
    { username: 'director_chaltu', role: 'Water Supply Director', name: 'Dr. Chaltu Desta', tag: 'Directorate' },
    { username: 'coordinator_kenenisa', role: 'Project Coordinator (PIU)', name: 'Kenenisa Bekele', tag: 'Coordinator' },
    { username: 'engineer_dawit', role: 'Resident Site Engineer', name: 'Eng. Dawit Alemu', tag: 'Engineer' },
    { username: 'supervisor', role: 'Resident Supervisor', name: 'Eng. Hawi Kebede', tag: 'Supervisor' },
    { username: 'finance_tadesse', role: 'Senior Finance Officer', name: 'Fikadu Tadesse', tag: 'Finance' },
];

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
    const [showPersonaMenu, setShowPersonaMenu] = useState(false);

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

    const selectPersona = (pUsername) => {
        setUsername(pUsername);
        setPassword('password');
        setShowPersonaMenu(false);
    };

    return (
        <div className="min-h-screen w-full bg-[#e8f1f5] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans relative overflow-x-hidden">
            {/* Subtle atmospheric hydro waves in background */}
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#0b3c68]/10 via-[#0b3c68]/5 to-transparent pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Login-Page-04 Card Wrapper */}
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(11,60,104,0.18)] border border-slate-100 overflow-hidden relative z-10 grid grid-cols-1 lg:grid-cols-12 animate-fade-in my-auto">
                
                {/* ============================================================ */}
                {/* LEFT HERO PANEL: Colorlib Login-Page-04 Hero Showcase        */}
                {/* ============================================================ */}
                <div className="lg:col-span-6 bg-gradient-to-br from-[#072d52] via-[#0b3c68] to-[#041a33] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
                    {/* Architectural Hydro-Wave Background Visual */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-300 via-transparent to-transparent" />
                    <svg className="absolute -bottom-20 -right-20 w-96 h-96 text-sky-400/10 pointer-events-none" viewBox="0 0 200 200" fill="currentColor">
                        <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C86.9,14.6,81.2,29.1,72.6,41.9C64.1,54.6,52.7,65.5,39.3,72.4C25.9,79.3,10.5,82.1,-4.2,79.7C-18.9,77.3,-32.8,69.7,-45.7,60.8C-58.5,51.8,-70.2,41.5,-77.8,28.2C-85.4,14.8,-88.9,-1.5,-85.4,-16.8C-81.8,-32.1,-71.2,-46.3,-58.1,-54C-45,-61.7,-29.4,-62.8,-15.1,-65.4C-0.8,-68.1,13.5,-72.3,44.7,-76.4Z" transform="translate(100 100)" />
                    </svg>

                    {/* Top Hero Brand Header */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3.5 mb-8">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner flex-shrink-0">
                                <Logo className="h-9 w-9 text-sky-300" />
                            </div>
                            <div>
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-200 text-[10px] font-bold tracking-widest uppercase border border-sky-300/20">
                                    {t.bureauSub}
                                </span>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display mt-0.5">
                                    {t.bureauName}
                                </h1>
                            </div>
                        </div>

                        {/* Hero Typography & Mission Statement */}
                        <div className="space-y-4 my-8">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight font-display">
                                {t.heroTitle}
                            </h2>
                            <p className="text-sm text-sky-100/90 leading-relaxed font-light">
                                {t.heroSubtitle}
                            </p>
                            <p className="text-xs text-sky-200/80 italic border-l-2 border-sky-400/60 pl-3 leading-relaxed mt-2">
                                {t.missionQuote}
                            </p>
                        </div>
                    </div>

                    {/* Hero Feature Indicators & Badges */}
                    <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm text-[11px] font-semibold text-sky-100 border border-white/10">
                                {t.clustersPill}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm text-[11px] font-semibold text-sky-100 border border-white/10">
                                {t.standardsPill}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-sm text-[11px] font-semibold text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>{t.rbacPill}</span>
                            </span>
                        </div>

                        {onOpenExternalPortal && (
                            <button
                                type="button"
                                onClick={onOpenExternalPortal}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-white transition group py-1"
                            >
                                <Globe className="w-3.5 h-3.5 text-sky-300 group-hover:rotate-12 transition" />
                                <span>{t.publicPortalLink}</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ============================================================ */}
                {/* RIGHT FORM PANEL: Colorlib Login-Page-04 Sign-In Form        */}
                {/* ============================================================ */}
                <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-white">
                    <div>
                        {/* Top Utility Bar: Language Selector & Persona Shortcut */}
                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                            {/* Language Pills (Colorlib Switcher Style) */}
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                {['EN', 'OM', 'AM'].map((langCode) => (
                                    <button
                                        key={langCode}
                                        type="button"
                                        onClick={() => handleLanguageChange(langCode)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                            lang === langCode 
                                                ? 'bg-[#0b3c68] text-white shadow-sm' 
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {langCode}
                                    </button>
                                ))}
                            </div>

                            {/* Persona Quick Menu Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                                className="text-xs font-semibold text-[#0b3c68] hover:text-sky-600 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-sky-50 transition"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                <span>{t.switchPersonaLabel}</span>
                            </button>
                        </div>

                        {/* Persona Dropdown Panel if toggled */}
                        {showPersonaMenu && (
                            <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        {t.personaTitle}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowPersonaMenu(false)}
                                        className="text-slate-400 hover:text-slate-600 text-xs"
                                    >
                                        &times;
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {SAMPLE_PERSONAS.map((p) => (
                                        <button
                                            key={p.username}
                                            type="button"
                                            onClick={() => selectPersona(p.username)}
                                            className="text-left p-2 rounded-xl bg-white hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 transition text-xs group"
                                        >
                                            <div className="font-bold text-slate-800 group-hover:text-[#0b3c68] truncate">
                                                {p.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate">
                                                {p.role}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sign In Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
                                {t.welcomeBack}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                {t.signInPrompt}
                            </p>
                        </div>

                        {/* Error Feedback */}
                        {error && (
                            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-shake">
                                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                <span className="font-semibold leading-relaxed">{error}</span>
                            </div>
                        )}

                        {/* Form: Colorlib Clean Float Inputs */}
                        <form onSubmit={handleSignInSubmit} className="space-y-4">
                            {/* Username or Email Input */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    {t.usernameLabel}
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
                                        placeholder={t.usernamePlaceholder}
                                        required
                                        autoComplete="username"
                                        className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0b3c68] focus:ring-2 focus:ring-[#0b3c68]/15 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        {t.passwordLabel}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setPassword('password')}
                                        className="text-[11px] text-slate-400 hover:text-[#0b3c68] transition"
                                    >
                                        {t.defaultCredHint} <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold text-[10px]">password</code>
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
                                        placeholder={t.passwordPlaceholder}
                                        required
                                        autoComplete="current-password"
                                        className="w-full pl-10 pr-10 py-3 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0b3c68] focus:ring-2 focus:ring-[#0b3c68]/15 outline-none transition"
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
                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                                        <span>⚠️</span>
                                        <span>{t.capsLockWarning}</span>
                                    </div>
                                )}
                            </div>

                            {/* Remember Me & Forgot Password Row */}
                            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded border-slate-300 text-[#0b3c68] focus:ring-[#0b3c68]/20"
                                    />
                                    <span className="text-xs font-medium text-slate-700">{t.rememberMe}</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-xs font-semibold text-[#0b3c68] hover:text-sky-600 hover:underline transition"
                                >
                                    {t.forgotPassword}
                                </button>
                            </div>

                            {/* Submit Button (Colorlib Bold Gradient) */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0b3c68] via-[#0d508c] to-[#0284c7] hover:from-[#093054] hover:to-[#0369a1] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#0b3c68]/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
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

                    {/* Bottom Security / Government Seal */}
                    <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{t.authorizedNotice}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Copyright */}
            <footer className="mt-6 text-center text-xs text-slate-500 relative z-10">
                © {new Date().getFullYear()} Oromia Water Bureau (OWEB). All rights reserved. &bull; Sustainable Water Services for Every Community
            </footer>

            {/* Forgot Password / Access Protocol Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
                        <button
                            type="button"
                            onClick={() => setShowForgotModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {t.forgotModalTitle}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Oromia Water Bureau ICT Security Protocol
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            {t.forgotModalDesc}
                        </p>

                        <div className="space-y-2.5 mb-5">
                            <p className="text-xs font-bold text-[#0b3c68] uppercase tracking-wider">
                                {t.forgotModalStepsTitle}
                            </p>
                            <div className="flex items-start gap-2.5 text-xs text-slate-700">
                                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold text-[11px]">1</span>
                                <span>{t.forgotModalStep1}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs text-slate-700">
                                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold text-[11px]">2</span>
                                <span>{t.forgotModalStep2}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs text-slate-700">
                                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold text-[11px]">3</span>
                                <span>{t.forgotModalStep3}</span>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 mb-5 font-mono">
                            {t.forgotContactDirect}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
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
