import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Logo } from './Logo';
import { initialUsers } from '../services/authService';
import { Role, UserStatus } from '../types';
const TRANSLATIONS = {
    en: {
        bureauName: 'Oromia Water Resource Bureau',
        bureauSub: 'Biiroo Qabeenya Bishaanii Oromiyaa',
        appTitle: 'OWEB PB-PMS',
        welcomeTitle: 'Welcome Back',
        welcomeSub: 'Regional Water Resource & Sovereign Capital Governance Ledger',
        welcomeDesc: 'Access real-time project schedules, contract disbursements, and georeferenced water quality inspection logs across 21 administrative zones in Oromia.',
        joinTitle: 'Join with us',
        joinSub: 'Multi-Tiered Access & Privilege Scoping',
        joinDesc: 'Select an authorized staff persona to experience tailored perspectives for Field Engineers, Resident Supervisors, PIU Coordinators, Auditors, and Administrators.',
        signInHeader: 'Sign In',
        signInSub: 'Enter your bureau username or official email to enter workspace',
        signUpHeader: 'Staff Portal',
        signUpSub: 'Explore authorized staff personas or register new field personnel',
        usernameLabel: 'Username / Email',
        usernamePlaceholder: 'Username or Email (e.g. admin or gworku3654@gmail.com)',
        emailPlaceholder: 'Official Email (e.g. staff@oweb.gov.et)',
        fullNamePlaceholder: 'Full Name (e.g. Eng. Daniel Kebede)',
        passwordLabel: 'Password',
        confirmPasswordLabel: 'Confirm password',
        forgotPassword: 'Forgot password?',
        dontHaveAccount: "Don't have an account?",
        signUpHere: 'Sign up here',
        alreadyHaveAccount: 'Already have an account?',
        signInHere: 'Sign in here',
        signInBtn: 'Sign In',
        instantDemoBtn: '⚡ Quick Demo Login (Root Admin)',
        signUpBtn: 'Create Account',
        signingIn: 'Authenticating...',
        registering: 'Creating Account...',
        rememberMe: 'Remember on this device',
        capsLockOn: 'Caps Lock is ON',
        defaultHint: 'Default password:',
        clickToFill: 'Click to fill password',
        publicPortalBtn: 'Public Transparency Portal →',
        allRoles: 'All',
        engineers: 'Engineers',
        supervisors: 'Supervisors',
        executives: 'Audit / Finance',
        admin: 'Admin',
        searchPersonas: 'Search personas by name, role, zone...',
        verifiedStaff: 'Verified Staff Identity',
        quickRoles: '1-Click Role Login:',
        explorePersonasTab: 'Role Explorer',
        registerStaffTab: 'Register Staff',
        directorateLabel: 'Directorate / Department',
        zoneLabel: 'Assigned Zone',
        roleLabel: 'System Role',
        themeEmerald: 'Technext Emerald',
        themeAzure: 'Ocean Azure'
    },
    om: {
        bureauName: 'Biiroo Qabeenya Bishaanii Oromiyaa',
        bureauSub: 'Oromia Water Resource Bureau',
        appTitle: 'OWEB PB-PMS',
        welcomeTitle: 'Baga Nagaan Dhuftan',
        welcomeSub: 'Sirna Bulchiinsa Piroojeektii fi Qabeenya Bishaanii Oromiyaa',
        welcomeDesc: 'Hordoffii piroojeektota bishaanii, kaffaltii konculummaa fi qulqullina ijaarsa bishaanii godinoota 21 naannoo Oromiyaa keessatti.',
        joinTitle: 'Nuu Wajjin Hojjadhaa',
        joinSub: 'Qoodinsa Eeyyamaa fi Daangaa Hojii',
        joinDesc: 'Gahee hojii injinariitoota dirree, to\'attoota, odiitii fi bulchitoota sirnichaa filachuun daangaa eeyyamaa ilaalaa.',
        signInHeader: 'Gara Sirnaatti Seenaa',
        signInSub: 'Maqaa fayyadamaa ykn imeelii keessan galchuun seeni',
        signUpHeader: 'Poortaalii Hojjetaa',
        signUpSub: 'Gahee hojjetaa mirkanaa\'e filadhaa ykn hojjetaa haaraa galmeessaa',
        usernameLabel: 'Maqaa Fayyadamaa / Imeelii',
        usernamePlaceholder: 'Maqaa fayyadamaa ykn Imeelii (admin ykn gworku3654@gmail.com)',
        emailPlaceholder: 'Imeelii Hojii (fkn: staff@oweb.gov.et)',
        fullNamePlaceholder: 'Maqaa Guutuu (fkn: Inj. Daani\'eel Kabbadaa)',
        passwordLabel: 'Jecha Iccitii',
        confirmPasswordLabel: 'Jecha iccitii mirkaneessi',
        forgotPassword: 'Jecha iccitii irraanfattee?',
        dontHaveAccount: 'Herrega hin qabduu?',
        signUpHere: 'Asitti galmaa\'i',
        alreadyHaveAccount: 'Duraan herrega qabdaa?',
        signInHere: 'Asitti seeni',
        signInBtn: 'Seeni',
        instantDemoBtn: '⚡ Seensa Battalaa (Bulchaa Olaanaa)',
        signUpBtn: 'Herrega Uumi',
        signingIn: 'Eeyyama mirkaneessaa...',
        registering: 'Herrega uumaa jira...',
        rememberMe: 'Kompitarra kanarratti na yaadadhu',
        capsLockOn: 'Qubee Guddaan (Caps Lock) banaadha',
        defaultHint: 'Jecha iccitii barame:',
        clickToFill: 'Jecha iccitii galchi',
        publicPortalBtn: 'Poortaalii Iftoomina Uummataa →',
        allRoles: 'Hunda',
        engineers: 'Injinariitoota',
        supervisors: 'To\'attoota',
        executives: 'Odiitii / Faayinaansii',
        admin: 'Bulchaa',
        searchPersonas: 'Maqaa, gahee, godinaan barbaadi...',
        verifiedStaff: 'Hojjetaa Mirkanaa\'e',
        quickRoles: 'Gahee Hojii Battalaa:',
        explorePersonasTab: 'Gahee Hojii Ilaali',
        registerStaffTab: 'Hojjetaa Galmeessi',
        directorateLabel: 'Daayirektooreetii / Kutaa Hojii',
        zoneLabel: 'Godina Ramadame',
        roleLabel: 'Gahee Sirnichaa',
        themeEmerald: 'Technext Magariisa',
        themeAzure: 'Baqqaa Samii'
    },
    am: {
        bureauName: 'የኦሮሚያ የውሃ ሀብት ቢሮ',
        bureauSub: 'Oromia Water Resource Bureau',
        appTitle: 'OWEB PB-PMS',
        welcomeTitle: 'እንኳን ደህና መጡ',
        welcomeSub: 'የኦሮሚያ ክልል የውሃ ፕሮጀክት አስተዳደርና የጥራት ቁጥጥር ስርዓት',
        welcomeDesc: 'በ21ዱ የኦሮሚያ ዞኖች ውስጥ የሚገኙ የውሃ አቅርቦት ፕሮጀክቶችን፣ የካፒታል በጀትና የጥራት ምዘናዎችን በቀጥታ ይከታተሉ።',
        joinTitle: 'አብረውን ይስሩ',
        joinSub: 'የተጠቃሚ ፈቃድና የደህንነት ደረጃዎች',
        joinDesc: 'ለመስክ መሐንዲሶች፣ ተቆጣጣሪዎች፣ ኦዲተሮችና አስተዳዳሪዎች የተዘጋጁ ልዩ የስራ ድርሻዎችን ይምረጡ።',
        signInHeader: 'ወደ ስርዓቱ መግቢያ',
        signInSub: 'የመለያ ስምዎን ወይም ኦፊሴላዊ ኢሜይልዎን በማስገባት ይግቡ',
        signUpHeader: 'የሰራተኞች ፖርታል',
        signUpSub: 'የተረጋገጡ የሰራተኛ መለያዎችን ይመልከቱ ወይም አዲስ ሰራተኛ ይመዝግቡ',
        usernameLabel: 'የተጠቃሚ ስም / ኢሜይል',
        usernamePlaceholder: 'የተጠቃሚ ስም ወይም ኢሜይል (admin ወይም gworku3654@gmail.com)',
        emailPlaceholder: 'ኦፊሴላዊ ኢሜይል (ለምሳሌ፡ staff@oweb.gov.et)',
        fullNamePlaceholder: 'ሙሉ ስም (ለምሳሌ፡ ኢንጅነር ዳንኤል ከበደ)',
        passwordLabel: 'የይለፍ ቃል',
        confirmPasswordLabel: 'የይለፍ ቃል ያረጋግጡ',
        forgotPassword: 'የይለፍ ቃል ረስተዋል?',
        dontHaveAccount: 'መለያ የለዎትም?',
        signUpHere: 'እዚህ ይመዝገቡ',
        alreadyHaveAccount: 'ቀደም ሲል መለያ አለዎት?',
        signInHere: 'እዚህ ይግቡ',
        signInBtn: 'ግባ',
        instantDemoBtn: '⚡ ፈጣን መግቢያ (ዋና አስተዳዳሪ)',
        signUpBtn: 'መለያ ፍጠር',
        signingIn: 'ማረጋገጫ በመፈተሽ ላይ...',
        registering: 'መለያ በመፍጠር ላይ...',
        rememberMe: 'በዚህ ኮምፒውተር ላይ አስታውሰኝ',
        capsLockOn: 'Caps Lock በርቷል',
        defaultHint: 'መደበኛ ይለፍ ቃል፡',
        clickToFill: 'ይለፍ ቃል አስገባ',
        publicPortalBtn: 'የህዝብ ግልጽነት ፖርታል →',
        allRoles: 'ሁሉም',
        engineers: 'መሐንዲሶች',
        supervisors: 'ተቆጣጣሪዎች',
        executives: 'ኦዲት / ፋይናንስ',
        admin: 'አስተዳዳሪ',
        searchPersonas: 'በስም፣ በስራ ድርሻ፣ በዞን ይፈልጉ...',
        verifiedStaff: 'የተረጋገጠ ሰራተኛ',
        quickRoles: 'ፈጣን የስራ ድርሻ መግቢያ፡',
        explorePersonasTab: 'የስራ ድርሻዎች',
        registerStaffTab: 'ሰራተኛ ይመዝግቡ',
        directorateLabel: 'ዳይሬክቶሬት / የስራ ክፍል',
        zoneLabel: 'የተመደበበት ዞን',
        roleLabel: 'የስርዓት ሚና',
        themeEmerald: 'ቴክኔክስት አረንጓዴ',
        themeAzure: 'የውሃ ሰማያዊ'
    }
};
const DEMO_PERSONAS = [
    {
        username: 'admin',
        fullName: 'Girma Worku',
        role: 'System Administrator',
        category: 'admin',
        scope: 'Full Root Privileges',
        scopeDetail: 'All 21 Regional Zones, RBAC Policies & Master Data',
        icon: '👑',
        description: 'User provisioning, access control governance, geographic boundaries, audit trails, and global system configurations.',
        avatar: 'https://ui-avatars.com/api/?name=Girma+Worku&background=024b82&color=38bdf8&bold=true',
        zone: 'All Zones (Regional HQ)',
        program: 'Executive Core'
    },
    {
        username: 'testuser',
        fullName: 'Tolasa Bekele',
        role: 'Field Engineer',
        category: 'engineer',
        scope: 'Assigned Schemes Only',
        scopeDetail: 'Siree Spring Capping & Dodola Deep Well (2 schemes)',
        icon: '👷',
        description: 'Records daily site QA/QC logbooks, water quality test metrics (pH, turbidity, E.coli), and submits weekly work plans.',
        avatar: 'https://ui-avatars.com/api/?name=Tolasa+Bekele&background=0284c7&color=ffffff&bold=true',
        zone: 'West Arsi',
        program: 'COWASH (CMP)'
    },
    {
        username: 'engineer_dawit',
        fullName: 'Eng. Dawit Alemu',
        role: 'Zonal Field Engineer',
        category: 'engineer',
        scope: 'Assigned Schemes Only',
        scopeDetail: 'West Arsi Zone Water Schemes (2 schemes)',
        icon: '📐',
        description: 'Conducts stage inspections, verifies contractor daily resource logs, and flags site variations for review.',
        avatar: 'https://ui-avatars.com/api/?name=Dawit+Alemu&background=0369a1&color=ffffff&bold=true',
        zone: 'West Arsi',
        program: 'Second Urban (UWSSP-II)'
    },
    {
        username: 'supervisor',
        fullName: 'Eng. Hawi Kebede',
        role: 'Resident Supervisor',
        category: 'supervisor',
        scope: 'Supervised Team & Woreda',
        scopeDetail: 'Bale Zone & Hydrogeology Squad (3 schemes)',
        icon: '📋',
        description: 'Verifies engineer inspection logs, endorses weekly work plans, and signs off Interim Payment Certificates (IPCs).',
        avatar: 'https://ui-avatars.com/api/?name=Hawi+Kebede&background=0ea5e9&color=ffffff&bold=true',
        zone: 'Bale',
        program: 'Borena Resilience'
    },
    {
        username: 'team_leader_tigist',
        fullName: 'Eng. Tigist Mengistu',
        role: 'Supervision Team Leader',
        category: 'supervisor',
        scope: 'Team Jurisdiction',
        scopeDetail: 'Water Supply Team A (East Shewa & Arsi)',
        icon: '📑',
        description: 'Coordinates resident engineers across zones, audits site milestone progress, and evaluates contractor time extensions.',
        avatar: 'https://ui-avatars.com/api/?name=Tigist+Mengistu&background=4f46e5&color=ffffff&bold=true',
        zone: 'East Shewa',
        program: 'ONE WASH (OWNP)'
    },
    {
        username: 'coordinator_kenenisa',
        fullName: 'Kenenisa Bekele',
        role: 'Bureau Project Coordinator',
        category: 'executive',
        scope: 'Bureau-Wide Scope',
        scopeDetail: 'All 14 Regional Water Infrastructure Schemes',
        icon: '🏛️',
        description: 'Cross-portfolio oversight: ONE WASH, COWASH, UNICEF, and Second Urban. Monitors EVM indicators and regional KPIs.',
        avatar: 'https://ui-avatars.com/api/?name=Kenenisa+Bekele&background=0891b2&color=ffffff&bold=true',
        zone: 'Regional PIU',
        program: 'Multi-Portfolio'
    },
    {
        username: 'auditor',
        fullName: 'Merga Feyisa',
        role: 'Senior Independent Auditor',
        category: 'executive',
        scope: 'Global Read-Only Oversight',
        scopeDetail: 'Audit Registry & Contract Variance Oversight',
        icon: '🛡️',
        description: 'Audits tender pricing vs engineer estimates, financial variance, EIA environmental compliance, and site defects.',
        avatar: 'https://ui-avatars.com/api/?name=Merga+Feyisa&background=7c3aed&color=ffffff&bold=true',
        zone: 'Regional Audit Board',
        program: 'Oversight & Compliance'
    },
    {
        username: 'finance_tadesse',
        fullName: 'Fikadu Tadesse',
        role: 'Senior Finance Officer',
        category: 'executive',
        scope: 'Financial Directorate Scope',
        scopeDetail: 'Budget Allocations & IPC Payment Records',
        icon: '💰',
        description: 'Tracks donor fund disbursements, contractor advance payments, IPC retention release, and budget utilization.',
        avatar: 'https://ui-avatars.com/api/?name=Fikadu+Tadesse&background=059669&color=ffffff&bold=true',
        zone: 'Finfinnee HQ',
        program: 'Treasury & Disbursements'
    }
];
export const Login = ({ onLogin, onRegisterUser, onOpenExternalPortal, users = [] }) => {
    // Mode toggle exactly matching Technext's 'sign-in' and 'sign-up' container classes
    const [mode, setMode] = useState('sign-in');
    // Theme toggle: Technext Emerald (#4EA685, #57B894) vs Ocean Azure (#026aa6, #0ea5e9)
    const [theme, setTheme] = useState('emerald');
    // Sign In Form States
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [language, setLanguage] = useState('en');
    const [rememberMe, setRememberMe] = useState(true);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const [justCopied, setJustCopied] = useState(false);
    const [ssoFeedback, setSsoFeedback] = useState(null);
    // Sign Up Sub-Tab: 'personas' (Staff Role Explorer) vs 'register' (Register New Staff)
    const [signUpTab, setSignUpTab] = useState('personas');
    // Registration Form States
    const [regUsername, setRegUsername] = useState('');
    const [regFullName, setRegFullName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('password');
    const [regConfirmPassword, setRegConfirmPassword] = useState('password');
    const [regRole, setRegRole] = useState(Role.ENGINEER);
    const [regZone, setRegZone] = useState('West Arsi');
    const [regDepartment, setRegDepartment] = useState('Water Supply & Sanitation Directorate');
    const [regError, setRegError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    // Persona Explorer Search & Filter
    const [personaSearch, setPersonaSearch] = useState('');
    const [personaCategory, setPersonaCategory] = useState('all');
    const usernameInputRef = useRef(null);
    const t = TRANSLATIONS[language];
    // Pool of valid bureau users (from PostgreSQL backend or initial seed)
    const activeUserPool = useMemo(() => {
        return users && users.length > 0 ? users : initialUsers;
    }, [users]);
    // Restore remembered username on mount
    useEffect(() => {
        const saved = localStorage.getItem('oweb_remembered_username');
        if (saved) {
            setUsername(saved);
        }
    }, []);
    // Smart real-time staff identity match (by username or email)
    const detectedUser = useMemo(() => {
        if (!username || username.trim().length === 0)
            return null;
        const normalized = username.trim().toLowerCase();
        return activeUserPool.find(u => u.username.toLowerCase() === normalized ||
            (u.email && u.email.toLowerCase() === normalized)) || null;
    }, [username, activeUserPool]);
    // Live suggestion for partial matches
    const suggestedUsers = useMemo(() => {
        if (!username || username.trim().length < 2 || detectedUser)
            return [];
        const normalized = username.trim().toLowerCase();
        return activeUserPool.filter(u => u.username.toLowerCase().includes(normalized) ||
            (u.fullName && u.fullName.toLowerCase().includes(normalized)) ||
            (u.email && u.email.toLowerCase().includes(normalized))).slice(0, 3);
    }, [username, detectedUser, activeUserPool]);
    // Filter personas
    const filteredPersonas = useMemo(() => {
        return DEMO_PERSONAS.filter(p => {
            const matchesCategory = personaCategory === 'all' || p.category === personaCategory;
            if (!matchesCategory)
                return false;
            if (!personaSearch.trim())
                return true;
            const q = personaSearch.toLowerCase();
            return (p.fullName.toLowerCase().includes(q) ||
                p.role.toLowerCase().includes(q) ||
                p.username.toLowerCase().includes(q) ||
                p.zone.toLowerCase().includes(q) ||
                p.program.toLowerCase().includes(q));
        });
    }, [personaCategory, personaSearch]);
    // Technext toggle function
    const toggle = () => {
        setMode(prev => prev === 'sign-in' ? 'sign-up' : 'sign-in');
        setError('');
        setRegError('');
        setSsoFeedback(null);
    };
    const handleSelectPersona = async (persona, autoSubmit = false) => {
        setUsername(persona.username);
        setPassword('password');
        setError('');
        if (rememberMe) {
            localStorage.setItem('oweb_remembered_username', persona.username);
        }
        if (autoSubmit) {
            setIsLoading(true);
            const errorMessage = await onLogin(persona.username, 'password');
            setIsLoading(false);
            if (errorMessage) {
                setError(errorMessage);
            }
        }
        else {
            setMode('sign-in');
            if (usernameInputRef.current) {
                usernameInputRef.current.focus();
            }
        }
    };
    const handleQuickLoginRole = async (targetUser) => {
        setUsername(targetUser);
        setPassword('password');
        setError('');
        setIsLoading(true);
        if (rememberMe) {
            localStorage.setItem('oweb_remembered_username', targetUser);
        }
        const errorMessage = await onLogin(targetUser, 'password');
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
    const handleSignInSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const cleanUsername = username.trim();
        const cleanPassword = password.trim() || 'password';
        if (rememberMe) {
            localStorage.setItem('oweb_remembered_username', cleanUsername);
        }
        else {
            localStorage.removeItem('oweb_remembered_username');
        }
        const errorMessage = await onLogin(cleanUsername, cleanPassword);
        setIsLoading(false);
        if (errorMessage) {
            setError(errorMessage);
        }
    };
    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setRegError('');
        if (!regUsername.trim()) {
            setRegError('Please choose a staff username or ID.');
            return;
        }
        if (!regFullName.trim()) {
            setRegError('Please enter your full official name.');
            return;
        }
        if (!regEmail.trim() || !regEmail.includes('@')) {
            setRegError('Please enter a valid official email address.');
            return;
        }
        if (regPassword !== regConfirmPassword) {
            setRegError('Password and Confirm Password do not match.');
            return;
        }
        setIsRegistering(true);
        const newUser = {
            id: `USR-${Date.now()}`,
            username: regUsername.trim().toLowerCase(),
            fullName: regFullName.trim(),
            email: regEmail.trim(),
            role: regRole,
            status: UserStatus.ACTIVE,
            department: regDepartment,
            organization: 'Oromia Water Resource Bureau',
            assignedZone: regZone,
            assignedProgram: 'ONE WASH (OWNP)',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            password: regPassword,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(regFullName.trim())}&background=4EA685&color=fff&bold=true`
        };
        if (onRegisterUser) {
            const res = await onRegisterUser(newUser);
            if (res !== true) {
                setRegError(typeof res === 'string' ? res : 'Registration failed. Username may already exist.');
                setIsRegistering(false);
                return;
            }
        }
        else {
            await onLogin(newUser.username, regPassword);
        }
        setIsRegistering(false);
    };
    // Enterprise SSO Provider Integration
    const handleSSO = (provider) => {
        setSsoFeedback(`Connecting to ${provider}...`);
        setTimeout(() => {
            setSsoFeedback(`Enterprise Single Sign-On with ${provider} is secured via OWEB Identity Services. Please authenticate using your bureau credentials or username.`);
            setTimeout(() => {
                setSsoFeedback(null);
            }, 6000);
        }, 400);
    };
    // Color definitions based on theme
    const primaryColor = theme === 'emerald' ? '#4EA685' : '#026aa6';
    const secondaryColor = theme === 'emerald' ? '#57B894' : '#0ea5e9';
    return (<div className="technext-root select-none font-sans" onKeyDown={handleKeyDetection} onKeyUp={handleKeyDetection}>
            <style>{`
                :root {
                    --primary-color: ${primaryColor};
                    --secondary-color: ${secondaryColor};
                    --black: #000000;
                    --white: #ffffff;
                    --gray: #f3f4f6;
                    --gray-2: #6b7280;
                    --facebook-color: #1e3a8a;
                    --google-color: #DB4437;
                    --twitter-color: #0284c7;
                    --insta-color: #0d9488;
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .technext-root {
                    height: 100vh;
                    width: 100vw;
                    overflow: hidden;
                    background-color: var(--white);
                    position: relative;
                }

                .container {
                    position: relative;
                    min-height: 100vh;
                    width: 100%;
                    overflow: hidden;
                }

                .row {
                    display: flex;
                    flex-wrap: wrap;
                    height: 100vh;
                    width: 100%;
                    position: relative;
                    z-index: 10;
                }

                .col {
                    width: 50%;
                    position: relative;
                    z-index: 15;
                    transition: opacity 0.4s ease;
                }

                .align-items-center {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }

                .flex-col {
                    flex-direction: column;
                }

                /* STRICT VISIBILITY TO PREVENT INACTIVE FORM FROM BLOCKING CLICKS */
                .container.sign-in .col.sign-up {
                    opacity: 0;
                    pointer-events: none;
                    visibility: hidden;
                }
                .container.sign-in .col.sign-in {
                    opacity: 1;
                    pointer-events: auto;
                    visibility: visible;
                }

                .container.sign-up .col.sign-in {
                    opacity: 0;
                    pointer-events: none;
                    visibility: hidden;
                }
                .container.sign-up .col.sign-up {
                    opacity: 1;
                    pointer-events: auto;
                    visibility: visible;
                }

                .form-wrapper {
                    width: 100%;
                    max-width: 31rem;
                    padding: 1rem;
                    position: relative;
                    z-index: 20;
                    pointer-events: auto;
                }

                .form {
                    padding: 1.75rem 2rem;
                    background-color: var(--white);
                    border-radius: 1.5rem;
                    width: 100%;
                    box-shadow: rgba(0, 0, 0, 0.22) 0px 15px 35px, rgba(0, 0, 0, 0.05) 0px 3px 10px;
                    border: 1px solid rgba(226, 232, 240, 0.9);
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    z-index: 25;
                    pointer-events: auto;
                    transform: scale(0.95);
                    opacity: 0;
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
                }

                .container.sign-in .form.sign-in,
                .container.sign-up .form.sign-up {
                    transform: scale(1);
                    opacity: 1;
                }

                .input-group {
                    position: relative;
                    width: 100%;
                    margin: 0.75rem 0;
                    text-align: left;
                    z-index: 30;
                }

                .input-group i,
                .input-group .icon-fallback {
                    position: absolute;
                    top: 50%;
                    left: 1rem;
                    transform: translateY(-50%);
                    font-size: 1.35rem;
                    color: var(--gray-2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                }

                .input-group input,
                .input-group select {
                    width: 100%;
                    padding: 0.85rem 1rem 0.85rem 3rem;
                    font-size: 0.95rem;
                    background-color: var(--gray);
                    border-radius: .5rem;
                    border: 0.125rem solid var(--white);
                    outline: none;
                    color: #0f172a;
                    font-weight: 500;
                    transition: all 0.25s ease;
                    pointer-events: auto;
                }

                .input-group select {
                    appearance: none;
                    cursor: pointer;
                }

                .input-group input:focus,
                .input-group select:focus {
                    background-color: #ffffff;
                    border: 0.125rem solid var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(78, 166, 133, 0.2);
                }

                .form button.action-btn {
                    cursor: pointer;
                    width: 100%;
                    padding: .75rem 0;
                    border-radius: .5rem;
                    border: none;
                    background-color: var(--primary-color);
                    color: var(--white);
                    font-size: 1.15rem;
                    font-weight: 700;
                    outline: none;
                    transition: all 0.25s ease;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
                    pointer-events: auto;
                }

                .form button.action-btn:hover {
                    opacity: 0.92;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
                }

                .form button.action-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .form p {
                    margin: 0.75rem 0;
                    font-size: .8rem;
                    color: #475569;
                }

                .pointer {
                    cursor: pointer;
                    color: var(--primary-color);
                    font-weight: 700;
                    transition: color 0.2s;
                }

                .pointer:hover {
                    text-decoration: underline;
                }

                /* SOCIAL LIST (Staggered Animations as in Technext CodePen) */
                .social-list {
                    margin: 1rem 0 0.25rem;
                    padding: 0.6rem 0.85rem;
                    border-radius: 1.25rem;
                    width: 100%;
                    box-shadow: rgba(0, 0, 0, 0.08) 0px 4px 15px;
                    background-color: #fafafa;
                    border: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: auto;
                    transform: scale(0.9);
                    opacity: 0;
                    transition: all 0.4s ease;
                }

                .container.sign-in .social-list.sign-in,
                .container.sign-up .social-list.sign-up {
                    transform: scale(1);
                    opacity: 1;
                }

                .social-list>div {
                    color: var(--white);
                    margin: 0 .35rem;
                    padding: .6rem 0.8rem;
                    cursor: pointer;
                    border-radius: .5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    transition: all .25s ease;
                    pointer-events: auto;
                }

                .social-list>div>i,
                .social-list>div>svg {
                    font-size: 1.3rem;
                    transition: .25s ease-in-out;
                }

                .social-list>div:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }

                .facebook-bg {
                    background-color: var(--facebook-color);
                }

                .google-bg {
                    background-color: var(--google-color);
                }

                .twitter-bg {
                    background-color: var(--twitter-color);
                }

                .insta-bg {
                    background-color: var(--insta-color);
                }

                /* CONTENT OVERLAY ROW */
                .content-row {
                    position: absolute;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                    z-index: 5;
                    width: 100%;
                    height: 100vh;
                }

                .text {
                    margin: 3.5rem;
                    color: var(--white);
                    pointer-events: none;
                    max-width: 480px;
                    text-align: left;
                }

                .text h2 {
                    font-size: 3.25rem;
                    font-weight: 800;
                    margin: 1.25rem 0 0.75rem;
                    line-height: 1.15;
                    transition: 1s cubic-bezier(0.77, 0, 0.175, 1);
                }

                .text p {
                    font-weight: 500;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    color: rgba(255, 255, 255, 0.92);
                    transition: 1s cubic-bezier(0.77, 0, 0.175, 1);
                    transition-delay: .2s;
                }

                .img {
                    transition: 1s cubic-bezier(0.77, 0, 0.175, 1);
                    transition-delay: .35s;
                    pointer-events: none;
                }

                .text.sign-in h2,
                .text.sign-in p,
                .text.sign-in .smart-kpis,
                .img.sign-in {
                    transform: translateX(-250%);
                }

                .text.sign-up h2,
                .text.sign-up p,
                .text.sign-up .smart-kpis,
                .img.sign-up {
                    transform: translateX(250%);
                }

                .container.sign-in .text.sign-in h2,
                .container.sign-in .text.sign-in p,
                .container.sign-in .text.sign-in .smart-kpis,
                .container.sign-in .img.sign-in,
                .container.sign-up .text.sign-up h2,
                .container.sign-up .text.sign-up p,
                .container.sign-up .text.sign-up .smart-kpis,
                .container.sign-up .img.sign-up {
                    transform: translateX(0);
                }

                /* BACKGROUND SLIDING CURVED OVERLAY (Z-INDEX 1: NEVER COVERS INTERACTIVE FORMS) */
                .container::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    right: 0;
                    height: 100vh;
                    width: 300vw;
                    transform: translate(35%, 0);
                    background-image: linear-gradient(-45deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    transition: 1s cubic-bezier(0.77, 0, 0.175, 1);
                    z-index: 1;
                    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 25px;
                    border-bottom-right-radius: max(50vw, 50vh);
                    border-top-left-radius: max(50vw, 50vh);
                    pointer-events: none;
                }

                .container.sign-in::before {
                    transform: translate(0, 0);
                    right: 50%;
                }

                .container.sign-up::before {
                    transform: translate(100%, 0);
                    right: 50%;
                }

                /* RESPONSIVE DESIGN */
                @media only screen and (max-width: 860px) {
                    .container::before,
                    .container.sign-in::before,
                    .container.sign-up::before {
                        height: 100vh;
                        border-bottom-right-radius: 0;
                        border-top-left-radius: 0;
                        z-index: 1;
                        transform: none;
                        right: 0;
                    }

                    .content-row {
                        display: none;
                    }

                    .col {
                        width: 100%;
                        position: absolute;
                        padding: 1rem;
                        background-color: transparent;
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .row {
                        align-items: center;
                        justify-content: center;
                    }

                    .form-wrapper {
                        max-width: 28rem;
                        padding: 0;
                    }

                    .form {
                        padding: 1.5rem 1.25rem;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                        max-height: 85vh;
                    }
                }
            `}</style>

            {/* FLOATING HEADER: Brand Logo, Theme Switcher, Language Switcher, Public Portal */}
            <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 sm:p-5 pointer-events-auto">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-md">
                        <Logo className="h-6 w-6 sm:h-7 sm:w-7 text-white"/>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm sm:text-base tracking-tight font-display drop-shadow-sm">
                                {t.appTitle}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/25 text-white border border-white/30">
                                PROD
                            </span>
                        </div>
                        <p className="text-[10.5px] text-white/90 font-medium drop-shadow-sm hidden md:block">
                            {t.bureauName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Theme Toggle (Emerald CodePen vs Ocean Azure) */}
                    <div className="inline-flex p-0.5 bg-black/25 backdrop-blur-md rounded-xl border border-white/20 text-[11px] font-bold text-white shadow-sm">
                        <button type="button" onClick={() => setTheme('emerald')} className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${theme === 'emerald'
            ? 'bg-white text-emerald-900 font-extrabold shadow-xs'
            : 'text-white/80 hover:text-white'}`} title="Technext Emerald Palette">
                            <span className="w-2 h-2 rounded-full bg-[#4EA685]"/>
                            <span className="hidden sm:inline">Emerald</span>
                        </button>
                        <button type="button" onClick={() => setTheme('azure')} className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${theme === 'azure'
            ? 'bg-white text-blue-900 font-extrabold shadow-xs'
            : 'text-white/80 hover:text-white'}`} title="OWEB Ocean Azure Palette">
                            <span className="w-2 h-2 rounded-full bg-[#0284c7]"/>
                            <span className="hidden sm:inline">Azure</span>
                        </button>
                    </div>

                    {/* Multilingual Switcher */}
                    <div className="inline-flex p-0.5 bg-black/25 backdrop-blur-md rounded-xl border border-white/20 text-xs font-bold text-white shadow-sm">
                        {['en', 'om', 'am'].map(lang => (<button key={lang} type="button" onClick={() => setLanguage(lang)} className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${language === lang
                ? 'bg-white text-slate-900 font-extrabold shadow-xs'
                : 'text-white/80 hover:text-white'}`}>
                                {lang.toUpperCase()}
                            </button>))}
                    </div>

                    {/* Public Portal Button */}
                    {onOpenExternalPortal && (<button type="button" onClick={onOpenExternalPortal} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl text-xs font-bold transition border border-white/30 shadow-xs cursor-pointer">
                            <span>🌐</span>
                            <span>{t.publicPortalBtn}</span>
                        </button>)}
                </div>
            </header>

            {/* MAIN TECHNEXT CONTAINER */}
            <div id="container" className={`container ${mode}`}>

                {/* FORM SECTION */}
                <div className="row">

                    {/* SIGN UP / ROLE EXPLORER COLUMN (Left Side Form) */}
                    <div className="col align-items-center flex-col sign-up">
                        <div className="form-wrapper align-items-center">
                            <div className="form sign-up text-left">
                                <div className="mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
                                            {signUpTab === 'personas' ? t.signUpHeader : t.registerStaffTab}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {t.signUpSub}
                                        </p>
                                    </div>

                                    {/* Sub-tab Pill Switcher */}
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                        <button type="button" onClick={() => setSignUpTab('personas')} className={`px-2 py-1 text-[10.5px] font-bold rounded-md transition cursor-pointer ${signUpTab === 'personas'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'}`}>
                                            {t.explorePersonasTab}
                                        </button>
                                        <button type="button" onClick={() => setSignUpTab('register')} className={`px-2 py-1 text-[10.5px] font-bold rounded-md transition cursor-pointer ${signUpTab === 'register'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'}`}>
                                            {t.registerStaffTab}
                                        </button>
                                    </div>
                                </div>

                                {signUpTab === 'personas' ? (
        /* TAB 1: ROLE EXPLORER PERSONAS */
        <div className="space-y-2">
                                        {/* Search Input */}
                                        <div className="relative mb-2">
                                            <input type="text" value={personaSearch} onChange={(e) => setPersonaSearch(e.target.value)} placeholder={t.searchPersonas} className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--primary-color)] transition"/>
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                                        </div>

                                        {/* Category Filter Chips */}
                                        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
                                            {['all', 'engineer', 'supervisor', 'executive', 'admin'].map(cat => (<button key={cat} type="button" onClick={() => setPersonaCategory(cat)} className={`px-2 py-0.5 rounded-md font-bold transition whitespace-nowrap text-[10.5px] cursor-pointer ${personaCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                    {cat === 'all' ? t.allRoles : cat === 'engineer' ? t.engineers : cat === 'supervisor' ? t.supervisors : cat === 'executive' ? t.executives : t.admin}
                                                </button>))}
                                        </div>

                                        {/* Persona Cards List */}
                                        <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                                            {filteredPersonas.map((persona) => (<div key={persona.username} onClick={() => handleSelectPersona(persona, true)} className="group p-2 rounded-xl border border-slate-200 hover:border-[var(--primary-color)] hover:shadow-xs transition bg-white cursor-pointer flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="relative flex-shrink-0">
                                                            <img src={persona.avatar} alt={persona.fullName} className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"/>
                                                            <span className="absolute -bottom-1 -right-1 text-[9px]">{persona.icon}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-xs font-bold text-slate-900 group-hover:text-[var(--primary-color)] truncate font-display">
                                                                    {persona.fullName}
                                                                </span>
                                                                <span className="text-[9.5px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                                                                    {persona.role}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 truncate">
                                                                {persona.zone} · {persona.scopeDetail}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button type="button" className="px-2 py-0.5 bg-slate-100 group-hover:bg-[var(--primary-color)] group-hover:text-white text-slate-700 rounded-md text-[11px] font-bold transition flex items-center gap-1 flex-shrink-0 cursor-pointer">
                                                        <span>Launch</span>
                                                        <span>→</span>
                                                    </button>
                                                </div>))}

                                            {filteredPersonas.length === 0 && (<div className="text-center py-6 text-slate-400 text-xs">
                                                    No personas match your query.
                                                </div>)}
                                        </div>
                                    </div>) : (
        /* TAB 2: REGISTER NEW FIELD STAFF */
        <form onSubmit={handleSignUpSubmit} className="space-y-1">
                                        {regError && (<div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 mb-2">
                                                ⚠️ {regError}
                                            </div>)}

                                        <div className="input-group">
                                            <i className='bx bxs-user'></i>
                                            <span className="icon-fallback sm:hidden">👤</span>
                                            <input type="text" placeholder={t.usernamePlaceholder} value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required/>
                                        </div>

                                        <div className="input-group">
                                            <i className='bx bx-user-pin'></i>
                                            <span className="icon-fallback sm:hidden">📛</span>
                                            <input type="text" placeholder={t.fullNamePlaceholder} value={regFullName} onChange={(e) => setRegFullName(e.target.value)} required/>
                                        </div>

                                        <div className="input-group">
                                            <i className='bx bx-mail-send'></i>
                                            <span className="icon-fallback sm:hidden">✉️</span>
                                            <input type="email" placeholder={t.emailPlaceholder} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required/>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="input-group">
                                                <select value={regRole} onChange={(e) => setRegRole(e.target.value)} className="text-xs">
                                                    <option value={Role.ENGINEER}>Field Engineer</option>
                                                    <option value={Role.SUPERVISOR}>Resident Supervisor</option>
                                                    <option value={Role.COORDINATOR}>PIU Coordinator</option>
                                                    <option value={Role.CONTRACT_MANAGER}>Contract Manager</option>
                                                    <option value={Role.FINANCE_OFFICER}>Finance Officer</option>
                                                    <option value={Role.AUDITOR}>Independent Auditor</option>
                                                </select>
                                            </div>

                                            <div className="input-group">
                                                <select value={regZone} onChange={(e) => setRegZone(e.target.value)} className="text-xs">
                                                    <option value="West Arsi">West Arsi Zone</option>
                                                    <option value="East Shewa">East Shewa Zone</option>
                                                    <option value="Bale">Bale Zone</option>
                                                    <option value="Borena">Borena Lowlands</option>
                                                    <option value="Finfinnee HQ">Finfinnee Regional HQ</option>
                                                    <option value="North Shewa">North Shewa Zone</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="input-group">
                                            <i className='bx bxs-lock-alt'></i>
                                            <span className="icon-fallback sm:hidden">🔒</span>
                                            <input type="password" placeholder={t.passwordLabel} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required/>
                                        </div>

                                        <div className="input-group">
                                            <i className='bx bxs-lock-alt'></i>
                                            <span className="icon-fallback sm:hidden">🔒</span>
                                            <input type="password" placeholder={t.confirmPasswordLabel} value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required/>
                                        </div>

                                        <button type="submit" disabled={isRegistering} className="action-btn mt-2">
                                            {isRegistering ? t.registering : t.signUpBtn}
                                        </button>
                                    </form>)}

                                {/* Social List in Sign Up */}
                                <div className="social-list sign-up">
                                    <div onClick={() => handleSSO('GovID Single Sign-On')} className="facebook-bg" title="Federal GovID">
                                        <i className='bx bxs-id-card'></i>
                                        <span className="text-[10px] font-bold">GovID</span>
                                    </div>
                                    <div onClick={() => handleSSO('Google Workspace')} className="google-bg" title="Google Workspace">
                                        <i className='bx bxl-google'></i>
                                    </div>
                                    <div onClick={() => handleSSO('OWEB Enterprise LDAP')} className="twitter-bg" title="OWEB LDAP">
                                        <i className='bx bxs-key'></i>
                                    </div>
                                    <div onClick={() => handleSSO('Microsoft Azure AD')} className="insta-bg" title="Microsoft Azure AD">
                                        <i className='bx bxl-windows'></i>
                                    </div>
                                </div>

                                <p className="text-center mt-3">
                                    <span>{t.alreadyHaveAccount} </span>
                                    <b onClick={toggle} className="pointer">
                                        {t.signInHere}
                                    </b>
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* END SIGN UP */}

                    {/* SIGN IN COLUMN (Right Side Form) */}
                    <div className="col align-items-center flex-col sign-in">
                        <div className="form-wrapper align-items-center">
                            <form className="form sign-in text-left" onSubmit={handleSignInSubmit}>
                                
                                {/* INSTANT 1-CLICK DEMO LOGIN BUTTON AT THE TOP */}
                                <button type="button" onClick={() => handleQuickLoginRole('admin')} disabled={isLoading} className="w-full mb-3 py-2 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer">
                                    <span>👑</span>
                                    <span>{t.instantDemoBtn}</span>
                                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">admin / password</span>
                                </button>

                                <div className="mb-2 pb-2 border-b border-slate-100">
                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
                                        {t.signInHeader}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {t.signInSub}
                                    </p>
                                </div>

                                {error && (<div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                                        <span className="text-sm">⚠️</span>
                                        <span className="font-semibold text-[11.5px]">{error}</span>
                                    </div>)}

                                {ssoFeedback && (<div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5 animate-pulse">
                                        <span>🔄</span>
                                        <span className="font-semibold">{ssoFeedback}</span>
                                    </div>)}

                                {/* USERNAME INPUT GROUP */}
                                <div className="input-group">
                                    <i className='bx bxs-user'></i>
                                    <span className="icon-fallback sm:hidden">👤</span>
                                    <input ref={usernameInputRef} type="text" placeholder={t.usernamePlaceholder} value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username"/>
                                    {detectedUser && (<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 text-xs font-bold pointer-events-none">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                                            <span className="text-[10px] hidden sm:inline">Verified</span>
                                        </div>)}
                                </div>

                                {/* SMART REAL-TIME IDENTITY CARD */}
                                {detectedUser && (<div className="mb-2 p-2 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <img src={detectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(detectedUser.fullName)}&background=4EA685&color=fff&bold=true`} alt={detectedUser.fullName} className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-300"/>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 truncate">
                                                    {detectedUser.fullName}
                                                </p>
                                                <p className="text-[10px] text-slate-500 truncate">
                                                    {detectedUser.role} · {detectedUser.assignedZone || 'Regional HQ'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                                            {detectedUser.role === Role.ADMIN ? 'Root Admin' : 'Authorized'}
                                        </span>
                                    </div>)}

                                {/* SMART PARTIAL MATCH SUGGESTIONS */}
                                {suggestedUsers.length > 0 && !detectedUser && (<div className="mb-2 p-1.5 bg-slate-100 rounded-lg flex items-center gap-1 flex-wrap text-xs">
                                        <span className="text-[10px] text-slate-500 font-semibold">Match:</span>
                                        {suggestedUsers.map(su => (<button key={su.username} type="button" onClick={() => { setUsername(su.username); setPassword('password'); }} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:text-emerald-700 hover:border-emerald-300 text-[10.5px] font-medium transition cursor-pointer">
                                                {su.fullName}
                                            </button>))}
                                    </div>)}

                                {/* PASSWORD INPUT GROUP */}
                                <div className="input-group">
                                    <i className='bx bxs-lock-alt'></i>
                                    <span className="icon-fallback sm:hidden">🔒</span>
                                    <input type={showPassword ? 'text' : 'password'} placeholder={t.passwordLabel} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"/>
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1" title={showPassword ? "Hide password" : "Show password"}>
                                        {showPassword ? (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
                                            </svg>) : (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                            </svg>)}
                                    </button>
                                </div>

                                {capsLockActive && (<div className="mb-2 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        <span>⚠️</span>
                                        <span className="font-semibold">{t.capsLockOn}</span>
                                    </div>)}

                                {/* REMEMBER ME & DEFAULT PASSWORD HELPER */}
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"/>
                                        <span className="text-[11.5px]">{t.rememberMe}</span>
                                    </label>

                                    <span onClick={() => {
            setPassword('password');
            setJustCopied(true);
            setTimeout(() => setJustCopied(false), 2000);
        }} className="text-[11px] text-slate-400 hover:text-emerald-700 cursor-pointer" title={t.clickToFill}>
                                        {t.defaultHint} <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">{justCopied ? 'Applied!' : 'password'}</code>
                                    </span>
                                </div>

                                {/* SIGN IN BUTTON */}
                                <button type="submit" disabled={isLoading} className="action-btn">
                                    {isLoading ? t.signingIn : t.signInBtn}
                                </button>

                                {/* QUICK 1-CLICK ROLE PILLS */}
                                <div className="mt-3 pt-2.5 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        {t.quickRoles}
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        <button type="button" onClick={() => handleQuickLoginRole('admin')} className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 rounded text-[10.5px] font-semibold border border-transparent transition cursor-pointer">
                                            👑 Admin
                                        </button>
                                        <button type="button" onClick={() => handleQuickLoginRole('testuser')} className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 rounded text-[10.5px] font-semibold border border-transparent transition cursor-pointer">
                                            👷 Engineer
                                        </button>
                                        <button type="button" onClick={() => handleQuickLoginRole('supervisor')} className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 rounded text-[10.5px] font-semibold border border-transparent transition cursor-pointer">
                                            📋 Supervisor
                                        </button>
                                        <button type="button" onClick={() => handleQuickLoginRole('coordinator_kenenisa')} className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 rounded text-[10.5px] font-semibold border border-transparent transition cursor-pointer">
                                            🏛️ Coordinator
                                        </button>
                                        <button type="button" onClick={() => handleQuickLoginRole('auditor')} className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 rounded text-[10.5px] font-semibold border border-transparent transition cursor-pointer">
                                            🛡️ Auditor
                                        </button>
                                    </div>
                                </div>

                                {/* SOCIAL LIST / SSO */}
                                <div className="social-list sign-in">
                                    <div onClick={() => handleSSO('GovID Single Sign-On')} className="facebook-bg" title="Federal GovID">
                                        <i className='bx bxs-id-card'></i>
                                        <span className="text-[10px] font-bold">GovID</span>
                                    </div>
                                    <div onClick={() => handleSSO('Google Workspace')} className="google-bg" title="Google Workspace">
                                        <i className='bx bxl-google'></i>
                                    </div>
                                    <div onClick={() => handleSSO('OWEB Enterprise LDAP')} className="twitter-bg" title="OWEB LDAP">
                                        <i className='bx bxs-key'></i>
                                    </div>
                                    <div onClick={() => handleSSO('Microsoft Azure AD')} className="insta-bg" title="Microsoft Azure AD">
                                        <i className='bx bxl-windows'></i>
                                    </div>
                                </div>

                                <p className="text-center mt-3">
                                    <span>{t.dontHaveAccount} </span>
                                    <b onClick={toggle} className="pointer">
                                        {t.signUpHere}
                                    </b>
                                </p>
                            </form>
                        </div>
                    </div>
                    {/* END SIGN IN */}

                </div>
                {/* END FORM SECTION */}

                {/* CONTENT SECTION (The Moving Curved Gradient Texts & Graphics) */}
                <div className="row content-row">

                    {/* SIGN IN CONTENT (Shown on Left Side when in 'sign-in' mode) */}
                    <div className="col align-items-center flex-col">
                        <div className="text sign-in">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-xs font-bold uppercase tracking-wider mb-2 font-display">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>
                                <span>{t.bureauSub}</span>
                            </div>

                            <h2>
                                {t.welcomeTitle}
                            </h2>

                            <p>
                                {t.welcomeDesc}
                            </p>

                            <div className="smart-kpis mt-6 space-y-2.5 text-xs text-white/95">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-white font-bold text-[11px]">
                                        ✓
                                    </div>
                                    <span>ETB 1.45B Capital Ledger (ONE WASH, COWASH, SUWSSP, Borena)</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-white font-bold text-[11px]">
                                        ✓
                                    </div>
                                    <span>WHO &amp; CES 58:2019 Certified Water Quality Potability Testing</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-white font-bold text-[11px]">
                                        ✓
                                    </div>
                                    <span>Georeferenced Asset GIS &amp; Multi-Tiered Privilege Scoping</span>
                                </div>
                            </div>
                        </div>

                        <div className="img sign-in">
                            {/* Technext Hero Graphic: Water drop & regional asset globe */}
                            <svg className="w-60 h-60 text-white drop-shadow-2xl opacity-90" viewBox="0 0 200 200" fill="none">
                                <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="6 6"/>
                                <circle cx="100" cy="100" r="60" fill="rgba(255,255,255,0.15)"/>
                                <path d="M100 35C100 35 60 92 60 125C60 148 78 165 100 165C122 165 140 148 140 125C140 92 100 35 100 35Z" fill="white" fillOpacity="0.85"/>
                                <path d="M85 125C85 110 100 100 100 100C100 100 115 110 115 125C115 133 108 140 100 140C92 140 85 133 85 125Z" fill="rgba(78, 166, 133, 0.8)"/>
                            </svg>
                        </div>
                    </div>
                    {/* END SIGN IN CONTENT */}

                    {/* SIGN UP CONTENT (Shown on Right Side when in 'sign-up' mode) */}
                    <div className="col align-items-center flex-col">
                        <div className="img sign-up">
                            {/* Technext Hero Graphic: Verified Identity & Governance */}
                            <svg className="w-60 h-60 text-white drop-shadow-2xl opacity-90" viewBox="0 0 200 200" fill="none">
                                <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="6 6"/>
                                <rect x="55" y="65" width="90" height="70" rx="12" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2"/>
                                <circle cx="85" cy="95" r="14" fill="white"/>
                                <path d="M70 120C70 112 77 108 85 108C93 108 100 112 100 120" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                                <line x1="110" y1="85" x2="135" y2="85" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                                <line x1="110" y1="97" x2="130" y2="97" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="110" y1="109" x2="125" y2="109" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>

                        <div className="text sign-up">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-xs font-bold uppercase tracking-wider mb-2 font-display">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>
                                <span>{t.joinSub}</span>
                            </div>

                            <h2>
                                {t.joinTitle}
                            </h2>

                            <p>
                                {t.joinDesc}
                            </p>

                            <div className="smart-kpis mt-6 space-y-2.5 text-xs text-white/95">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-white font-bold text-[11px]">
                                        ✓
                                    </div>
                                    <span>Field Engineers: Scoped to assigned schemes &amp; QA/QC logs</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-white font-bold text-[11px]">
                                        ✓
                                    </div>
                                    <span>Resident Supervisors: Inspection signoff &amp; IPC milestones</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-white font-bold text-[11px]">
                                        ✓
                                    </div>
                                    <span>Independent Auditors: Read-only contract &amp; tender variance</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* END SIGN UP CONTENT */}

                </div>
                {/* END CONTENT SECTION */}

            </div>
        </div>);
};
export default Login;
