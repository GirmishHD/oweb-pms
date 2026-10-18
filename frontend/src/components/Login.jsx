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
        heroHeadline: 'Sustainable Water Services for Every Community.',
        heroSubheadline: 'Digital coordination ledger for capital water infrastructure, urban sanitation, and climate resilience across all 6 administrative clusters.',
        heroBadge: 'Sovereign Water & Infrastructure Capital Ledger',
        clusterStat: '6 Clusters',
        clusterStatDesc: 'Central, Western, Southern, Southeastern, Eastern, and Southwestern Oromia.',
        standardsStat: 'WHO & CES 58',
        standardsStatDesc: 'Standard drinking water quality verification and physical progress auditing.',
        rbacStat: 'RBAC Privileges',
        rbacStatDesc: 'Granular permission matrices across engineers, supervisors, and directors.',
        cardTitle: 'Sign In',
        cardSubtitle: 'Enter your credentials to access the bureau management system',
        usernameLabel: 'Username or Bureau Email',
        usernamePlaceholder: 'Username or email (e.g. admin)',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter your password',
        defaultCredHint: 'Default:',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        signInButton: 'Sign In',
        authenticating: 'Authenticating...',
        capsLockWarning: 'Caps Lock is ON',
        authorizedNotice: 'Authorized Bureau Personnel Only',
        quickPersonaButton: '1-Click Persona Access',
        personaTitle: 'Authorized Staff Personas (Select to test view)',
        publicPortalLink: 'Public Transparency Portal',
        forgotModalTitle: 'Account Recovery & Access Assistance',
        forgotModalDesc: 'In accordance with Oromia Water Bureau security policies, public self-service password resets are restricted to protect critical regional infrastructure systems.',
        forgotModalStepsTitle: 'Standard Bureau Recovery Protocol:',
        forgotModalStep1: 'Contact your Zonal or Cluster IT Administrator or Head Office ICT Directorate.',
        forgotModalStep2: 'Provide your official Bureau Staff ID / Employee Number and assigned duty station.',
        forgotModalStep3: 'Your account credentials will be securely reset and provided via verified internal channels.',
        forgotContactDirect: 'OWEB ICT Support Desk: support.ict@oweb.gov.et | Internal Ext: 4410 / 4412',
        closeModal: 'Close & Return to Sign In'
    },
    OM: {
        bureauName: 'BIIROO QABEENYA BISHAANII OROMIYAA',
        bureauSub: 'Mootummaa Naannoo Oromiyaa',
        heroHeadline: 'Tajaajila Bishaanii Itti-Fufiinsa Qabu Hawaasa Hundaaf.',
        heroSubheadline: 'Ijaarsa bu\'uuraalee misooma bishaanii, eegumsa qulqullinaa, fi dandeettii dandamannaa hongee daminoolee 6 keessatti.',
        heroBadge: 'Pilaatfoormii Bu\'uuraalee Misooma Bishaanii Oromiyaa',
        clusterStat: 'Kilaastara 6',
        clusterStatDesc: 'Giddu-galeessa, Lixaa, Kibbaa, Kibba-Bahaa, Bahaa, fi Kibba-Lixaa Oromiyaa.',
        standardsStat: 'Ulaagaa WHO & CES 58',
        standardsStatDesc: 'Qulqullina bishaan dhugaatii fi raawwii hojii bu\'uuraalee misoomaa mirkaneessuu.',
        rbacStat: 'Heyyama RBAC',
        rbacStatDesc: 'Mirga seensaa ogeeyyii bishaanii, to\'attootaa, fi daayirektarootaa.',
        cardTitle: 'Seenaa',
        cardSubtitle: 'Pilaatfoormii hojii fi piroojektiiwwan bishaanii ilaaluuf galmaa\'aa',
        usernameLabel: 'Maqaa Fayyadamaa ykn Imeelii Biiroo',
        usernamePlaceholder: 'Maqaa fayyadamaa (fkn. admin)',
        passwordLabel: 'Jecha Icchitii',
        passwordPlaceholder: 'Jecha icchiitii keessan galchaa',
        defaultCredHint: 'Idilee:',
        rememberMe: 'Na yaadadhu',
        forgotPassword: 'Jecha icchiitii dagattanii?',
        signInButton: 'Gara Pilaatfoormiitti Seenaa',
        authenticating: 'Mirkaneessaa jira...',
        capsLockWarning: 'Caps Lock banee jira',
        authorizedNotice: 'Hojjetoota Heyyama Qabaniif Qofa',
        quickPersonaButton: 'Gahee Hojjetaa Filadhaa',
        personaTitle: 'Seensa Qaxxaamuraa (Qorannoo Hojiif)',
        publicPortalLink: 'Pootaalii Iftoomina Uummataa',
        forgotModalTitle: 'Gargaarsa Deebisanii Banuu Herregaa',
        forgotModalDesc: 'Akka qajeelfama nageenya odeeffannoo Biiroo Bishaanii Oromiyaatti, sirna eegumsa bu\'uuraaleetiif jecha icchiitii deebisuun qaamaan mirkanaa\'a.',
        forgotModalStepsTitle: 'Tartiiba Deebisanii Argachuu:',
        forgotModalStep1: 'Qindeessaa IT Dambii/Kilaastaraa ykn Daayirektooreetii Saayinsii fi Teknooloojii Biiroo qunnamaa.',
        forgotModalStep2: 'Waraqaa eenyummaa hojjetaa (Staff ID) fi bakka ramaddii keessan dhiyeessaa.',
        forgotModalStep3: 'Odeeffannoon seensaa haaraan karaa nageenyi isaa mirkanaa\'een isiniif kennama.',
        forgotContactDirect: 'Gargaarsa ICT Biiroo: support.ict@oweb.gov.et | Sarara Keessaa: 4410 / 4412',
        closeModal: 'Cufiitii Seensaatti Deebi\'i'
    },
    AM: {
        bureauName: 'የኦሮሚያ የውሃ ቢሮ',
        bureauSub: 'የኦሮሚያ ብሔራዊ ክልላዊ መንግሥት',
        heroHeadline: 'ዘላቂ የውሃ አገልግሎት ለመላው ማህበረሰብ።',
        heroSubheadline: 'በሁሉም 6 ክላስተሮች ውስጥ የውሃ መሠረተ ልማት፣ የከተሞች ሳኒቴሽን እና የአየር ንብረት ድርቅ መቋቋሚያ ዲጂታል መድረክ።',
        heroBadge: 'የኦሮሚያ የውሃ እና መሠረተ ልማት ካፒታል መዝገብ',
        clusterStat: '6 ክላስተሮች',
        clusterStatDesc: 'ማዕከላዊ፣ ምዕራብ፣ ደቡብ፣ ደቡብ-ምሥራቅ፣ ምሥራቅ እና ደቡብ-ምዕራብ ኦሮሚያ።',
        standardsStat: 'WHO እና CES 58',
        standardsStatDesc: 'የመጠጥ ውሃ ጥራት ደረጃ ማረጋገጫ እና አካላዊ የስራ ክንውን ቁጥጥር።',
        rbacStat: 'የRBAC ፈቃድ ስርዓት',
        rbacStatDesc: 'የኢንጅነሮች፣ ሱፐርቫይዘሮች እና ዳይሬክተሮች ግልጽ የስራ ድርሻ ክፍፍል።',
        cardTitle: 'ይግቡ',
        cardSubtitle: 'ወደ ኦሮሚያ የውሃ ቢሮ ዲጂታል መድረክ ለመግባት መለያዎን ያስገቡ',
        usernameLabel: 'የተጠቃሚ ስም ወይም የቢሮ ኢሜይል',
        usernamePlaceholder: 'የተጠቃሚ ስም (ለምሳሌ admin)',
        passwordLabel: 'የይለፍ ቃል',
        passwordPlaceholder: 'የይለፍ ቃልዎን ያስገቡ',
        defaultCredHint: 'ነባሪ:',
        rememberMe: 'አስታውሰኝ',
        forgotPassword: 'የይለፍ ቃል ረሱ?',
        signInButton: 'ወደ መድረክ ግባ',
        authenticating: 'በማረጋገጥ ላይ...',
        capsLockWarning: 'Caps Lock በርቷል',
        authorizedNotice: 'ለተፈቀደላቸው ሰራተኞች ብቻ የተዘጋጀ',
        quickPersonaButton: 'ፈጣን የሙከራ ሚናዎች',
        personaTitle: 'የተፈቀዱ የሙከራ ሚናዎች',
        publicPortalLink: 'የህዝብ ግልጽነት ፖርታል',
        forgotModalTitle: 'የመለያ መልሶ ማግኛ እና ድጋፍ',
        forgotModalDesc: 'በኦሮሚያ የውሃ ቢሮ የደህንነት መመሪያ መሠረት፣ የክልሉን የውሃ መሠረተ ልማት ለመጠበቅ የይለፍ ቃል ዳግም ማስጀመር የሚከናወነው በተረጋገጠ የውስጥ አሰራር ነው።',
        forgotModalStepsTitle: 'የይለፍ ቃል ለማስጀመር ቅደም ተከተል:',
        forgotModalStep1: 'የክላስተር የአይቲ አስተዳዳሪዎን ወይም የዋናው ቢሮ የአይሲቲ ዳይሬክቶሬትን ያነጋግሩ።',
        forgotModalStep2: 'የቢሮ መታወቂያ ቁጥርዎን (Staff ID) እና የተመደቡበትን የስራ ቦታ ያሳውቁ።',
        forgotModalStep3: 'አዲሱ የይለፍ ቃል በተረጋገጠ አስተማማኝ ውስጣዊ መስመር ይሰጥዎታል።',
        forgotContactDirect: 'የቢሮው አይሲቲ ድጋፍ: support.ict@oweb.gov.et | የውስጥ መስመር: 4410 / 4412',
        closeModal: 'ዝጋና ወደ መግቢያ ተመለስ'
    }
};

