export const ETHIOPIAN_PPA_THRESHOLDS = {
    'National Competitive Bidding (NCB)': {
        method: 'National Competitive Bidding (NCB)',
        code: 'NCB',
        description: 'Standard open national bidding for medium to large scale water schemes within Ethiopian territory.',
        thresholds: {
            Works: { min: 500000, max: 50000000 },
            Goods: { min: 300000, max: 10000000 },
            'Consulting Services': { min: 150000, max: 5000000 },
            'Non-consulting Services': { min: 150000, max: 7000000 }
        },
        floatingPeriodDaysMin: 30,
        standstillDaysMin: 7
    },
    'International Competitive Bidding (ICB)': {
        method: 'International Competitive Bidding (ICB)',
        code: 'ICB',
        description: 'International open bidding for high-value complex infrastructure, specialized drilling rigs, and heavy water treatment plants.',
        thresholds: {
            Works: { min: 50000000, max: Infinity },
            Goods: { min: 10000000, max: Infinity },
            'Consulting Services': { min: 5000000, max: Infinity },
            'Non-consulting Services': { min: 7000000, max: Infinity }
        },
        floatingPeriodDaysMin: 45,
        standstillDaysMin: 10
    },
    'Request for Quotations (RFQ)': {
        method: 'Request for Quotations (RFQ)',
        code: 'RFQ',
        description: 'Shopping method for readily available off-the-shelf goods, small repair civil works, and minor services.',
        thresholds: {
            Works: { min: 0, max: 500000 },
            Goods: { min: 0, max: 300000 },
            'Consulting Services': { min: 0, max: 150000 },
            'Non-consulting Services': { min: 0, max: 150000 }
        },
        floatingPeriodDaysMin: 7,
        standstillDaysMin: 3
    },
    'Direct Contracting / Single Source': {
        method: 'Direct Contracting / Single Source',
        code: 'DIRECT',
        description: 'Sole-source procurement for emergency drought response, proprietary spare parts, or extension of existing contracts.',
        thresholds: {
            Works: { min: 0, max: 15000000 },
            Goods: { min: 0, max: 5000000 },
            'Consulting Services': { min: 0, max: 2000000 },
            'Non-consulting Services': { min: 0, max: 2000000 }
        },
        floatingPeriodDaysMin: 0,
        standstillDaysMin: 0
    },
    'QCBS / LCS (Consultancy)': {
        method: 'QCBS / LCS (Consultancy)',
        code: 'QCBS',
        description: 'Quality and Cost Based Selection or Least Cost Selection for technical feasibility, design, and supervision consultancies.',
        thresholds: {
            Works: { min: 0, max: 0 },
            Goods: { min: 0, max: 0 },
            'Consulting Services': { min: 200000, max: Infinity },
            'Non-consulting Services': { min: 200000, max: Infinity }
        },
        floatingPeriodDaysMin: 30,
        standstillDaysMin: 7
    },
    'Restricted Bidding': {
        method: 'Restricted Bidding',
        code: 'RESTRICTED',
        description: 'Shortlisted competitive bidding for specialized hydro works where only limited licensed contractors exist.',
        thresholds: {
            Works: { min: 500000, max: 30000000 },
            Goods: { min: 300000, max: 5000000 },
            'Consulting Services': { min: 150000, max: 3000000 },
            'Non-consulting Services': { min: 150000, max: 4000000 }
        },
        floatingPeriodDaysMin: 21,
        standstillDaysMin: 7
    }
};
export const PROCUREMENT_STAGES_FLOW = [
    {
        stage: 'Preparation',
        label: 'Preparation & SBD Drafting',
        stepNumber: 1,
        description: 'Bidding document formulation, TOR review, and procurement method approval.',
        color: 'slate'
    },
    {
        stage: 'Advertisement / Invitation',
        label: 'Tender Floating & Ad',
        stepNumber: 2,
        description: 'Publication in press/portal and bid submission floating period.',
        color: 'sky'
    },
    {
        stage: 'Bid Opening',
        label: 'Public Bid Opening',
        stepNumber: 3,
        description: 'Opening session, CPO security verification, and readout price recording.',
        color: 'cyan'
    },
    {
        stage: 'Technical & Financial Evaluation',
        label: 'BEC Evaluation & Scoring',
        stepNumber: 4,
        description: 'Legal compliance, technical scoring (>70pts), and arithmetic corrections.',
        color: 'indigo'
    },
    {
        stage: 'Notification of Award & Standstill',
        label: 'Award Notice & Standstill',
        stepNumber: 5,
        description: 'Intention to award publication and statutory appeal window.',
        color: 'amber'
    },
    {
        stage: 'Contract Signing',
        label: 'Contract Signing & Transition',
        stepNumber: 6,
        description: '10% performance bond submission and formal contract signing.',
        color: 'emerald'
    }
];
export function validateProcurementThreshold(method, type, budgetETB) {
    const normMethod = method.includes('NCB') ? 'National Competitive Bidding (NCB)'
        : method.includes('ICB') ? 'International Competitive Bidding (ICB)'
            : method.includes('RFQ') || method.includes('Quotations') ? 'Request for Quotations (RFQ)'
                : method.includes('Direct') ? 'Direct Contracting / Single Source'
                    : method.includes('QCBS') || method.includes('Consultancy') ? 'QCBS / LCS (Consultancy)'
                        : method.includes('Restricted') ? 'Restricted Bidding'
                            : 'National Competitive Bidding (NCB)';
    const rule = ETHIOPIAN_PPA_THRESHOLDS[normMethod];
    if (!rule) {
        return {
            isValid: true,
            status: 'Compliant',
            message: 'Method threshold within standard operational guidelines.',
            budgetETB,
            maxAllowedETB: 50000000,
            minRequiredETB: 0
        };
    }
    const limits = rule.thresholds[type] || { min: 0, max: 50000000 };
    if (budgetETB > limits.max) {
        const recommended = budgetETB > 50000000 ? 'International Competitive Bidding (ICB)' : 'National Competitive Bidding (NCB)';
        return {
            isValid: false,
            status: 'Exceeded Threshold',
            message: `Budget of ${(budgetETB / 1000000).toFixed(2)}M ETB exceeds ${normMethod} maximum threshold of ${(limits.max / 1000000).toFixed(2)}M ETB for ${type}.`,
            recommendedMethod: recommended,
            budgetETB,
            maxAllowedETB: limits.max,
            minRequiredETB: limits.min
        };
    }
    if (budgetETB < limits.min && normMethod.includes('ICB')) {
        return {
            isValid: false,
            status: 'Warning',
            message: `Budget of ${(budgetETB / 1000000).toFixed(2)}M ETB is below the ICB minimum threshold of ${(limits.min / 1000000).toFixed(2)}M ETB. Consider NCB.`,
            recommendedMethod: 'National Competitive Bidding (NCB)',
            budgetETB,
            maxAllowedETB: limits.max,
            minRequiredETB: limits.min
        };
    }
    return {
        isValid: true,
        status: 'Compliant',
        message: `Estimated budget of ${(budgetETB / 1000000).toFixed(2)}M ETB is fully compliant with ${rule.code} threshold limits.`,
        budgetETB,
        maxAllowedETB: limits.max,
        minRequiredETB: limits.min
    };
}
export function formatCurrencyETB(amount) {
    if (amount === undefined || amount === null || isNaN(amount))
        return '0.00 ETB';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount) + ' ETB';
}
export function calculateLeadTimeDays(startDate, endDate) {
    if (!startDate || !endDate)
        return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start)
        return 0;
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
}
export function getBidSecurityStatus(expiryDate) {
    if (!expiryDate) {
        return { status: 'Active / Valid', daysRemaining: 90, colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    const expiry = new Date(expiryDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
        return { status: 'Expired', daysRemaining: diffDays, colorClass: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (diffDays <= 30) {
        return { status: 'Expiring Soon', daysRemaining: diffDays, colorClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { status: 'Active / Valid', daysRemaining: diffDays, colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}
