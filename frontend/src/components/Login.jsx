import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Logo } from './Logo';
import { initialUsers } from '../services/authService';
import { Role } from '../types';
import {
    ShieldCheck, Lock, User, Eye, EyeOff, Globe, Sparkles,
    CheckCircle2, AlertCircle, ArrowRight, Building2, KeyRound,
    UserCheck, Compass, Award, Wrench, Users, DollarSign,
    ExternalLink
} from 'lucide-react';

const TRANSLATIONS = {
    en: {
        bureauName: 'Oromia Water Resource Bureau',
        bureauSub: 'Biiroo Qabeenya Bishaanii Oromiyaa',
        appTitle: 'OWEB PB-PMS',
        welcomeTitle: 'Sign In to Workspace',
        welcomeSub: 'Regional Water Resource & Infrastructure Governance Ledger',
        welcomeDesc: 'Secure, centralized portal for capital project planning, procurement tenders, contract milestone disbursements, and regional spatial telemetry across Oromia.',
        usernameLabel: 'Username or Official Email',
        usernamePlaceholder: 'Username / Email (e.g. admin or gworku3654@gmail.com)',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter your password',
        signInBtn: 'Sign In',
        signingIn: 'Authenticating...',
        rememberMe: 'Remember me on this device',
        capsLockOn: 'Caps Lock is ON',
        defaultHint: 'Demo password:',
        clickToFill: 'Click to auto-fill password',
        publicPortalBtn: 'Public Transparency Portal',
        quickRolesTitle: '1-Click Persona Login',
        quickRolesDesc: 'Select an authorized staff persona to test tailored workspace views:',
        verifiedStaff: 'Verified Staff Identity',
        securityNotice: 'Authorized Bureau Personnel Only. Unauthorized access is prohibited under Ethiopian Computer Crime Proclamation No. 958/2016.',
        allRoles: 'All Personas',
        engineer: 'Engineers',
        supervisor: 'Supervisors',
        coordinator: 'Coordinators',
        auditor: 'Auditors / Finance',
        admin: 'Admin',
        launch: 'Launch Persona'
    },
    om: {
        bureauName: 'Biiroo Qabeenya Bishaanii Oromiyaa',
        bureauSub: 'Oromia Water Resource Bureau',
        appTitle: 'OWEB PB-PMS',
        welcomeTitle: 'Gara Sirnaatti Seenaa',
        welcomeSub: 'Sirna Bulchiinsa Piroojeektii fi Qabeenya Bishaanii Oromiyaa',
        welcomeDesc: 'Poortaalii ammayyaa karoora piroojeektota bishaanii, caalbaasii bittaawwanii, kaffaltii konculummaa fi hordoffii qabeenya bishaanii Oromiyaa guutuu.',
        usernameLabel: 'Maqaa Fayyadamaa ykn Imeelii',
        usernamePlaceholder: 'Maqaa fayyadamaa / Imeelii (fkn: admin)',
        passwordLabel: 'Jecha Iccitii',
        passwordPlaceholder: 'Jecha iccitii keessan galchaa',
        signInBtn: 'Seeni',
        signingIn: 'Eeyyama mirkaneessaa...',
        rememberMe: 'Kompitarra kanarratti na yaadadhu',
        capsLockOn: 'Qubee Guddaan (Caps Lock) banaadha',
        defaultHint: 'Jecha iccitii barame:',
        clickToFill: 'Jecha iccitii guuti',
        publicPortalBtn: 'Poortaalii Iftoomina Uummataa',
        quickRolesTitle: 'Gahee Hojii Battalaa (1-Click)',
        quickRolesDesc: 'Gahee hojjetaa mirkanaa\'e filachuun daangaa eeyyamaa ilaalaa:',
        verifiedStaff: 'Hojjetaa Mirkanaa\'e',
        securityNotice: 'Hojjettoota Biiroo Qabeenya Bishaanii Oromiyaa qofaf kan eeyyamame. Seera Yakka Kompiitaraa Lakk. 958/2016 tiin dhorkamaadha.',
        allRoles: 'Hunda',
        engineer: 'Injinariitoota',
        supervisor: 'To\'attoota',
        coordinator: 'Qindeessitoota',
        auditor: 'Odiitii / Faayinaansii',
        admin: 'Bulchaa',
        launch: 'Bani'
    },
    am: {
        bureauName: 'የኦሮሚያ የውሃ ሀብት ቢሮ',
        bureauSub: 'Oromia Water Resource Bureau',
        appTitle: 'OWEB PB-PMS',
        welcomeTitle: 'ወደ ስርዓቱ መግቢያ',
        welcomeSub: 'የኦሮሚያ ክልል የውሃ ፕሮጀክት አስተዳደርና የጥራት ቁጥጥር ስርዓት',
        welcomeDesc: 'የውሃ አቅርቦት ፕሮጀክት እቅድ፣ የግዥ ጨረታዎች፣ የኮንትራት ክፍያዎች እና የክልል የመስክ መረጃዎች ማዕከላዊ ስርዓት።',
        usernameLabel: 'የተጠቃሚ ስም ወይም ኢሜይል',
        usernamePlaceholder: 'የተጠቃሚ ስም ወይም ኢሜይል (ለምሳሌ፡ admin)',
        passwordLabel: 'የይለፍ ቃል',
        passwordPlaceholder: 'የይለፍ ቃልዎን ያስገቡ',
        signInBtn: 'ግባ',
        signingIn: 'ማረጋገጫ በመፈተሽ ላይ...',
        rememberMe: 'በዚህ ኮምፒውተር ላይ አስታውሰኝ',
        capsLockOn: 'Caps Lock በርቷል',
        defaultHint: 'መደበኛ ይለፍ ቃል፡',
        clickToFill: 'ይለፍ ቃል አስገባ',
        publicPortalBtn: 'የህዝብ ግልጽነት ፖርታል',
        quickRolesTitle: 'ፈጣን የስራ ድርሻ መግቢያ (1-Click)',
        quickRolesDesc: 'የተፈቀደላቸውን የስራ ድርሻዎች በመምረጥ የፈቃድ ገደቦችን ይፈትሹ፡',
        verifiedStaff: 'የተረጋገጠ ሰራተኛ',
        securityNotice: 'ለተፈቀደላቸው የቢሮው ሰራተኞች ብቻ። ያለፈቃድ መግባት በኮምፒውተር ወንጀል አዋጅ ቁጥር 958/2008 የተከለከለ ነው።',
        allRoles: 'ሁሉም',
        engineer: 'መሐንዲሶች',
        supervisor: 'ተቆጣጣሪዎች',
        coordinator: 'አስተባባሪዎች',
        auditor: 'ኦዲት / ፋይናንስ',
        admin: 'አስተዳዳሪ',
        launch: 'ጀምር'
    }
};

