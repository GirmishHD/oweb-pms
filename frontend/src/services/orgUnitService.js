import { apiClient } from './apiClient';

export const INITIAL_REGIONS = [
    {
        id: 'reg-oromia',
        code: 'REG_OROMIA',
        name: 'Oromia National Regional State',
        localName: 'Mootummaa Naannoo Oromiyaa',
        description: 'Primary administrative jurisdiction for Oromia Water Resource Bureau (OWEB).',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    }
];

export const INITIAL_CLUSTERS = [
    {
        id: 'clust-eastern',
        code: 'CLUST_BAHA_OROMIYAA',
        name: 'Eastern Oromia',
        localName: 'Baha Oromiyaa',
        regionId: 'reg-oromia',
        description: 'Eastern regional cluster encompassing East and West Hararghe watershed corridors.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'clust-southeastern',
        code: 'CLUST_KIBBA_BAHA_OROMIYAA',
        name: 'Southeastern Oromia',
        localName: 'Kibba Baha Oromiyaa',
        regionId: 'reg-oromia',
        description: 'Southeastern regional cluster covering Arsi, West Arsi, Bale, and East Bale basins.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'clust-southern',
        code: 'CLUST_KIBBA_OROMIYAA',
        name: 'Southern Oromia',
        localName: 'Kibba Oromiyaa',
        regionId: 'reg-oromia',
        description: 'Southern pastoralist and rangelands cluster covering Borena, East Borena, Guji, and West Guji.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'clust-southwestern',
        code: 'CLUST_KIBBA_LIXA_OROMIYAA',
        name: 'Southwestern Oromia',
        localName: 'Kibba Lixa Oromiyaa',
        regionId: 'reg-oromia',
        description: 'Southwestern highland rainforest and headwaters cluster covering Buno Bedele, Illubabor, and Jimma.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'clust-western',
        code: 'CLUST_LIXA_OROMIYAA',
        name: 'Western Oromia',
        localName: 'Lixa Oromiyaa',
        regionId: 'reg-oromia',
        description: 'Western regional cluster covering Horo Guduru, Kellem, East, and West Wollega.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'clust-central',
        code: 'CLUST_GIDDU_GALEESSA_OROMIYAA',
        name: 'Central Oromia',
        localName: 'Giddu Galeessa Oromiyaa',
        regionId: 'reg-oromia',
        description: 'Central regional administrative cluster covering East Shewa, North Shewa, Southwest Shewa, and West Shewa.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    }
];

export const INITIAL_TOWNS = [
    // Southeastern Oromia Towns
    {
        id: 'town-asella',
        code: 'TWN_ASELLA',
        name: 'Asella',
        localName: 'Magaalaa Asallaa',
        clusterId: 'clust-southeastern',
        clusterName: 'Southeastern Oromia',
        formerZone: 'Arsi',
        classification: 'City Administration',
        status: 'Active',
        description: 'City Administration in Southeastern Oromia (Arsi).'
    },
    {
        id: 'town-dodola',
        code: 'TWN_DODOLA',
        name: 'Dodola',
        localName: 'Magaalaa Dodolaa',
        clusterId: 'clust-southeastern',
        clusterName: 'Southeastern Oromia',
        formerZone: 'West Arsi',
        classification: 'City Administration',
        status: 'Active',
        description: 'City Administration in Southeastern Oromia (West Arsi).'
    },
    // Southern Oromia Towns
    {
        id: 'town-bule-hora',
        code: 'TWN_BULE_HORA',
        name: 'Bule Hora',
        localName: 'Magaalaa Bulee Horaa',
        clusterId: 'clust-southern',
        clusterName: 'Southern Oromia',
        formerZone: 'West Guji',
        classification: 'City Administration',
        status: 'Active',
        description: 'City Administration in Southern Oromia (West Guji).'
    },
    {
        id: 'town-moyale',
        code: 'TWN_MOYALE',
        name: 'Moyale',
        localName: 'Magaalaa Moyyaalee',
        clusterId: 'clust-southern',
        clusterName: 'Southern Oromia',
        formerZone: 'Borena',
        classification: 'City Administration',
        status: 'Active',
        description: 'Border City Administration in Southern Oromia (Borena).'
    },
    {
        id: 'town-shakiso',
        code: 'TWN_SHAKISO',
        name: 'Shakiso',
        localName: 'Magaalaa Saakkisoo',
        clusterId: 'clust-southern',
        clusterName: 'Southern Oromia',
        formerZone: 'Guji',
        classification: 'City Administration',
        status: 'Active',
        description: 'Mining hub City Administration in Southern Oromia (Guji).'
    },
    // Southwestern Oromia Towns
    {
        id: 'town-agaro',
        code: 'TWN_AGARO',
        name: 'Agaro',
        localName: 'Magaalaa Aggaaroo',
        clusterId: 'clust-southwestern',
        clusterName: 'Southwestern Oromia',
        formerZone: 'Jimma',
        classification: 'City Administration',
        status: 'Active',
        description: 'Coffee producing City Administration in Southwestern Oromia (Jimma).'
    },
    {
        id: 'town-mattu',
        code: 'TWN_MATTU',
        name: 'Mattu',
        localName: 'Magaalaa Mattuu',
        clusterId: 'clust-southwestern',
        clusterName: 'Southwestern Oromia',
        formerZone: 'Illubabor',
        classification: 'City Administration',
        status: 'Active',
        description: 'Highland City Administration in Southwestern Oromia (Illubabor).'
    },
    // Western Oromia Towns
    {
        id: 'town-nejo',
        code: 'TWN_NEJO',
        name: 'Nejo',
        localName: 'Magaalaa Najjoo',
        clusterId: 'clust-western',
        clusterName: 'Western Oromia',
        formerZone: 'West Wollega',
        classification: 'City Administration',
        status: 'Active',
        description: 'Trade center City Administration in Western Oromia (West Wollega).'
    },
    // Central Oromia Towns
    {
        id: 'town-ambo',
        code: 'TWN_AMBO',
        name: 'Ambo',
        localName: 'Magaalaa Amboo',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'West Shewa',
        classification: 'City Administration',
        status: 'Active',
        description: 'Thermal spring hub City Administration in Central Oromia (West Shewa).'
    },
    {
        id: 'town-batu',
        code: 'TWN_BATU',
        name: 'Batu',
        localName: 'Magaalaa Baatuu',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'East Shewa',
        classification: 'City Administration',
        status: 'Active',
        description: 'Rift Valley lake shore City Administration in Central Oromia (East Shewa).'
    },
    {
        id: 'town-holeta',
        code: 'TWN_HOLETA',
        name: 'Holeta',
        localName: 'Magaalaa Hoolotaa',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'West Shewa',
        classification: 'City Administration',
        status: 'Active',
        description: 'Agricultural research City Administration in Central Oromia (West Shewa).'
    },
    {
        id: 'town-mojo',
        code: 'TWN_MOJO',
        name: 'Mojo',
        localName: 'Magaalaa Moojoo',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'East Shewa',
        classification: 'City Administration',
        status: 'Active',
        description: 'Dry port logistics City Administration in Central Oromia (East Shewa).'
    },
    {
        id: 'town-sandafa-bakkee',
        code: 'TWN_SANDAFA_BAKKEE',
        name: 'Sandafa Bakkee',
        localName: 'Magaalaa Sandafaa Bakkee',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'North Shewa',
        classification: 'City Administration',
        status: 'Active',
        description: 'Peri-urban City Administration in Central Oromia (North Shewa).'
    },
    {
        id: 'town-sheno',
        code: 'TWN_SHENO',
        name: 'Sheno',
        localName: 'Magaalaa Shenoo',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'North Shewa',
        classification: 'City Administration',
        status: 'Active',
        description: 'Highland plateau City Administration in Central Oromia (North Shewa).'
    },
    {
        id: 'town-waliso',
        code: 'TWN_WALISO',
        name: 'Waliso',
        localName: 'Magaalaa Walisoo',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'Southwest Shewa',
        classification: 'City Administration',
        status: 'Active',
        description: 'Hot spring commercial City Administration in Central Oromia (Southwest Shewa).'
    }
];

export const INITIAL_WOREDAS = [
    // Central Oromia Woredas
    {
        id: 'wor-adama',
        code: 'WOR_ADAMA',
        name: 'Adama Woreda',
        localName: 'Aanaa Adaamaa',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'East Shewa',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    {
        id: 'wor-bishoftu',
        code: 'WOR_BISHOFTU',
        name: 'Ada\'a / Bishoftu Woreda',
        localName: 'Aanaa Ada\'aa',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'East Shewa',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    {
        id: 'wor-boset',
        code: 'WOR_BOSET',
        name: 'Boset Woreda',
        localName: 'Aanaa Bosaat',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'East Shewa',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    {
        id: 'wor-sebeta',
        code: 'WOR_SEBETA',
        name: 'Sebeta Hawas Woreda',
        localName: 'Aanaa Sabbataa Hawaas',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'Southwest Shewa',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    {
        id: 'wor-waliso-woreda',
        code: 'WOR_WALISO_RURAL',
        name: 'Waliso Rural Woreda',
        localName: 'Aanaa Walisoo',
        clusterId: 'clust-central',
        clusterName: 'Central Oromia',
        formerZone: 'Southwest Shewa',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    // Southeastern Oromia Woredas
    {
        id: 'wor-shashamane',
        code: 'WOR_SHASHAMANE',
        name: 'Shashamane Rural Woreda',
        localName: 'Aanaa Shaashamannee',
        clusterId: 'clust-southeastern',
        clusterName: 'Southeastern Oromia',
        formerZone: 'West Arsi',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    {
        id: 'wor-tiyo',
        code: 'WOR_TIYO',
        name: 'Tiyo Woreda',
        localName: 'Aanaa Xiyyoo',
        clusterId: 'clust-southeastern',
        clusterName: 'Southeastern Oromia',
        formerZone: 'Arsi',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    // Southern Oromia Woredas
    {
        id: 'wor-yabelo',
        code: 'WOR_YABELO',
        name: 'Yabelo Woreda',
        localName: 'Aanaa Yaaballoo',
        clusterId: 'clust-southern',
        clusterName: 'Southern Oromia',
        formerZone: 'Borena',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    // Southwestern Oromia Woredas
    {
        id: 'wor-mana',
        code: 'WOR_MANA',
        name: 'Mana Woreda',
        localName: 'Aanaa Maannaa',
        clusterId: 'clust-southwestern',
        clusterName: 'Southwestern Oromia',
        formerZone: 'Jimma',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    // Western Oromia Woredas
    {
        id: 'wor-gimbi',
        code: 'WOR_GIMBI',
        name: 'Gimbi Woreda',
        localName: 'Aanaa Gimbii',
        clusterId: 'clust-western',
        clusterName: 'Western Oromia',
        formerZone: 'West Wollega',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    // Eastern Oromia Woredas
    {
        id: 'wor-chiro',
        code: 'WOR_CHIRO',
        name: 'Chiro Zuria Woreda',
        localName: 'Aanaa Ciroo',
        clusterId: 'clust-eastern',
        clusterName: 'Eastern Oromia',
        formerZone: 'West Hararghe',
        classification: 'Administrative Woreda',
        status: 'Active'
    },
    {
        id: 'wor-haromaya',
        code: 'WOR_HAROMAYA',
        name: 'Haromaya Woreda',
        localName: 'Aanaa Haramayaa',
        clusterId: 'clust-eastern',
        clusterName: 'Eastern Oromia',
        formerZone: 'East Hararghe',
        classification: 'Administrative Woreda',
        status: 'Active'
    }
];

export const INITIAL_KEBELES = [
    {
        id: 'keb-01',
        code: 'KEB_AWASHO_01',
        name: 'Awasho 01',
        localName: 'Ganda Awaashoo 01',
        woredaId: 'wor-shashamane',
        woredaName: 'Shashamane Rural Woreda',
        status: 'Active'
    },
    {
        id: 'keb-02',
        code: 'KEB_DIDA_BOKE',
        name: 'Dida Boke',
        localName: 'Ganda Diidaa Booqee',
        woredaId: 'wor-shashamane',
        woredaName: 'Shashamane Rural Woreda',
        status: 'Active'
    },
    {
        id: 'keb-03',
        code: 'KEB_DHARITO',
        name: 'Dharito',
        localName: 'Ganda Dhaarixoo',
        woredaId: 'wor-yabelo',
        woredaName: 'Yabelo Woreda',
        status: 'Active'
    },
    {
        id: 'keb-04',
        code: 'KEB_BOLE_02',
        name: 'Bole Sub-city Kebele 02',
        localName: 'Ganda Boolee 02',
        woredaId: 'wor-adama',
        woredaName: 'Adama Woreda',
        status: 'Active'
    },
    {
        id: 'keb-05',
        code: 'KEB_GUDETA',
        name: 'Gudeta Kebele',
        localName: 'Ganda Guddattuu',
        woredaId: 'wor-mana',
        woredaName: 'Mana Woreda',
        status: 'Active'
    }
];

// Query and Filter Helpers
export const getRegions = (masterData, statusFilter, searchQuery) => {
    let list = masterData?.regions?.length ? masterData.regions : INITIAL_REGIONS;
    if (statusFilter && statusFilter !== 'ALL') {
        list = list.filter(r => r.status === statusFilter);
    }
    if (searchQuery?.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(r => (r.name && r.name.toLowerCase().includes(q)) ||
            (r.code && r.code.toLowerCase().includes(q)) ||
            (r.localName && r.localName.toLowerCase().includes(q)));
    }
    return list;
};

export const getClusters = (masterData, statusFilter, searchQuery) => {
    let list = masterData?.clusters?.length ? masterData.clusters : INITIAL_CLUSTERS;
    if (statusFilter && statusFilter !== 'ALL') {
        list = list.filter(c => c.status === statusFilter);
    }
    if (searchQuery?.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(c => (c.name && c.name.toLowerCase().includes(q)) ||
            (c.code && c.code.toLowerCase().includes(q)) ||
            (c.localName && c.localName.toLowerCase().includes(q)));
    }
    return list;
};

export const getTownsByCluster = (clusterId, masterData, statusFilter, searchQuery) => {
    let list = masterData?.towns?.length ? masterData.towns : INITIAL_TOWNS;
    if (clusterId && clusterId !== 'ALL') {
        list = list.filter(t => t.clusterId === clusterId || t.parentId === clusterId);
    }
    if (statusFilter && statusFilter !== 'ALL') {
        list = list.filter(t => t.status === statusFilter);
    }
    if (searchQuery?.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(t => (t.name && t.name.toLowerCase().includes(q)) ||
            (t.code && t.code.toLowerCase().includes(q)) ||
            (t.localName && t.localName.toLowerCase().includes(q)));
    }
    return list;
};

export const getWoredasByCluster = (clusterId, masterData, statusFilter, searchQuery) => {
    let list = masterData?.woredas?.length ? masterData.woredas : INITIAL_WOREDAS;
    if (clusterId && clusterId !== 'ALL') {
        list = list.filter(w => w.clusterId === clusterId || w.parentId === clusterId);
    }
    if (statusFilter && statusFilter !== 'ALL') {
        list = list.filter(w => w.status === statusFilter);
    }
    if (searchQuery?.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(w => (w.name && w.name.toLowerCase().includes(q)) ||
            (w.code && w.code.toLowerCase().includes(q)) ||
            (w.localName && w.localName.toLowerCase().includes(q)) ||
            (w.formerZone && w.formerZone.toLowerCase().includes(q)));
    }
    return list;
};

export const getKebelesByParent = (parentId, masterData, statusFilter, searchQuery) => {
    let list = masterData?.kebeles?.length ? masterData.kebeles : INITIAL_KEBELES;
    if (parentId && parentId !== 'ALL') {
        list = list.filter(k => k.woredaId === parentId || k.parentId === parentId);
    }
    if (statusFilter && statusFilter !== 'ALL') {
        list = list.filter(k => k.status === statusFilter);
    }
    if (searchQuery?.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(k => (k.name && k.name.toLowerCase().includes(q)) ||
            (k.code && k.code.toLowerCase().includes(q)) ||
            (k.localName && k.localName.toLowerCase().includes(q)));
    }
    return list;
};

// Hierarchical Tree Builder: Region -> Cluster -> [Woreda, Town] -> Kebele
export const buildHierarchyTree = (regions = [], clusters = [], woredas = [], towns = [], kebeles = []) => {
    const regList = regions.length ? regions : INITIAL_REGIONS;
    const clustList = clusters.length ? clusters : INITIAL_CLUSTERS;
    const worList = woredas.length ? woredas : INITIAL_WOREDAS;
    const twnList = towns.length ? towns : INITIAL_TOWNS;
    const kebList = kebeles.length ? kebeles : INITIAL_KEBELES;

    return regList.map(reg => {
        const childClusters = clustList.filter(c => c.regionId === reg.id || c.parentId === reg.id || !c.regionId);
        return {
            id: reg.id,
            code: reg.code,
            name: reg.name,
            localName: reg.localName,
            unitType: 'REGION',
            status: reg.status,
            children: childClusters.map(clust => {
                const childWoredas = worList.filter(w => w.clusterId === clust.id || w.parentId === clust.id);
                const childTowns = twnList.filter(t => t.clusterId === clust.id || t.parentId === clust.id);
                
                const combinedChildren = [
                    ...childWoredas.map(wor => {
                        const childKebeles = kebList.filter(k => k.woredaId === wor.id || k.parentId === wor.id);
                        return {
                            id: wor.id,
                            code: wor.code,
                            name: wor.name,
                            localName: wor.localName,
                            unitType: 'WOREDA',
                            classification: wor.classification || 'Administrative Woreda',
                            formerZone: wor.formerZone,
                            status: wor.status,
                            children: childKebeles.map(keb => ({
                                id: keb.id,
                                code: keb.code,
                                name: keb.name,
                                localName: keb.localName,
                                unitType: 'KEBELE',
                                status: keb.status
                            }))
                        };
                    }),
                    ...childTowns.map(twn => {
                        const childKebeles = kebList.filter(k => k.woredaId === twn.id || k.parentId === twn.id);
                        return {
                            id: twn.id,
                            code: twn.code,
                            name: twn.name,
                            localName: twn.localName,
                            unitType: 'TOWN',
                            classification: twn.classification || 'City Administration',
                            formerZone: twn.formerZone,
                            status: twn.status,
                            children: childKebeles.map(keb => ({
                                id: keb.id,
                                code: keb.code,
                                name: keb.name,
                                localName: keb.localName,
                                unitType: 'KEBELE',
                                status: keb.status
                            }))
                        };
                    })
                ];

                return {
                    id: clust.id,
                    code: clust.code,
                    name: clust.name,
                    localName: clust.localName,
                    unitType: 'CLUSTER',
                    status: clust.status,
                    description: clust.description,
                    children: combinedChildren
                };
            })
        };
    });
};

// Check if an administrative unit is referenced by any business entity
export const checkOrgUnitUsage = (unitType, idOrCodeOrName, projects = [], contracts = [], users = []) => {
    const details = [];
    let usageCount = 0;
    if (!idOrCodeOrName) return { isUsed: false, usageCount: 0, details: [] };
    const needle = idOrCodeOrName.trim().toLowerCase();

    if (unitType === 'REGION') {
        const matchingPrj = projects.filter(p => (p.region && p.region.toLowerCase().includes(needle)));
        if (matchingPrj.length > 0) {
            usageCount += matchingPrj.length;
            details.push(`${matchingPrj.length} Project(s) configured under this Region`);
        }
    } else if (unitType === 'CLUSTER') {
        const matchingPrj = projects.filter(p => (p.cluster && p.cluster.toLowerCase().includes(needle)));
        if (matchingPrj.length > 0) {
            usageCount += matchingPrj.length;
            details.push(`${matchingPrj.length} Project(s) assigned to this Cluster`);
        }
        const matchingUsers = users.filter(u => (u.assignedCluster && u.assignedCluster.toLowerCase().includes(needle)) ||
            (u.assignedZone && u.assignedZone.toLowerCase().includes(needle)));
        if (matchingUsers.length > 0) {
            usageCount += matchingUsers.length;
            details.push(`${matchingUsers.length} User(s) deployed in this Cluster`);
        }
    } else if (unitType === 'WOREDA' || unitType === 'TOWN') {
        const matchingPrj = projects.filter(p => (p.woreda && p.woreda.toLowerCase().includes(needle)));
        if (matchingPrj.length > 0) {
            usageCount += matchingPrj.length;
            details.push(`${matchingPrj.length} Project(s) situated in this ${unitType === 'TOWN' ? 'Town / City Admin' : 'Woreda'}`);
        }
        const matchingUsers = users.filter(u => (u.assignedWoreda && u.assignedWoreda.toLowerCase().includes(needle)));
        if (matchingUsers.length > 0) {
            usageCount += matchingUsers.length;
            details.push(`${matchingUsers.length} Staff assigned to this location`);
        }
    } else if (unitType === 'KEBELE') {
        const matchingPrj = projects.filter(p => (p.kebele && p.kebele.toLowerCase().includes(needle)));
        if (matchingPrj.length > 0) {
            usageCount += matchingPrj.length;
            details.push(`${matchingPrj.length} Scheme site(s) located in this Kebele`);
        }
    }

    return {
        isUsed: usageCount > 0,
        usageCount,
        details
    };
};

// API Services
export const fetchOrgUnitTree = async () => {
    try {
        const res = await apiClient.get('/api/masterdata/org-units/tree/');
        return res.data;
    } catch (err) {
        console.warn('fetchOrgUnitTree API fallback:', err);
        return buildHierarchyTree(INITIAL_REGIONS, INITIAL_CLUSTERS, INITIAL_WOREDAS, INITIAL_TOWNS, INITIAL_KEBELES);
    }
};

export const fetchOrgUnitSummary = async () => {
    try {
        const res = await apiClient.get('/api/masterdata/org-units/summary/');
        return res.data;
    } catch (err) {
        console.warn('fetchOrgUnitSummary API fallback:', err);
        return {
            regionsCount: INITIAL_REGIONS.length,
            clustersCount: INITIAL_CLUSTERS.length,
            woredasCount: INITIAL_WOREDAS.length,
            townsCount: INITIAL_TOWNS.length,
            kebelesCount: INITIAL_KEBELES.length,
            totalUnits: INITIAL_REGIONS.length + INITIAL_CLUSTERS.length + INITIAL_WOREDAS.length + INITIAL_TOWNS.length + INITIAL_KEBELES.length
        };
    }
};

export const fetchAuditMigrationReport = async () => {
    try {
        const res = await apiClient.get('/api/masterdata/org-units/audit_migration_report/');
        return res.data;
    } catch (err) {
        console.warn('fetchAuditMigrationReport API fallback:', err);
        return null;
    }
};

export const createOrgUnit = async (unitData) => {
    const payload = {
        id: unitData.id || `org-${Date.now()}`,
        code: unitData.code,
        name: unitData.name,
        local_name: unitData.localName || '',
        unit_type: unitData.unitType,
        classification: unitData.classification || '',
        parent: unitData.parentId || null,
        cluster: unitData.clusterId || null,
        former_zone_name: unitData.formerZone || '',
        status: unitData.status || 'Active',
        description: unitData.description || ''
    };
    const res = await apiClient.post('/api/masterdata/org-units/', payload);
    return res.data;
};

export const updateOrgUnit = async (id, unitData) => {
    const payload = {
        ...(unitData.code ? { code: unitData.code } : {}),
        ...(unitData.name ? { name: unitData.name } : {}),
        ...(unitData.localName !== undefined ? { local_name: unitData.localName } : {}),
        ...(unitData.unitType ? { unit_type: unitData.unitType } : {}),
        ...(unitData.classification !== undefined ? { classification: unitData.classification } : {}),
        ...(unitData.parentId !== undefined ? { parent: unitData.parentId } : {}),
        ...(unitData.clusterId !== undefined ? { cluster: unitData.clusterId } : {}),
        ...(unitData.formerZone !== undefined ? { former_zone_name: unitData.formerZone } : {}),
        ...(unitData.status ? { status: unitData.status } : {}),
        ...(unitData.description !== undefined ? { description: unitData.description } : {})
    };
    const res = await apiClient.patch(`/api/masterdata/org-units/${id}/`, payload);
    return res.data;
};

export const deleteOrgUnit = async (id) => {
    const res = await apiClient.delete(`/api/masterdata/org-units/${id}/`);
    return res.data;
};