const SAMPLE_PERSONAS = [
    { username: 'admin', role: 'System Administrator', name: 'Girma Worku', tag: 'Admin' },
    { username: 'director_chaltu', role: 'Water Supply Director', name: 'Dr. Chaltu Desta', tag: 'Director' },
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
        <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 lg:p-12 font-sans overflow-x-hidden bg-[#071927]">
            {/* ============================================================ */}
            {/* RICH COLORLIB BACKGROUND: Vibrant Water & Hydro Abstract Glow*/}
            {/* ============================================================ */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Deep Aquatic Gradient Wash */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#02111d] via-[#052b49] to-[#0a4875] opacity-95" />
                
                {/* Colorlib Frosted Glass Ambient Hydro Circles */}
                <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-sky-400/20 rounded-full blur-[140px]" />
                <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] bg-cyan-400/15 rounded-full blur-[160px]" />
                <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-teal-500/15 rounded-full blur-[180px]" />

                {/* Hydro Ripple Vector Accents */}
                <svg className="absolute -bottom-24 -left-24 w-[500px] h-[500px] text-sky-400/5" viewBox="0 0 200 200" fill="currentColor">
                    <path d="M41.7,-71.4C54.1,-65.2,64.2,-54.6,71.8,-42.1C79.4,-29.6,84.5,-14.8,83.9,-0.3C83.4,14.1,77.2,28.3,69.1,41.2C61,54.1,51,65.8,38.4,72.4C25.8,79,10.6,80.5,-4.4,78.2C-19.4,75.9,-34.2,69.8,-47.3,61.1C-60.4,52.3,-71.8,40.9,-78.9,27.1C-85.9,13.3,-88.6,-2.9,-84.9,-17.8C-81.2,-32.7,-71.2,-46.3,-58.4,-53.2C-45.6,-60.1,-30,-60.3,-15.8,-62.9C-1.6,-65.5,12.7,-70.5,41.7,-71.4Z" transform="translate(100 100)" />
                </svg>
            </div>

            {/* Top Global Bar: Language Switcher & Public Transparency Link */}
            <header className="absolute top-0 left-0 right-0 z-20 px-6 sm:px-12 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
                        <Logo className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white font-bold tracking-tight text-sm hidden sm:inline font-display">
                        {t.bureauName}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Language Switcher Pill */}
                    <div className="flex items-center gap-1 bg-black/25 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-sm">
                        {['EN', 'OM', 'AM'].map((langCode) => (
                            <button
                                key={langCode}
                                type="button"
                                onClick={() => handleLanguageChange(langCode)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    lang === langCode 
                                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' 
                                        : 'text-white/70 hover:text-white'
                                }`}
                            >
                                {langCode}
                            </button>
                        ))}
                    </div>

                    {/* Public Transparency Portal Shortcut */}
                    {onOpenExternalPortal && (
                        <button
                            type="button"
                            onClick={onOpenExternalPortal}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs font-semibold text-white transition shadow-sm"
                        >
                            <Globe className="w-3.5 h-3.5 text-sky-300" />
                            <span className="hidden md:inline">{t.publicPortalLink}</span>
                        </button>
                    )}
                </div>
            </header>

            {/* ============================================================ */}
            {/* COLORLIB LOGIN-PAGE-04 CONTAINER                             */}
            {/* Split Hero Description + Frosted Glass Login Card            */}
            {/* ============================================================ */}
            <main className="w-full max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto pt-16 pb-8">
                
                {/* ------------------------------------------------------------ */}
                {/* LEFT HERO: Bureau Branding & Mission (Colorlib Left Panel)   */}
                {/* ------------------------------------------------------------ */}
                <div className="lg:col-span-7 text-white space-y-6 px-2 sm:px-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 backdrop-blur-md border border-sky-400/30 text-xs font-semibold text-sky-200">
                        <Droplets className="w-3.5 h-3.5 text-sky-300" />
                        <span>{t.heroBadge}</span>
                    </div>

                    <div className="space-y-3">
                        <span className="text-xs font-bold tracking-widest uppercase text-sky-300/80 block">
                            {t.bureauSub}
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-display leading-[1.15]">
                            {t.heroHeadline}
                        </h1>
                        <p className="text-sm sm:text-base text-sky-100/80 leading-relaxed font-light max-w-xl">
                            {t.heroSubheadline}
                        </p>
                    </div>

                    {/* 3 Colorlib Informational Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
                        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition">
                            <span className="text-sm font-bold text-white block mb-1">
                                {t.clusterStat}
                            </span>
                            <span className="text-xs text-sky-200/70 leading-relaxed block font-light">
                                {t.clusterStatDesc}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition">
                            <span className="text-sm font-bold text-white block mb-1">
                                {t.standardsStat}
                            </span>
                            <span className="text-xs text-sky-200/70 leading-relaxed block font-light">
                                {t.standardsStatDesc}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition">
                            <span className="text-sm font-bold text-white block mb-1">
                                {t.rbacStat}
                            </span>
                            <span className="text-xs text-sky-200/70 leading-relaxed block font-light">
                                {t.rbacStatDesc}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ------------------------------------------------------------ */}
                {/* RIGHT CARD: Colorlib Login-Page-04 Frosted Glass Sign-In     */}
                {/* ------------------------------------------------------------ */}
                <div className="lg:col-span-5">
                    <div className="w-full bg-white/95 sm:bg-white/90 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.35)] border border-white/40 relative">
                        
                        {/* Header of Form */}
                        <div className="flex items-start justify-between gap-3 mb-6">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
                                    {t.cardTitle}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {t.cardSubtitle}
                                </p>
                            </div>
                            <div className="p-2.5 bg-gradient-to-br from-sky-500 to-teal-600 rounded-2xl shadow-md shadow-sky-500/25 flex-shrink-0">
                                <Logo className="h-6 w-6 text-white" />
                            </div>
                        </div>

                        {/* Error Feedback */}
                        {error && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-shake">
                                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                <span className="font-semibold leading-relaxed">{error}</span>
                            </div>
                        )}

                        {/* Form: Colorlib Floating Style Fields */}
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
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50/80 hover:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
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
                                        className="text-[11px] text-slate-400 hover:text-sky-600 transition"
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
                                        className="w-full pl-10 pr-10 py-3 bg-slate-50/80 hover:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
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
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="text-xs font-medium text-slate-700">{t.rememberMe}</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline transition"
                                >
                                    {t.forgotPassword}
                                </button>
                            </div>

                            {/* Submit Button (Colorlib Bold Vibrant Action) */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
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

                        {/* 1-Click Persona Selector Drawer */}
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-between"
                            >
                                <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                    <span>{t.quickPersonaButton}</span>
                                </span>
                                <span className="text-[10px] text-slate-500">{showPersonaMenu ? '▲ Hide' : '▼ Show'}</span>
                            </button>

                            {showPersonaMenu && (
                                <div className="mt-3 p-2 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-1.5 animate-fade-in">
                                    {SAMPLE_PERSONAS.map((p) => (
                                        <button
                                            key={p.username}
                                            type="button"
                                            onClick={() => selectPersona(p.username)}
                                            className="text-left p-2 rounded-xl bg-white hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 transition text-xs"
                                        >
                                            <div className="font-bold text-slate-800 truncate text-[11px]">
                                                {p.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate">
                                                {p.role}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Security Notice */}
                        <div className="mt-4 pt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{t.authorizedNotice}</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="absolute bottom-3 left-0 right-0 text-center text-xs text-sky-200/50 z-10 px-4">
                © {new Date().getFullYear()} Oromia Water Bureau (OWEB). All rights reserved. &bull; Sustainable Water Services for Every Community
            </footer>

            {/* Forgot Password / Security Recovery Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
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
                            <p className="text-xs font-bold text-sky-800 uppercase tracking-wider">
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