const DEMO_PERSONAS = [
    {
        username: 'admin',
        fullName: 'Girma Worku',
        role: 'System Administrator',
        category: 'admin',
        icon: Award,
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        scope: 'Full Regional Scope (6 Clusters, RBAC & Master Data)',
        avatar: 'https://ui-avatars.com/api/?name=Girma+Worku&background=024b82&color=38bdf8&bold=true'
    },
    {
        username: 'testuser',
        fullName: 'Tolasa Bekele',
        role: 'Field Project Engineer',
        category: 'engineer',
        icon: Wrench,
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        scope: 'Southeastern Oromia Cluster (West Arsi & Arsi Schemes)',
        avatar: 'https://ui-avatars.com/api/?name=Tolasa+Bekele&background=0284c7&color=ffffff&bold=true'
    },
    {
        username: 'engineer_dawit',
        fullName: 'Eng. Dawit Alemu',
        role: 'Resident Site Engineer',
        category: 'engineer',
        icon: Wrench,
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        scope: 'Central Oromia Cluster (East & West Shewa Projects)',
        avatar: 'https://ui-avatars.com/api/?name=Dawit+Alemu&background=0369a1&color=ffffff&bold=true'
    },
    {
        username: 'supervisor',
        fullName: 'Eng. Hawi Kebede',
        role: 'Resident Supervisor',
        category: 'supervisor',
        icon: UserCheck,
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        scope: 'Southern Oromia Cluster (Borena & Guji Lowlands)',
        avatar: 'https://ui-avatars.com/api/?name=Hawi+Kebede&background=0ea5e9&color=ffffff&bold=true'
    },
    {
        username: 'coordinator_kenenisa',
        fullName: 'Kenenisa Bekele',
        role: 'Bureau Project Coordinator',
        category: 'coordinator',
        icon: Compass,
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
        scope: 'Regional Program Coordination (Capital Infrastructure)',
        avatar: 'https://ui-avatars.com/api/?name=Kenenisa+Bekele&background=0891b2&color=ffffff&bold=true'
    },
    {
        username: 'auditor',
        fullName: 'Merga Feyisa',
        role: 'Senior Independent Auditor',
        category: 'auditor',
        icon: ShieldCheck,
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        scope: 'Regional Audit Board (Contract & Tender Variance)',
        avatar: 'https://ui-avatars.com/api/?name=Merga+Feyisa&background=7c3aed&color=ffffff&bold=true'
    },
    {
        username: 'finance_tadesse',
        fullName: 'Fikadu Tadesse',
        role: 'Senior Finance Officer',
        category: 'auditor',
        icon: DollarSign,
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
        scope: 'Treasury & Milestone Disbursements Directorate',
        avatar: 'https://ui-avatars.com/api/?name=Fikadu+Tadesse&background=059669&color=ffffff&bold=true'
    }
];

