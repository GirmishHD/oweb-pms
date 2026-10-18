import {
    WATER_SOURCES, ENERGY_SOURCES, PROJECT_TYPES, INTERVENTION_TYPES,
    FUNDING_SOURCES, IMPLEMENTING_BODIES, PROCUREMENT_METHODS, PROC_TYPES,
    DELIVERABLE_CATEGORIES, AMENDMENT_TYPES, DOCUMENT_CATEGORIES,
    OROMIA_HIERARCHY, CURRENCIES
} from '../constants';
import { saveMasterData } from './masterDataService';

// Default Field Inspection Stages
export const DEFAULT_INSPECTION_STAGES = [
    'Pre-Construction & Site Handover',
    'Excavation & Foundations',
    'Pipelaying & Hydrostatic Pressure Test',
    'Electromechanical & Solar Installation',
    'Reservoir Masonry & Structural Works',
    'Pre-Commissioning & Water Quality Disinfection',
    'Final Handover & Defects Liability'
];

// Helper to sanitize and normalize strings
const cleanString = (val) => (typeof val === 'string' ? val.trim() : '');

// 1. Water Sources
export const getWaterSources = (masterData) => {
    const list = new Set();
    // Direct array
    if (Array.isArray(masterData?.waterSources)) {
        masterData.waterSources.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    // Catalog items
    if (Array.isArray(masterData?.catalogItems)) {
        masterData.catalogItems
            .filter(i => (i.categoryCode === 'WATER_SOURCE' || i.categoryCode === 'cat-water-src') && i.isActive !== false)
            .forEach(i => {
                const str = cleanString(i.name);
                if (str) list.add(str);
            });
    }
    // Fallback constants
    if (list.size === 0) {
        WATER_SOURCES.forEach(s => list.add(s));
    }
    return Array.from(list);
};

// 2. Energy / Power Sources
export const getEnergySources = (masterData) => {
    const list = new Set();
    if (Array.isArray(masterData?.energySources)) {
        masterData.energySources.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    if (Array.isArray(masterData?.catalogItems)) {
        masterData.catalogItems
            .filter(i => (i.categoryCode === 'ENERGY_SOURCE' || i.categoryCode === 'cat-energy-src') && i.isActive !== false)
            .forEach(i => {
                const str = cleanString(i.name);
                if (str) list.add(str);
            });
    }
    if (list.size === 0) {
        ENERGY_SOURCES.forEach(s => list.add(s));
    }
    return Array.from(list);
};

// 3. Project Categories & Subtypes
export const getProjectCategories = (masterData) => {
    if (masterData?.projectCategories && Object.keys(masterData.projectCategories).length > 0) {
        return masterData.projectCategories;
    }
    return PROJECT_TYPES;
};

export const getProjectTypes = (masterData) => {
    const categories = getProjectCategories(masterData);
    return Object.keys(categories);
};

export const getProjectSubtypes = (masterData, projectType) => {
    const categories = getProjectCategories(masterData);
    if (!projectType || !categories[projectType]) {
        // Return all subtypes flattened
        return Array.from(new Set(Object.values(categories).flat()));
    }
    return categories[projectType] || [];
};

// 4. Intervention Types
export const getInterventionTypes = (masterData) => {
    const list = new Set();
    if (Array.isArray(masterData?.interventionTypes)) {
        masterData.interventionTypes.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    if (Array.isArray(masterData?.catalogItems)) {
        masterData.catalogItems
            .filter(i => (i.categoryCode === 'INTERVENTION_TYPE' || i.categoryCode === 'cat-int-type') && i.isActive !== false)
            .forEach(i => {
                const str = cleanString(i.name);
                if (str) list.add(str);
            });
    }
    if (list.size === 0) {
        INTERVENTION_TYPES.forEach(s => list.add(s));
    }
    return Array.from(list);
};

// 5. Funding Sources
export const getFundingSources = (masterData) => {
    const list = new Set();
    if (Array.isArray(masterData?.fundingSources)) {
        masterData.fundingSources.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    if (Array.isArray(masterData?.catalogItems)) {
        masterData.catalogItems
            .filter(i => (i.categoryCode === 'FUNDING_SOURCE' || i.categoryCode === 'cat-pay-source') && i.isActive !== false)
            .forEach(i => {
                const str = cleanString(i.name);
                if (str) list.add(str);
            });
    }
    if (list.size === 0) {
        FUNDING_SOURCES.forEach(s => list.add(s));
    }
    return Array.from(list);
};

// 6. Implementing Bodies
export const getImplementingBodies = (masterData) => {
    const list = new Set();
    if (Array.isArray(masterData?.implementingBodies)) {
        masterData.implementingBodies.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    if (Array.isArray(masterData?.catalogItems)) {
        masterData.catalogItems
            .filter(i => (i.categoryCode === 'IMPLEMENTING_BODY' || i.categoryCode === 'cat-impl-body') && i.isActive !== false)
            .forEach(i => {
                const str = cleanString(i.name);
                if (str) list.add(str);
            });
    }
    if (list.size === 0) {
        IMPLEMENTING_BODIES.forEach(s => list.add(s));
    }
    return Array.from(list);
};

// 7. Procurement Methods
export const getProcurementMethods = (masterData) => {
    const list = new Set();
    if (Array.isArray(masterData?.procurementMethods)) {
        masterData.procurementMethods.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    if (Array.isArray(masterData?.catalogItems)) {
        masterData.catalogItems
            .filter(i => (i.categoryCode === 'PROCUREMENT_METHOD' || i.categoryCode === 'cat-proc-method') && i.isActive !== false)
            .forEach(i => {
                const str = cleanString(i.name);
                if (str) list.add(str);
            });
    }
    if (list.size === 0) {
        PROCUREMENT_METHODS.forEach(s => list.add(s));
    }
    return Array.from(list);
};

// 8. Procurement Types
export const getProcurementTypes = (masterData) => {
    const list = new Set();
    if (Array.isArray(masterData?.procurementTypes)) {
        masterData.procurementTypes.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    if (Array.isArray(masterData?.catalogItems)) {
        masterData.catalogItems
            .filter(i => (i.categoryCode === 'CONTRACT_CATEGORY' || i.categoryCode === 'cat-ctr-cat') && i.isActive !== false)
            .forEach(i => {
                const str = cleanString(i.name);
                if (str) list.add(str);
            });
    }
    if (list.size === 0) {
        PROC_TYPES.forEach(s => list.add(s));
    }
    return Array.from(list);
};

// 9. Deliverable Categories
export const getDeliverableCategories = (masterData) => {
    const list = new Set();
    if (Array.isArray(masterData?.deliverableCategories)) {
        masterData.deliverableCategories.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    if (Array.isArray(masterData?.catalogItems)) {
        masterData.catalogItems
            .filter(i => (i.categoryCode === 'DELIVERABLE_CATEGORY' || i.categoryCode === 'cat-deliv-cat') && i.isActive !== false)
            .forEach(i => {
                const str = cleanString(i.name);
                if (str) list.add(str);
            });
    }
    if (list.size === 0) {
        DELIVERABLE_CATEGORIES.forEach(s => list.add(s));
    }
    return Array.from(list);
};

// 10. Amendment & Variation Types
export const getAmendmentTypes = (masterData) => {
    const list = new Set();
    if (Array.isArray(masterData?.amendmentTypes)) {
        masterData.amendmentTypes.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    if (Array.isArray(masterData?.catalogItems)) {
        masterData.catalogItems
            .filter(i => (i.categoryCode === 'AMENDMENT_TYPE' || i.categoryCode === 'cat-amend-type') && i.isActive !== false)
            .forEach(i => {
                const str = cleanString(i.name);
                if (str) list.add(str);
            });
    }
    if (list.size === 0) {
        AMENDMENT_TYPES.forEach(s => list.add(s));
    }
    return Array.from(list);
};

// 11. Document Categories
export const getDocumentCategories = (masterData) => {
    const list = new Set();
    if (Array.isArray(masterData?.documentCategories)) {
        masterData.documentCategories.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    if (Array.isArray(masterData?.catalogItems)) {
        masterData.catalogItems
            .filter(i => (i.categoryCode === 'DOCUMENT_CATEGORY' || i.categoryCode === 'cat-doc-cat') && i.isActive !== false)
            .forEach(i => {
                const str = cleanString(i.name);
                if (str) list.add(str);
            });
    }
    if (list.size === 0) {
        DOCUMENT_CATEGORIES.forEach(s => {
            const val = typeof s === 'object' ? s.value || s.label : s;
            if (val) list.add(val);
        });
    }
    return Array.from(list);
};

// 12. Inspection Stages
export const getInspectionStages = (masterData) => {
    const list = new Set();
    if (Array.isArray(masterData?.inspectionStages)) {
        masterData.inspectionStages.forEach(s => {
            const str = cleanString(typeof s === 'object' ? s.name : s);
            if (str) list.add(str);
        });
    }
    if (list.size === 0) {
        DEFAULT_INSPECTION_STAGES.forEach(s => list.add(s));
    }
    return Array.from(list);
};

// 13. Geographic Hierarchy (Clusters -> Woredas & Towns)
export const getGeographicHierarchy = (masterData) => {
    if (masterData?.geographicHierarchy && Object.keys(masterData.geographicHierarchy).length > 0) {
        return masterData.geographicHierarchy;
    }
    return OROMIA_HIERARCHY;
};

export const getClusters = (masterData) => {
    if (Array.isArray(masterData?.clusters) && masterData.clusters.length > 0) {
        return masterData.clusters.map(c => (typeof c === 'object' ? c.name : c));
    }
    const hierarchy = getGeographicHierarchy(masterData);
    const keys = Object.keys(hierarchy);
    const clusterNames = ['Central Oromia', 'Eastern Oromia', 'Southeastern Oromia', 'Southern Oromia', 'Southwestern Oromia', 'Western Oromia'];
    const matched = keys.filter(k => clusterNames.includes(k));
    if (matched.length > 0) return matched;
    return clusterNames;
};

export const getTowns = (masterData) => {
    if (Array.isArray(masterData?.towns) && masterData.towns.length > 0) {
        return masterData.towns.map(t => (typeof t === 'object' ? t.name : t));
    }
    return [];
};

export const getZones = (masterData) => {
    // Replaces former zone list with the 6 Clusters
    return getClusters(masterData);
};

export const getWoredasForZone = (masterData, clusterOrZoneName) => {
    if (!clusterOrZoneName) return [];
    const hierarchy = getGeographicHierarchy(masterData);
    if (hierarchy[clusterOrZoneName]) return hierarchy[clusterOrZoneName];
    // Check if cluster name maps to units
    const clusterUnits = (masterData?.woredas || []).filter(w => w.clusterName === clusterOrZoneName || w.clusterId === clusterOrZoneName);
    if (clusterUnits.length > 0) return clusterUnits.map(u => u.name);
    return [];
};

// 14. Currencies
export const getCurrencies = (masterData) => {
    if (Array.isArray(masterData?.currencies) && masterData.currencies.length > 0) {
        return masterData.currencies.map(c => (typeof c === 'object' ? c.code || c.name : c));
    }
    return CURRENCIES.map(c => c.value);
};

// ========================================================
// MUTATION OPERATIONS (Instantly persistent to local & API)
// ========================================================

/**
 * Universal helper to add an item to any Master Data dropdown category
 * @param {Object} masterData Current master data state
 * @param {string} categoryKey Category identifier ('waterSources', 'energySources', etc.)
 * @param {string|Object} item Item name or object { name, code, description }
 * @returns {Object} Updated masterData object
 */
export const addMasterDataItem = (masterData, categoryKey, item) => {
    const itemName = typeof item === 'object' ? item.name : item;
    if (!itemName || !cleanString(itemName)) return masterData;

    const trimmedName = cleanString(itemName);
    const itemCode = typeof item === 'object' && item.code ? item.code : `AUTO_${Date.now().toString(36).toUpperCase()}`;
    const desc = typeof item === 'object' ? item.description || '' : '';

    const updated = { ...masterData };

    // Update target array
    if (Array.isArray(updated[categoryKey])) {
        const existingNames = updated[categoryKey].map(x => (typeof x === 'object' ? x.name : x));
        if (!existingNames.includes(trimmedName)) {
            if (typeof updated[categoryKey][0] === 'object') {
                updated[categoryKey] = [...updated[categoryKey], { id: `item-${Date.now()}`, name: trimmedName, code: itemCode, description: desc, active: true }];
            } else {
                updated[categoryKey] = [...updated[categoryKey], trimmedName];
            }
        }
    } else {
        updated[categoryKey] = [trimmedName];
    }

    // Also register in catalogItems for consistency
    const catalogItems = Array.isArray(updated.catalogItems) ? [...updated.catalogItems] : [];
    catalogItems.push({
        id: `cat-item-${Date.now()}`,
        categoryCode: categoryKey.toUpperCase(),
        code: itemCode,
        name: trimmedName,
        description: desc,
        isActive: true,
        displayOrder: catalogItems.length + 1
    });
    updated.catalogItems = catalogItems;

    // Bump patch version and timestamp
    const parts = (updated.version || '2.0.0').split('.').map(Number);
    updated.version = `${parts[0] || 2}.${parts[1] || 0}.${(parts[2] || 0) + 1}`;
    updated.lastPushedAt = new Date().toISOString();

    saveMasterData(updated);
    return updated;
};

/**
 * Remove an item from a Master Data dropdown category
 */
export const removeMasterDataItem = (masterData, categoryKey, itemNameToRemove) => {
    if (!itemNameToRemove) return masterData;
    const target = cleanString(itemNameToRemove);
    const updated = { ...masterData };

    if (Array.isArray(updated[categoryKey])) {
        updated[categoryKey] = updated[categoryKey].filter(x => {
            const name = typeof x === 'object' ? x.name : x;
            return cleanString(name) !== target;
        });
    }

    if (Array.isArray(updated.catalogItems)) {
        updated.catalogItems = updated.catalogItems.filter(i => cleanString(i.name) !== target);
    }

    const parts = (updated.version || '2.0.0').split('.').map(Number);
    updated.version = `${parts[0] || 2}.${parts[1] || 0}.${(parts[2] || 0) + 1}`;
    updated.lastPushedAt = new Date().toISOString();

    saveMasterData(updated);
    return updated;
};

/**
 * Add a Woreda to a specific Zone in geographicHierarchy
 */
export const addWoredaToZone = (masterData, zoneName, woredaName) => {
    if (!zoneName || !woredaName) return masterData;
    const cleanZone = cleanString(zoneName);
    const cleanWoreda = cleanString(woredaName);

    const hierarchy = { ...(getGeographicHierarchy(masterData)) };
    const currentWoredas = hierarchy[cleanZone] ? [...hierarchy[cleanZone]] : [];

    if (!currentWoredas.includes(cleanWoreda)) {
        currentWoredas.push(cleanWoreda);
        hierarchy[cleanZone] = currentWoredas.sort();
    }

    const updated = {
        ...masterData,
        geographicHierarchy: hierarchy,
        lastPushedAt: new Date().toISOString()
    };

    saveMasterData(updated);
    return updated;
};

/**
 * Add a new Zone to geographicHierarchy
 */
export const addZone = (masterData, zoneName) => {
    if (!zoneName) return masterData;
    const cleanZone = cleanString(zoneName);

    const hierarchy = { ...(getGeographicHierarchy(masterData)) };
    if (!hierarchy[cleanZone]) {
        hierarchy[cleanZone] = [];
    }

    const updated = {
        ...masterData,
        geographicHierarchy: hierarchy,
        lastPushedAt: new Date().toISOString()
    };

    saveMasterData(updated);
    return updated;
};
