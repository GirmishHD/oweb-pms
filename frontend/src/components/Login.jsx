import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { 
    Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, 
    Droplets, Activity, Layers, CheckCircle2, Globe, HelpCircle, 
    X, KeyRound, Check, Sparkles, Building2, MapPin, Clock, Server, 
    Radio, ChevronDown, ChevronUp, Copy, CheckCheck, RefreshCw, Zap
} from 'lucide-react';

const TRANSLATIONS = {
    EN: {
        bureauName: 'OROMIA WATER BUREAU',
        bureauSub: 'National Regional State of Oromia',
        heroHeadline: 'Sustainable Water Services for Every Community.',
        heroSubheadline: 'Centralized digital coordination ledger for capital water infrastructure, urban sanitation, and climate resilience across all 6 administrative clusters.',
        heroBadge: 'Sovereign Water & Infrastructure Capital Ledger',
        systemStatus: 'Cluster SCADA Telemetry: Operational',
        clustersOnline: '6 Clusters Online',
        uptimeStat: '99.8% Telemetry Uptime',
        clusterStat: '6 Clusters',
        clusterStatDesc: 'Central, Western, Southern, Southeastern, Eastern, and Southwestern Oromia.',
        standardsStat: 'WHO & CES 58',
        standardsStatDesc: 'Drinking water quality verification and physical progress auditing.',
        schemesStat: '1,420+ Schemes',
        schemesStatDesc: 'Piped water networks, deep wells, sand dams, and treatment plants.',
        rbacStat: 'RBAC Security',
        rbacStatDesc: 'Granular permission matrices across engineers, supervisors, and directors.',
        cardTitle: 'Sign In',
        cardSubtitle: 'Enter your bureau credentials to access the management platform',
        usernameLabel: 'Username or Bureau Email',
        usernamePlaceholder: 'Username or email (e.g. admin)',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter your password',
        defaultCredHint: 'Default:',
        rememberMe: 'Remember me on this workstation',
        forgotPassword: 'Forgot credentials?',
        signInButton: 'Sign In to Platform',
        authenticating: 'Authenticating & Verifying Session...',
        capsLockWarning: 'Caps Lock is ON',
        authorizedNotice: 'Authorized Bureau Personnel Only • Monitored Regional GovNet',
        quickPersonaButton: 'Quick Role Tester (Select Persona)',
        personaTitle: 'Authorized Staff Personas (Select to test view)',
        publicPortalLink: 'Public Transparency Portal',
        pwdStrengthWeak: 'Weak',
        pwdStrengthFair: 'Fair',
        pwdStrengthGood: 'Good',
        pwdStrengthStrong: 'Strong',
        securityBadge: 'TLS 1.3 256-bit Encrypted • Oromia GovNet & Woredanet Connected • ISO 27001 Aligned',
        forgotModalTitle: 'Regional Access & Credential Assistance',
        forgotModalDesc: 'In accordance with Oromia Water Bureau security policies, self-service password resets are restricted to protect critical regional water infrastructure systems.',
        forgotModalStepsTitle: 'Standard Bureau Recovery Protocol:',
        forgotModalStep1: 'Contact your Cluster IT Administrator or Head Office ICT Directorate.',
        forgotModalStep2: 'Provide your official Bureau Staff ID / Employee Number and assigned duty station.',
        forgotModalStep3: 'Your account credentials will be securely reset and provided via verified internal channels.',
        clusterHelpdesks: 'Cluster ICT Focal Desks:',
        forgotContactDirect: 'OWEB Head Office ICT Support Desk: support.ict@oweb.gov.et | Internal Ext: 4410 / 4412',
        closeModal: 'Close & Return to Sign In',
        personaApplied: 'Persona applied:',
        launchNow: '1-Click Launch'
    },
    OM: {
        bureauName: 'BIIROO QABEENYA BISHAANII OROMIYAA',
        bureauSub: 'Mootummaa Naannoo Oromiyaa',
        heroHeadline: 'Tajaajila Bishaanii Itti-Fufiinsa Qabu Hawaasa Hundaaf.',
        heroSubheadline: 'Ijaarsa bu\'uuraalee misooma bishaanii, eegumsa qulqullinaa, fi dandeettii dandamannaa hongee daminoolee 6 keessatti.',
        heroBadge: 'Pilaatfoormii Bu\'uuraalee Misooma Bishaanii Oromiyaa',
        systemStatus: 'Sirni Telemeetirii Kilaastaraa: Hojirra Jira',
        clustersOnline: 'Kilaastaroota 6 Hojirra',
        uptimeStat: '99.8% Qophii Sirnaa',
        clusterStat: 'Kilaastara 6',
        clusterStatDesc: 'Giddu-galeessa, Lixaa, Kibbaa, Kibba-Bahaa, Bahaa, fi Kibba-Lixaa Oromiyaa.',
        standardsStat: 'Ulaagaa WHO & CES 58',
        standardsStatDesc: 'Qulqullina bishaan dhugaatii fi raawwii hojii bu\'uuraalee misoomaa mirkaneessuu.',
        schemesStat: 'Piroojektii 1,420+',
        schemesStatDesc: 'Ujummoolee bishaanii, boolla gadi fagoo, kuusaawwan, fi warshaalee qulqulleessituu.',
        rbacStat: 'Nageenya RBAC',
        rbacStatDesc: 'Mirga seensaa ogeeyyii bishaanii, to\'attootaa, fi daayirektarootaa.',
        cardTitle: 'Seenaa',
        cardSubtitle: 'Pilaatfoormii hojii fi piroojektiiwwan bishaanii ilaaluuf galmaa\'aa',
        usernameLabel: 'Maqaa Fayyadamaa ykn Imeelii Biiroo',
        usernamePlaceholder: 'Maqaa fayyadamaa (fkn. admin)',
        passwordLabel: 'Jecha Icchitii',
        passwordPlaceholder: 'Jecha icchiitii keessan galchaa',
        defaultCredHint: 'Idilee:',
        rememberMe: 'Warphedhaa kanarratti na yaadadhu',
        forgotPassword: 'Jecha icchiitii dagattanii?',
        signInButton: 'Gara Pilaatfoormiitti Seenaa',
        authenticating: 'Eenyummeessaa jira...',
        capsLockWarning: 'Caps Lock banee jira',
        authorizedNotice: 'Hojjetoota Heyyama Qabaniif Qofa • Sarara Mootummaa Eegame',
        quickPersonaButton: 'Gahee Hojjetaa Filadhaa (Qorannoo Hojiif)',
        personaTitle: 'Seensa Qaxxaamuraa (Qorannoo Hojiif)',
        publicPortalLink: 'Pootaalii Iftoomina Uummataa',
        pwdStrengthWeak: 'Laafaa',
        pwdStrengthFair: 'Giddu-galeessa',
        pwdStrengthGood: 'Gaarii',
        pwdStrengthStrong: 'Cimaa',
        securityBadge: 'Iccheessa TLS 1.3 256-bit • GovNet fi Woredanet Waliin Kan Qabate',
        forgotModalTitle: 'Gargaarsa Deebisanii Banuu Herregaa',
        forgotModalDesc: 'Akka qajeelfama nageenya odeeffannoo Biiroo Bishaanii Oromiyaatti, sirna eegumsa bu\'uuraaleetiif jecha icchiitii deebisuun qaamaan mirkanaa\'a.',
        forgotModalStepsTitle: 'Tartiiba Deebisanii Argachuu:',
        forgotModalStep1: 'Qindeessaa IT Dambii/Kilaastaraa ykn Daayirektooreetii Saayinsii fi Teknooloojii Biiroo qunnamaa.',
        forgotModalStep2: 'Waraqaa eenyummaa hojjetaa (Staff ID) fi bakka ramaddii keessan dhiyeessaa.',
        forgotModalStep3: 'Odeeffannoon seensaa haaraan karaa nageenyi isaa mirkanaa\'een isiniif kennama.',
        clusterHelpdesks: 'Deskiilee Qindeessitoota IT Kilaastaraa:',
        forgotContactDirect: 'Gargaarsa ICT Biiroo: support.ict@oweb.gov.et | Sarara Keessaa: 4410 / 4412',
        closeModal: 'Cufiitii Seensaatti Deebi\'i',
        personaApplied: 'Gaheen filatameera:',
        launchNow: 'Amma Seeni'
    },
    AM: {
        bureauName: 'የኦሮሚያ የውሃ ቢሮ',
        bureauSub: 'የኦሮሚያ ብሔራዊ ክልላዊ መንግሥት',
        heroHeadline: 'ዘላቂ የውሃ አገልግሎት ለመላው ማህበረሰብ።',
        heroSubheadline: 'በሁሉም 6 ክላስተሮች ውስጥ የውሃ መሠረተ ልማት፣ የከተሞች ሳኒቴሽን እና የአየር ንብረት ድርቅ መቋቋሚያ ዲጂታል መድረክ።',
        heroBadge: 'የኦሮሚያ የውሃ እና መሠረተ ልማት ካፒታል መዝገብ',
        systemStatus: 'የክላስተር SCADA ቴሌሜትሪ: በስራ ላይ',
        clustersOnline: '6 ክላስተሮች በመስመር ላይ',
        uptimeStat: '99.8% የስርዓት ዝግጁነት',
        clusterStat: '6 ክላስተሮች',
        clusterStatDesc: 'ማዕከላዊ፣ ምዕራብ፣ ደቡብ፣ ደቡብ-ምሥራቅ፣ ምሥራቅ እና ደቡብ-ምዕራብ ኦሮሚያ።',
        standardsStat: 'WHO እና CES 58',
        standardsStatDesc: 'የመጠጥ ውሃ ጥራት ደረጃ ማረጋገጫ እና አካላዊ የስራ ክንውን ቁጥጥር።',
        schemesStat: '1,420+ ፕሮጀክቶች',
        schemesStatDesc: 'የውሃ ቱቦዎች፣ ጥልቅ የውሃ ጉድጓዶች፣ ግድቦች እና የማጣሪያ ማዕከላት።',
        rbacStat: 'የRBAC ደህንነት',
        rbacStatDesc: 'የኢንጅነሮች፣ ሱፐርቫይዘሮች እና ዳይሬክተሮች ግልጽ የስራ ድርሻ ክፍፍል።',
        cardTitle: 'ይግቡ',
        cardSubtitle: 'ወደ ኦሮሚያ የውሃ ቢሮ ዲጂታል መድረክ ለመግባት መለያዎን ያስገቡ',
        usernameLabel: 'የተጠቃሚ ስም ወይም የቢሮ ኢሜይል',
        usernamePlaceholder: 'የተጠቃሚ ስም (ለምሳሌ admin)',
        passwordLabel: 'የይለፍ ቃል',
        passwordPlaceholder: 'የይለፍ ቃልዎን ያስገቡ',
        defaultCredHint: 'ነባሪ:',
        rememberMe: 'በዚህ ኮምፒውተር ላይ አስታውሰኝ',
        forgotPassword: 'የይለፍ ቃል ረሱ?',
        signInButton: 'ወደ መድረክ ግባ',
        authenticating: 'በማረጋገጥ ላይ...',
        capsLockWarning: 'Caps Lock በርቷል',
        authorizedNotice: 'ለተፈቀደላቸው ሰራተኞች ብቻ የተዘጋጀ • የተጠበቀ የመንግስት መረብ',
        quickPersonaButton: 'ፈጣን የሙከራ ሚናዎች (Persona መራጭ)',
        personaTitle: 'የተፈቀዱ የሙከራ ሚናዎች',
        publicPortalLink: 'የህዝብ ግልጽነት ፖርታል',
        pwdStrengthWeak: 'ደካማ',
        pwdStrengthFair: 'መካከለኛ',
        pwdStrengthGood: 'ጥሩ',
        pwdStrengthStrong: 'ጠንካራ',
        securityBadge: 'በTLS 1.3 256-bit የተመሰጠረ • በኦሮሚያ GovNet እና Woredanet የተገናኘ',
        forgotModalTitle: 'የመለያ መልሶ ማግኛ እና ድጋፍ',
        forgotModalDesc: 'በኦሮሚያ የውሃ ቢሮ የደህንነት መመሪያ መሠረት፣ የክልሉን የውሃ መሠረተ ልማት ለመጠበቅ የይለፍ ቃል ዳግም ማስጀመር የሚከናወነው በተረጋገጠ የውስጥ አሰራር ነው።',
        forgotModalStepsTitle: 'የይለፍ ቃል ለማስጀመር ቅደም ተከተል:',
        forgotModalStep1: 'የክላስተር የአይቲ አስተዳዳሪዎን ወይም የዋናው ቢሮ የአይሲቲ ዳይሬክቶሬትን ያነጋግሩ።',
        forgotModalStep2: 'የቢሮ መታወቂያ ቁጥርዎን (Staff ID) እና የተመደቡበትን የስራ ቦታ ያሳውቁ።',
        forgotModalStep3: 'አዲሱ የይለፍ ቃል በተረጋገጠ አስተማማኝ ውስጣዊ መስመር ይሰጥዎታል።',
        clusterHelpdesks: 'የክላስተር አይቲ አስተባባሪዎች ስልክና አድራሻ:',
        forgotContactDirect: 'የቢሮው አይሲቲ ድጋፍ: support.ict@oweb.gov.et | የውስጥ መስመር: 4410 / 4412',
        closeModal: 'ዝጋና ወደ መግቢያ ተመለስ',
        personaApplied: 'የተመረጠው ሚና:',
        launchNow: 'አሁን ግባ'
    }
};