export const Login = ({ onLogin, onRegisterUser, onOpenExternalPortal, users = [] }) => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [language, setLanguage] = useState('en');
    const [rememberMe, setRememberMe] = useState(true);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const [justCopied, setJustCopied] = useState(false);
    const [personaCategory, setPersonaCategory] = useState('all');

    const usernameInputRef = useRef(null);
    const t = TRANSLATIONS[language] || TRANSLATIONS.en;

    const activeUserPool = useMemo(() => {
        return users && users.length > 0 ? users : initialUsers;
    }, [users]);

    useEffect(() => {
        const saved = localStorage.getItem('oweb_remembered_username');
        if (saved) {
            setUsername(saved);
        }
    }, []);

    // Smart real-time staff identity recognition
    const detectedUser = useMemo(() => {
        if (!username || !username.trim()) return null;
        const normalized = username.trim().toLowerCase();
        return activeUserPool.find(u =>
            u.username.toLowerCase() === normalized ||
            (u.email && u.email.toLowerCase() === normalized)
        ) || null;
    }, [username, activeUserPool]);

    const filteredPersonas = useMemo(() => {
        if (personaCategory === 'all') return DEMO_PERSONAS;
        return DEMO_PERSONAS.filter(p => p.category === personaCategory);
    }, [personaCategory]);

    const handleSelectPersona = async (persona, autoLogin = false) => {
        setUsername(persona.username);
        setPassword('password');
        setError('');
        if (rememberMe) {
            localStorage.setItem('oweb_remembered_username', persona.username);
        }
        if (autoLogin) {
            setIsLoading(true);
            const err = await onLogin(persona.username, 'password');
            setIsLoading(false);
            if (err) setError(err);
        } else {
            if (usernameInputRef.current) {
                usernameInputRef.current.focus();
            }
        }
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

    const handleSSO = (provider) => {
        setError(`${provider} integration is active. Please authenticate using your official bureau credentials above.`);
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-between relative overflow-hidden font-sans">
            {/* Ambient Background Gradient Circles */}
            <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-sky-500/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" />

            {/* TOP FLOATING NAVIGATION BAR */}
            <header className="relative z-20 w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-sky-500 to-emerald-600 rounded-xl shadow-lg shadow-sky-500/20">
                        <Logo className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-white text-base sm:text-lg tracking-tight font-display">
                                {t.appTitle}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono">
                                ENTERPRISE
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                            {t.bureauName} • {t.bureauSub}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Multilingual Switcher */}
                    <div className="inline-flex p-1 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700/80 text-xs font-bold text-slate-300 shadow-sm">
                        {['en', 'om', 'am'].map(lang => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setLanguage(lang)}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                    language === lang
                                        ? 'bg-sky-600 text-white shadow-xs'
                                        : 'hover:text-white'
                                }`}
                            >
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Public Transparency Portal Link */}
                    {onOpenExternalPortal && (
                        <button
                            type="button"
                            onClick={onOpenExternalPortal}
                            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-sky-300 hover:text-white rounded-xl text-xs font-bold transition border border-slate-700 shadow-xs cursor-pointer"
                        >
                            <Globe className="w-3.5 h-3.5 text-sky-400" />
                            <span>{t.publicPortalBtn}</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                        </button>
                    )}
                </div>
            </header>

            {/* MAIN CONTENT WORKSPACE: TWO COLUMNS (Persona Showcase + Direct Sign In Card) */}
            <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex items-center justify-center">
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                    {/* LEFT COLUMN (7 Cols): Regional Overview, Governance Highlights & 1-Click Persona Login */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Heading & Badge */}
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>OROMIA REGIONAL STATE WATER &amp; ENERGY SECTOR</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight font-display">
                                Sovereign Water &amp; Infrastructure <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">Capital Ledger</span>
                            </h1>

                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                                {t.welcomeDesc}
                            </p>
                        </div>

                        {/* Regional Trust Pillars */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-2xl backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase">
                                    <Building2 className="w-4 h-4" />
                                    <span>6 Clusters</span>
                                </div>
                                <p className="text-slate-300 text-xs mt-1">
                                    Central, Western, Southern, Southeastern, Eastern, and Southwestern Oromia.
                                </p>
                            </div>

                            <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-2xl backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>WHO &amp; CES 58</span>
                                </div>
                                <p className="text-slate-300 text-xs mt-1">
                                    Standard drinking water quality verification and physical progress auditing.
                                </p>
                            </div>

                            <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-2xl backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase">
                                    <KeyRound className="w-4 h-4" />
                                    <span>RBAC Privileges</span>
                                </div>
                                <p className="text-slate-300 text-xs mt-1">
                                    Granular permission matrices across engineers, supervisors, and directors.
                                </p>
                            </div>
                        </div>

                        {/* 1-CLICK PERSONA LOGIN SELECTOR */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-md shadow-2xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <div>
                                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2 font-display">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        <span>{t.quickRolesTitle}</span>
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        {t.quickRolesDesc}
                                    </p>
                                </div>

                                {/* Category Filter Chips */}
                                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                                    {[
                                        { id: 'all', label: t.allRoles },
                                        { id: 'admin', label: t.admin },
                                        { id: 'engineer', label: t.engineer },
                                        { id: 'supervisor', label: t.supervisor },
                                        { id: 'coordinator', label: t.coordinator },
                                        { id: 'auditor', label: t.auditor },
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setPersonaCategory(cat.id)}
                                            className={`px-2 py-0.5 rounded-lg font-bold text-[10.5px] transition whitespace-nowrap cursor-pointer ${
                                                personaCategory === cat.id
                                                    ? 'bg-sky-600 text-white shadow-xs'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Persona Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                                {filteredPersonas.map((persona) => {
                                    const IconComp = persona.icon;
                                    return (
                                        <div
                                            key={persona.username}
                                            onClick={() => handleSelectPersona(persona, true)}
                                            className="group p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-sky-500/80 hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-xs"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <img
                                                    src={persona.avatar}
                                                    alt={persona.fullName}
                                                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700 flex-shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-white group-hover:text-sky-300 truncate">
                                                            {persona.fullName}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 truncate">
                                                        {persona.role}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="px-2 py-1 bg-slate-800 group-hover:bg-sky-600 text-slate-300 group-hover:text-white rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 flex-shrink-0"
                                            >
                                                <span>{t.launch}</span>
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (5 Cols): Clean, Secure Sign In Card */}
                    <div className="lg:col-span-5 flex justify-center">
                        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 relative">

                            {/* Card Header */}
                            <div className="mb-5 pb-3 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">
                                        {t.welcomeTitle}
                                    </h2>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        SECURE ACCESS
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {t.welcomeSub}
                                </p>
                            </div>

                            {/* Error Alert */}
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
                                            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
                                        />
                                        {detectedUser && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                <span>Verified</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Smart Staff Card Recognition */}
                                    {detectedUser && (
                                        <div className="mt-2 p-2 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-fade-in">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <img
                                                    src={detectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(detectedUser.fullName)}&background=4EA685&color=fff&bold=true`}
                                                    alt={detectedUser.fullName}
                                                    className="w-6 h-6 rounded-lg object-cover ring-1 ring-emerald-300"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 truncate">
                                                        {detectedUser.fullName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 truncate">
                                                        {detectedUser.role} • {detectedUser.assignedZone || 'Regional HQ'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[9.5px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                                                Active Staff
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Password Input */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            {t.passwordLabel}
                                        </label>
                                        <span
                                            onClick={() => {
                                                setPassword('password');
                                                setJustCopied(true);
                                                setTimeout(() => setJustCopied(false), 2000);
                                            }}
                                            className="text-[11px] text-slate-400 hover:text-sky-600 cursor-pointer transition flex items-center gap-1"
                                            title={t.clickToFill}
                                        >
                                            <span>{t.defaultHint}</span>
                                            <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold text-[10px]">
                                                {justCopied ? 'Applied!' : 'password'}
                                            </code>
                                        </span>
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
                                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
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
                                            <span>{t.capsLockOn}</span>
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
                                        <span className="text-xs font-medium">{t.rememberMe}</span>
                                    </label>
                                </div>

                                {/* Primary Sign In Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{t.signingIn}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t.signInBtn}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Enterprise SSO Options */}
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2.5">
                                    Enterprise Single Sign-On (SSO)
                                </span>
                                <div className="grid grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSSO('GovID')}
                                        className="py-2 px-1 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-700 text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                                        title="Federal GovID"
                                    >
                                        <span className="text-base">🇪🇹</span>
                                        <span className="text-[9.5px]">GovID</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSSO('OWEB LDAP')}
                                        className="py-2 px-1 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-700 text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                                        title="OWEB Central LDAP"
                                    >
                                        <KeyRound className="w-4 h-4 text-sky-600" />
                                        <span className="text-[9.5px]">LDAP</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSSO('Microsoft 365')}
                                        className="py-2 px-1 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-700 text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                                        title="Microsoft 365 / Azure AD"
                                    >
                                        <span className="text-base">🪟</span>
                                        <span className="text-[9.5px]">Azure</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSSO('Google Workspace')}
                                        className="py-2 px-1 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-700 text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                                        title="Google Workspace"
                                    >
                                        <span className="text-base">G</span>
                                        <span className="text-[9.5px]">Google</span>
                                    </button>
                                </div>
                            </div>

                            {/* Security Notice Footer */}
                            <p className="mt-5 text-[10.5px] text-slate-400 text-center leading-relaxed">
                                {t.securityNotice}
                            </p>
                        </div>
                    </div>

                </div>
            </main>

            {/* PAGE FOOTER */}
            <footer className="relative z-10 w-full px-4 sm:px-8 py-3 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500">
                <span>© {new Date().getFullYear()} Oromia Water Resource Bureau (OWEB). All rights reserved. Sovereign Infrastructure Management System.</span>
            </footer>
        </div>
    );
};

export default Login;