const CLUSTER_HELPDESKS = [
    { name: 'Central Cluster (Giddu Galeessa)', phone: '+251 11 369 8241', email: 'central.cluster.ict@oweb.gov.et' },
    { name: 'Western Cluster (Lixa Oromiyaa)', phone: '+251 57 775 1920', email: 'western.cluster.ict@oweb.gov.et' },
    { name: 'Eastern Cluster (Baha Oromiyaa)', phone: '+251 25 666 4310', email: 'eastern.cluster.ict@oweb.gov.et' },
    { name: 'Southeastern Cluster (Kibba Baha)', phone: '+251 22 331 5280', email: 'se.cluster.ict@oweb.gov.et' },
    { name: 'Southern Cluster (Kibba Oromiyaa)', phone: '+251 46 443 2190', email: 'southern.cluster.ict@oweb.gov.et' },
    { name: 'Southwestern Cluster (Kibba Lixa)', phone: '+251 47 111 8840', email: 'sw.cluster.ict@oweb.gov.et' }
];

export const Login = ({ onLogin, onOpenExternalPortal }) => {
    const [lang, setLang] = useState('EN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [copiedHelpdesk, setCopiedHelpdesk] = useState(null);

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

        // Live EAT Digital Clock (UTC+3)
        const updateClock = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-GB', { 
                timeZone: 'Africa/Addis_Ababa', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false
            });
            setCurrentTime(`${timeStr} EAT`);
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleLanguageChange = (newLang) => {
        setLang(newLang);
        localStorage.setItem('oweb_preferred_language', newLang);
    };

    const handleSignInSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');

        const cleanUsername = username.trim();
        const cleanPassword = password.trim();

        if (!cleanUsername) {
            setError(lang === 'OM' ? 'Maaloo maqaa fayyadamaa keessan galchaa.' : lang === 'AM' ? 'እባክዎ የተጠቃሚ ስምዎን ያስገቡ።' : 'Please enter your username or bureau email.');
            return;
        }

        if (!cleanPassword) {
            setError(lang === 'OM' ? 'Maaloo jecha icchiitii keessan galchaa.' : lang === 'AM' ? 'እባክዎ የይለፍ ቃልዎን ያስገቡ።' : 'Please enter your password.');
            return;
        }

        setIsLoading(true);

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

    const copyToClipboard = (text, id) => {
        navigator.clipboard?.writeText(text);
        setCopiedHelpdesk(id);
        setTimeout(() => setCopiedHelpdesk(null), 2000);
    };

    // Smart Password Strength Meter
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { score: 0, label: '', width: '0%', color: 'bg-slate-200' };
        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        
        if (score <= 1) return { score: 1, label: t.pwdStrengthWeak, width: '25%', color: 'bg-amber-500' };
        if (score === 2) return { score: 2, label: t.pwdStrengthFair, width: '50%', color: 'bg-sky-500' };
        if (score === 3) return { score: 3, label: t.pwdStrengthGood, width: '75%', color: 'bg-teal-500' };
        return { score: 4, label: t.pwdStrengthStrong, width: '100%', color: 'bg-emerald-500' };
    };

    const pwdStrength = getPasswordStrength(password);

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 lg:p-12 font-sans overflow-x-hidden bg-[#071927]">
            {/* ============================================================ */}
            {/* REALISTIC WATER SOFTWARE BACKGROUND: Layered Aquatic Surface */}
            {/* ============================================================ */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
                {/* 1. Deep Ocean & Hydro Reservoir Base Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#021324] via-[#042845] to-[#011422]" />

                {/* 2. Water Sunlight Caustics & Optical Refraction */}
                <div 
                    className="absolute inset-0 opacity-25 mix-blend-screen animate-water-caustics pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(ellipse 60% 50% at 50% 20%, rgba(56, 189, 248, 0.45), transparent 70%),
                                          radial-gradient(ellipse 70% 60% at 85% 65%, rgba(6, 182, 212, 0.35), transparent 70%),
                                          radial-gradient(ellipse 50% 40% at 15% 75%, rgba(20, 184, 166, 0.3), transparent 60%)`
                    }}
                />

                {/* 3. Deep Reservoir Hydro Radial Illumination */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-sky-500/15 rounded-full blur-[140px]" />
                <div className="absolute -bottom-24 right-10 w-[600px] h-[600px] bg-teal-500/15 rounded-full blur-[160px]" />
                <div className="absolute top-2/3 left-10 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[150px]" />

                {/* 4. Smart Rising Water Bubbles (Hydro Physics Animation) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute left-[7%] w-5 h-5 rounded-full border border-sky-300/60 bg-gradient-to-tr from-cyan-400/20 via-sky-300/30 to-white/60 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.7),0_0_10px_rgba(56,189,248,0.35)] backdrop-blur-[1px] animate-bubble-1" />
                    <div className="absolute left-[21%] w-3.5 h-3.5 rounded-full border border-teal-300/60 bg-gradient-to-tr from-teal-400/20 via-cyan-300/30 to-white/60 shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.7),0_0_8px_rgba(20,184,166,0.35)] animate-bubble-2" />
                    <div className="absolute left-[36%] w-6 h-6 rounded-full border border-sky-200/70 bg-gradient-to-tr from-sky-400/20 via-cyan-200/30 to-white/70 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7),0_0_14px_rgba(56,189,248,0.45)] backdrop-blur-[1px] animate-bubble-3" />
                    <div className="absolute left-[52%] w-4 h-4 rounded-full border border-cyan-300/60 bg-gradient-to-tr from-cyan-400/20 to-white/60 shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.7)] animate-bubble-4" />
                    <div className="absolute left-[68%] w-5 h-5 rounded-full border border-sky-300/60 bg-gradient-to-tr from-sky-400/20 via-teal-300/30 to-white/60 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.7),0_0_10px_rgba(56,189,248,0.35)] animate-bubble-5" />
                    <div className="absolute left-[84%] w-3.5 h-3.5 rounded-full border border-cyan-200/70 bg-gradient-to-tr from-teal-400/20 to-white/60 shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.7)] animate-bubble-1" />
                    <div className="absolute left-[92%] w-6 h-6 rounded-full border border-sky-300/60 bg-gradient-to-tr from-sky-400/20 to-white/60 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7)] animate-bubble-2" />
                </div>

                {/* 5. Layered Animated Water Waves */}
                <div className="absolute inset-x-0 bottom-0 h-96 overflow-hidden pointer-events-none">
                    <svg className="absolute bottom-0 w-[200%] h-64 text-sky-900/35 animate-water-wave-slow fill-current" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path d="M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,165.3C672,160,768,192,864,208C960,224,1056,224,1152,197.3C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    <svg className="absolute bottom-0 w-[200%] h-56 text-sky-600/25 animate-water-wave fill-current" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path d="M0,64L48,80C96,96,192,128,288,149.3C384,171,480,181,576,165.3C672,149,768,107,864,112C960,117,1056,171,1152,181.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    <svg className="absolute bottom-0 w-[200%] h-48 text-cyan-400/20 animate-water-wave-slow fill-current" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path d="M0,224L48,208C96,192,192,160,288,160C384,160,480,192,576,208C672,224,768,224,864,202.7C960,181,1056,139,1152,138.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
            </div>

            {/* ============================================================ */}
            {/* TOP GLOBAL OPERATIONAL TELEMETRY BAR                         */}
            {/* ============================================================ */}
            <header className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-8 lg:px-12 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/40 backdrop-blur-md">
                {/* Brand & SCADA Telemetry Heartbeat */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-sky-400/30 shadow-md flex-shrink-0">
                        <Logo className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="text-white font-extrabold tracking-wide text-sm font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] block">
                            {t.bureauName}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-cyan-200/80">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="font-semibold">{t.systemStatus}</span>
                            <span className="text-white/30">•</span>
                            <span className="text-emerald-300 font-bold">{t.clustersOnline}</span>
                        </div>
                    </div>
                </div>

                {/* Right Operational Telemetry: Digital Clock, Language & Portal */}
                <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                    {/* Live EAT Clock */}
                    {currentTime && (
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-sky-500/20 text-xs font-mono font-bold text-sky-200">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{currentTime}</span>
                        </div>
                    )}

                    {/* Language Switcher Pill */}
                    <div className="flex items-center gap-1 bg-slate-950/70 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-lg">
                        {['EN', 'OM', 'AM'].map((langCode) => (
                            <button
                                key={langCode}
                                type="button"
                                onClick={() => handleLanguageChange(langCode)}
                                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                    lang === langCode 
                                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/40 ring-1 ring-white/30' 
                                        : 'text-slate-300 hover:text-white'
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
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 backdrop-blur-md border border-sky-400/40 text-xs font-bold text-white transition shadow-md hover:border-sky-300"
                        >
                            <Globe className="w-3.5 h-3.5 text-cyan-300" />
                            <span className="hidden sm:inline">{t.publicPortalLink}</span>
                        </button>
                    )}
                </div>
            </header>

            {/* ============================================================ */}
            {/* COLORLIB SPLIT CONTAINER: Hero (Left) + Smart Card (Right)   */}
            {/* ============================================================ */}
            <main className="w-full max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto pt-20 pb-10">
                
                {/* ------------------------------------------------------------ */}
                {/* LEFT HERO: Bureau Identity & Regional Water Pillars          */}
                {/* ------------------------------------------------------------ */}
                <div className="lg:col-span-7 text-white space-y-6 px-2 sm:px-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/65 backdrop-blur-md border border-cyan-400/40 text-xs font-extrabold text-cyan-200 shadow-lg shadow-black/30">
                        <Droplets className="w-4 h-4 text-cyan-300 animate-pulse-subtle" />
                        <span>{t.heroBadge}</span>
                    </div>

                    <div className="space-y-3">
                        <span className="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-cyan-300 block drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                            {t.bureauSub}
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-display leading-[1.15] drop-shadow-[0_3px_12px_rgba(0,0,0,0.7)]">
                            {t.heroHeadline}
                        </h1>
                        <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal max-w-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                            {t.heroSubheadline}
                        </p>
                    </div>

                    {/* 4 Smart Regional Water Infrastructure Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                        <div className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-900/80 backdrop-blur-md border border-sky-400/30 transition shadow-lg shadow-black/25">
                            <span className="text-sm font-extrabold text-white block mb-1 drop-shadow-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-cyan-300" />
                                {t.clusterStat}
                            </span>
                            <span className="text-xs text-slate-200 leading-relaxed block font-medium">
                                {t.clusterStatDesc}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-900/80 backdrop-blur-md border border-sky-400/30 transition shadow-lg shadow-black/25">
                            <span className="text-sm font-extrabold text-white block mb-1 drop-shadow-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                                {t.standardsStat}
                            </span>
                            <span className="text-xs text-slate-200 leading-relaxed block font-medium">
                                {t.standardsStatDesc}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-900/80 backdrop-blur-md border border-sky-400/30 transition shadow-lg shadow-black/25">
                            <span className="text-sm font-extrabold text-white block mb-1 drop-shadow-sm flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-sky-300" />
                                {t.schemesStat}
                            </span>
                            <span className="text-xs text-slate-200 leading-relaxed block font-medium">
                                {t.schemesStatDesc}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-900/80 backdrop-blur-md border border-sky-400/30 transition shadow-lg shadow-black/25">
                            <span className="text-sm font-extrabold text-white block mb-1 drop-shadow-sm flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                {t.rbacStat}
                            </span>
                            <span className="text-xs text-slate-200 leading-relaxed block font-medium">
                                {t.rbacStatDesc}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ------------------------------------------------------------ */}
                {/* RIGHT CARD: Enterprise Government Sign-In Card               */}
                {/* ------------------------------------------------------------ */}
                <div className="lg:col-span-5">
                    <div className="w-full bg-white/95 sm:bg-white/92 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-white/60 relative">
                        
                        {/* Header of Form */}
                        <div className="flex items-start justify-between gap-3 mb-6">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-display">
                                    {t.cardTitle}
                                </h2>
                                <p className="text-xs text-slate-600 font-semibold mt-1">
                                    {t.cardSubtitle}
                                </p>
                            </div>
                            {/* Water Ripple Logo Container */}
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 rounded-2xl border-2 border-sky-400/50 animate-ripple-ring pointer-events-none" />
                                <div className="p-2.5 bg-gradient-to-br from-sky-500 to-teal-600 rounded-2xl shadow-lg shadow-sky-500/30 flex-shrink-0 relative z-10">
                                    <Logo className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Persona Applied Flash Badge */}
                        {appliedPersonaName && (
                            <div className="mb-4 p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center justify-between animate-fade-in">
                                <span className="font-bold flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-sky-600" />
                                    <span>{t.personaApplied} <strong className="text-sky-700">{appliedPersonaName}</strong></span>
                                </span>
                                <button 
                                    type="button" 
                                    onClick={() => handleSignInSubmit()} 
                                    className="px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-[10px] transition"
                                >
                                    {t.launchNow}
                                </button>
                            </div>
                        )}

                        {/* Error Feedback */}
                        {error && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-shake">
                                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                <span className="font-bold leading-relaxed">{error}</span>
                            </div>
                        )}

                        {/* Smart Form */}
                        <form onSubmit={handleSignInSubmit} className="space-y-4">
                            {/* Username or Email Input */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
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
                                        className="w-full pl-10 pr-9 py-3 bg-slate-50 hover:bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-500/20 outline-none transition shadow-sm"
                                    />
                                    {username && (
                                        <button
                                            type="button"
                                            onClick={() => setUsername('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                            title="Clear input"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Password Input with Smart Strength Meter */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                                        {t.passwordLabel}
                                    </label>
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
                                        className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-500/20 outline-none transition shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Dynamic Password Strength Indicator */}
                                {password && (
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-300 ${pwdStrength.color}`} 
                                                style={{ width: pwdStrength.width }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600">{pwdStrength.label}</span>
                                    </div>
                                )}

                                {capsLockActive && (
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 font-bold">
                                        <span>⚠️</span>
                                        <span>{t.capsLockWarning}</span>
                                    </div>
                                )}
                            </div>

                            {/* Remember Me & Forgot Password Row */}
                            <div className="flex items-center justify-between text-xs text-slate-700 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                                    />
                                    <span className="text-xs font-bold text-slate-800">{t.rememberMe}</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-xs font-extrabold text-sky-700 hover:text-sky-900 hover:underline transition"
                                >
                                    {t.forgotPassword}
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-xl text-sm font-extrabold tracking-wide shadow-xl shadow-sky-600/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
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

                        {/* Security Notice */}
                        <div className="mt-4 pt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold text-center">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{t.authorizedNotice}</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Enterprise Compliance Footnote */}
            <footer className="absolute bottom-3 left-0 right-0 text-center text-xs text-sky-100/70 font-semibold z-10 px-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                © {new Date().getFullYear()} Oromia Water Bureau (OWEB). All rights reserved. &bull; {t.securityBadge}
            </footer>

            {/* Forgot Password / Security Recovery Modal with Cluster IT Helpdesks */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setShowForgotModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
                                <KeyRound className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900">
                                    {t.forgotModalTitle}
                                </h3>
                                <p className="text-xs text-slate-500 font-semibold">
                                    Oromia Water Bureau ICT Security Protocol & Cluster Desks
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                            {t.forgotModalDesc}
                        </p>

                        <div className="space-y-2.5 mb-5">
                            <p className="text-xs font-black text-sky-800 uppercase tracking-wider">
                                {t.forgotModalStepsTitle}
                            </p>
                            <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold text-[11px]">1</span>
                                <span>{t.forgotModalStep1}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold text-[11px]">2</span>
                                <span>{t.forgotModalStep2}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold text-[11px]">3</span>
                                <span>{t.forgotModalStep3}</span>
                            </div>
                        </div>

                        {/* Cluster Focal Contact Directory */}
                        <div className="mb-5">
                            <p className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                                {t.clusterHelpdesks}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {CLUSTER_HELPDESKS.map((c, idx) => (
                                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                        <div className="font-bold text-slate-900 text-[11px]">{c.name}</div>
                                        <div className="text-[10px] text-slate-600 mt-1 flex items-center justify-between">
                                            <span>{c.phone}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(c.phone, `phone-${idx}`)}
                                                className="text-sky-600 hover:text-sky-800"
                                                title="Copy phone"
                                            >
                                                {copiedHelpdesk === `phone-${idx}` ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between mt-0.5 truncate">
                                            <span className="truncate">{c.email}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(c.email, `email-${idx}`)}
                                                className="text-sky-600 hover:text-sky-800 ml-1 flex-shrink-0"
                                                title="Copy email"
                                            >
                                                {copiedHelpdesk === `email-${idx}` ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-[11px] text-sky-900 mb-5 font-mono">
                            {t.forgotContactDirect}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md"
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
