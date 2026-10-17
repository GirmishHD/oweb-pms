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
    },
    {
        id: 'reg-amhara',
        code: 'REG_AMHARA',
        name: 'Amhara Region',
        localName: 'Naannoo Amaaraa',
        description: 'Northern neighbor regional state with transboundary watershed agreements.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'reg-somali',
        code: 'REG_SOMALI',
        name: 'Somali Region',
        localName: 'Naannoo Somaalee',
        description: 'Eastern lowlands regional state with joint pastoral drought mitigation corridors.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'reg-sidama',
        code: 'REG_SIDAMA',
        name: 'Sidama Region',
        localName: 'Naannoo Sidaamaa',
        description: 'Southern regional neighbor sharing Rift Valley lake basins and headwaters.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'reg-south',
        code: 'REG_SOUTH',
        name: 'South Ethiopia Regional State',
        localName: 'Naannoo Kibba Itoophiyaa',
        description: 'Southern border regional state with joint water resource basins.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'reg-bg',
        code: 'REG_BG',
        name: 'Benishangul-Gumuz Region',
        localName: 'Naannoo Benishaangul-Gumuz',
        description: 'Western basin regional partner on Blue Nile and Dabus river tributaries.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'reg-afar',
        code: 'REG_AFAR',
        name: 'Afar Region',
        localName: 'Naannoo Affaar',
        description: 'Awash river basin downstream beneficiary regional administration.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'reg-gambela',
        code: 'REG_GAMBELA',
        name: 'Gambela Region',
        localName: 'Naannoo Gaambeellaa',
        description: 'Baro-Akobo river basin western neighbor regional administration.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'reg-harari',
        code: 'REG_HARARI',
        name: 'Harari Region',
        localName: 'Naannoo Hararii',
        description: 'Eastern enclave region sharing Maya and Dire Dawa water sources.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'reg-finfinnee',
        code: 'REG_FINFINNEE',
        name: 'Addis Ababa / Finfinnee City Admin',
        localName: 'Bulchiinsa Magaalaa Finfinnee',
        description: 'Chartered capital territory with shared surface reservoir and wellfield agreements.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'reg-dire-dawa',
        code: 'REG_DIRE_DAWA',
        name: 'Dire Dawa Administration',
        localName: 'Bulchiinsa Dirree Dawaa',
        description: 'Chartered city administration sharing eastern watershed aquifers.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    }
];
export const INITIAL_WOREDAS = [
    // East Shewa & Central Oromia Woredas
    {
        id: 'wor-adama',
        code: 'WOR_ADAMA',
        name: 'Adama Woreda',
        localName: 'Aanaa Adaamaa',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Major agricultural and industrial woreda in East Shewa zone surrounding Adama city.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-bishoftu',
        code: 'WOR_BISHOFTU',
        name: 'Bishoftu / Ada\'a Woreda',
        localName: 'Aanaa Bishooftuu / Ada\'aa',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Rift valley volcanic crater lakes and productive deep aquifers basin.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-dukem',
        code: 'WOR_DUKEM',
        name: 'Dukem Woreda',
        localName: 'Aanaa Dukam',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Eastern special zone woreda with industrial park water distribution grids.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-boset',
        code: 'WOR_BOSET',
        name: 'Boset Woreda',
        localName: 'Aanaa Bosaat',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Rift valley drought-susceptible woreda with Awash river abstraction projects.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-lume',
        code: 'WOR_LUME',
        name: 'Lume Woreda',
        localName: 'Aanaa Luumee (Mojo)',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Mojo river basin multi-village piped water schemes.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // Finfinnee Surrounding Special Zone
    {
        id: 'wor-sebeta',
        code: 'WOR_SEBETA',
        name: 'Sebeta Hawas Woreda',
        localName: 'Aanaa Sabbataa Hawaas',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Rapidly urbanizing peri-urban woreda southwest of Finfinnee with expanding multi-village schemes.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-sululta',
        code: 'WOR_SULULTA',
        name: 'Sululta Woreda',
        localName: 'Aanaa Sulultaa',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Highland plateau aquifer providing spring water bottling and community schemes.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-burayu',
        code: 'WOR_BURAYU',
        name: 'Burayu Woreda',
        localName: 'Aanaa Buraayyuu',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Western corridor town and surrounding peri-urban rural kebeles.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // West Shewa Woredas
    {
        id: 'wor-ambo',
        code: 'WOR_AMBO',
        name: 'Ambo Woreda',
        localName: 'Aanaa Amboo Zuriya',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Highland mineral spring aquifers and gravity-flow rural piped schemes.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-waliso',
        code: 'WOR_WALISO',
        name: 'Waliso Woreda',
        localName: 'Aanaa Walisoo',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Southwest Shewa agrarian district with thermal springs and deep wells.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-bako',
        code: 'WOR_BAKO',
        name: 'Bako Tibe Woreda',
        localName: 'Aanaa Baaqqoo Xibbee',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Gibe river sub-basin agricultural center with river intake schemes.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // North Shewa Woredas
    {
        id: 'wor-fiche',
        code: 'WOR_FICHE',
        name: 'Fiche / Gerar Jarso Woreda',
        localName: 'Aanaa Fiichee / Garaar Jaarsoo',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'North Shewa highland zone with deep spring catchments and gravity networks.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-hidabu',
        code: 'WOR_HIDABU',
        name: 'Hidabu Abote Woreda',
        localName: 'Aanaa Hidaabuu Abbootee',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Muger river gorge basin with specialized pumping stations.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // Arsi Woredas
    {
        id: 'wor-asella',
        code: 'WOR_ASELLA',
        name: 'Asella / Tiyo Woreda',
        localName: 'Aanaa Asallaa / Xiyyo',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Mount Chilalo forested watershed headwaters supplying multi-village pipelines.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-digelu',
        code: 'WOR_DIGELU',
        name: 'Digelu & Tijo Woreda',
        localName: 'Aanaa Dambal & Xiyyo',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Highland pastoralist and grain-growing district with spring protection schemes.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-shirka',
        code: 'WOR_SHIRKA',
        name: 'Shirka Woreda',
        localName: 'Aanaa Shirkkaa',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Eastern Arsi district with deep valley river diversions.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // West Arsi Woredas
    {
        id: 'wor-shashemene',
        code: 'WOR_SHASHEMENE',
        name: 'Shashemene Zuriya Woreda',
        localName: 'Aanaa Shaashamannee Zuriyaa',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Major Rift Valley commercial crossroads with deep well drilling programs.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-arsi-negele',
        code: 'WOR_ARSI_NEGELE',
        name: 'Arsi Negele Woreda',
        localName: 'Aanaa Arsii Nageellee',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Lake Langano and Abijatta catchment area with defluoridation water projects.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-kofele',
        code: 'WOR_KOFELE',
        name: 'Kofele Woreda',
        localName: 'Aanaa Kofalee',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Abundant high-yield perennial springs supplying gravity-fed community tanks.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // Bale & East Bale Woredas
    {
        id: 'wor-robe',
        code: 'WOR_ROBE',
        name: 'Robe / Sinana Woreda',
        localName: 'Aanaa Roobee / Sinaanannaa',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Bale plateau grain belt with Weib river watershed schemes.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-goba',
        code: 'WOR_GOBA',
        name: 'Goba Woreda',
        localName: 'Aanaa Gobbaa',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Bale Mountains National Park alpine watershed and pristine river origins.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // Jimma Woredas
    {
        id: 'wor-manna',
        code: 'WOR_MANNA',
        name: 'Manna Woreda',
        localName: 'Aanaa Maannaa (Jimma)',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Major coffee-growing forested zone with high groundwater recharge.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-agaro',
        code: 'WOR_AGARO',
        name: 'Gomma / Agaro Woreda',
        localName: 'Aanaa Gmmaa / Aggaaroo',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Didessa sub-basin with protected natural springs and community boreholes.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // Borana & Guji Woredas (Drought-Resilient Focus)
    {
        id: 'wor-yabelo',
        code: 'WOR_YABELO',
        name: 'Yabelo Woreda',
        localName: 'Aanaa Yaaballoo',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Borana zonal capital with strategic deep wellfields and pastoralist mega-pans.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-moyale',
        code: 'WOR_MOYALE',
        name: 'Moyale Oromia Woreda',
        localName: 'Aanaa Mooyyale Oromiyaa',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Border pastoralist district with cross-border groundwater sharing initiatives.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-bule-hora',
        code: 'WOR_BULE_HORA',
        name: 'Bule Hora Woreda',
        localName: 'Aanaa Bulee Horaa',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'West Guji commercial center with highland spring protection installations.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // East & West Hararghe Woredas
    {
        id: 'wor-deder',
        code: 'WOR_DEDER',
        name: 'Deder Woreda',
        localName: 'Aanaa Dhadhar',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Mountainous East Hararghe terrain with valley weir and spring development.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-chiro',
        code: 'WOR_CHIRO',
        name: 'Chiro Zuriya Woreda',
        localName: 'Aanaa Ciroo Zuriyaa',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'West Hararghe escarpment with sand dam and sub-surface aquifer extraction.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    // Wollega Woredas
    {
        id: 'wor-nekemte',
        code: 'WOR_NEKEMTE',
        name: 'Guto Gida / Nekemte Woreda',
        localName: 'Aanaa Guutoo Giddaa / Naqamte',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'East Wollega administrative center with Angar river basin schemes.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-gimbi',
        code: 'WOR_GIMBI',
        name: 'Gimbi Woreda',
        localName: 'Aanaa Gimbii',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'West Wollega mining and agricultural region with deep bedrock drilling.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'wor-dembi-dolo',
        code: 'WOR_DEMBI_DOLO',
        name: 'Dembi Dolo / Sayo Woreda',
        localName: 'Aanaa Dambi Doolloo / Sayyoo',
        regionId: 'reg-oromia',
        regionName: 'Oromia National Regional State',
        description: 'Kellem Wollega highland zone with perennial forest streams and reservoirs.',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    }
];
// Seed kebeles for woredas
export const generateInitialKebeles = () => {
    const kebeles = [];
    const now = '2026-01-01T00:00:00.000Z';
    // Specific representative kebeles for major woredas
    const specificKebeles = {
        'wor-adama': [
            { code: 'KEB_ADM_01', name: 'Kebele 01 (Boku Shenen)', localName: 'Ganda 01 Boqqoo Shanan' },
            { code: 'KEB_ADM_02', name: 'Kebele 02 (Dhadhacha)', localName: 'Ganda 02 Dhadhacha' },
            { code: 'KEB_ADM_03', name: 'Kebele 03 (Melka Hida)', localName: 'Ganda 03 Malkaa Hidaa' },
            { code: 'KEB_ADM_04', name: 'Kebele 04 (Migira)', localName: 'Ganda 04 Migiraa' },
            { code: 'KEB_ADM_05', name: 'Kebele 05 (Dembela)', localName: 'Ganda 05 Dambalaa' },
            { code: 'KEB_ADM_06', name: 'Wonji Gefersa Rural Kebele', localName: 'Ganda Baadiyyaa Wanji Gafarsa' },
            { code: 'KEB_ADM_07', name: 'Sodore Mineral Spring Kebele', localName: 'Ganda Madda Sooddaree' }
        ],
        'wor-sebeta': [
            { code: 'KEB_SBT_01', name: 'Kebele 01 (Daleti Center)', localName: 'Ganda 01 Daaleetii' },
            { code: 'KEB_SBT_02', name: 'Kebele 02 (Alem Gena Corridor)', localName: 'Ganda 02 Alam Ganaa' },
            { code: 'KEB_SBT_03', name: 'Kebele 03 (Furi Foothills)', localName: 'Ganda 03 Fuurii' },
            { code: 'KEB_SBT_04', name: 'Kebele 04 (Dimtu Rural Scheme)', localName: 'Ganda 04 Diimtuu' },
            { code: 'KEB_SBT_05', name: 'Teji Road Water Point Kebele', localName: 'Ganda Karaa Tajjii' }
        ],
        'wor-bishoftu': [
            { code: 'KEB_BSH_01', name: 'Kebele 01 (Babogaya Lake)', localName: 'Ganda 01 Baabbooggayyaa' },
            { code: 'KEB_BSH_02', name: 'Kebele 02 (Hora Arsadi Sacred Lake)', localName: 'Ganda 02 Hora Harsadii' },
            { code: 'KEB_BSH_03', name: 'Kebele 03 (Kuriftu Basin)', localName: 'Ganda 03 Kuriiftuu' },
            { code: 'KEB_BSH_04', name: 'Chefe Donsa Rural Scheme Kebele', localName: 'Ganda Caffee Doonsaa' }
        ],
        'wor-ambo': [
            { code: 'KEB_AMB_01', name: 'Kebele 01 (Sankale Catchment)', localName: 'Ganda 01 Sankaallee' },
            { code: 'KEB_AMB_02', name: 'Kebele 02 (Awaro Springs)', localName: 'Ganda 02 Awaarroo' },
            { code: 'KEB_AMB_03', name: 'Kebele 03 (Kisose Rural)', localName: 'Ganda 03 Kisosee' },
            { code: 'KEB_AMB_04', name: 'Guder River Intake Kebele', localName: 'Ganda Lagoo Gudar' }
        ],
        'wor-asella': [
            { code: 'KEB_ASL_01', name: 'Kebele 01 (Chilalo Forest Gate)', localName: 'Ganda 01 Cilaaloo' },
            { code: 'KEB_ASL_02', name: 'Kebele 02 (Arbagugu)', localName: 'Ganda 02 Arbaaguguu' },
            { code: 'KEB_ASL_03', name: 'Kebele 03 (Kombolcha)', localName: 'Ganda 03 Kombolcha' },
            { code: 'KEB_ASL_04', name: 'Gonde Gravity Scheme Kebele', localName: 'Ganda Goondee' }
        ],
        'wor-shashemene': [
            { code: 'KEB_SHS_01', name: 'Kebele 01 (Kuyera Hospital Scheme)', localName: 'Ganda 01 Kuuyyaraa' },
            { code: 'KEB_SHS_02', name: 'Kebele 02 (Awasho Deep Well)', localName: 'Ganda 02 Awaashoo' },
            { code: 'KEB_SHS_03', name: 'Kebele 03 (Arada Commercial)', localName: 'Ganda 03 Araadaa' },
            { code: 'KEB_SHS_04', name: 'Sololo Defluoridation Kebele', localName: 'Ganda Soolooloo' }
        ],
        'wor-robe': [
            { code: 'KEB_ROB_01', name: 'Kebele 01 (Sof Omar Caves)', localName: 'Ganda 01 Saaf Umar' },
            { code: 'KEB_ROB_02', name: 'Kebele 02 (Dinsho Park Gate)', localName: 'Ganda 02 Dinshoo' },
            { code: 'KEB_ROB_03', name: 'Kebele 03 (Sinana Grain Field)', localName: 'Ganda 03 Sannaana' },
            { code: 'KEB_ROB_04', name: 'Weib River Intake Kebele', localName: 'Ganda Laga Wayib' }
        ],
        'wor-yabelo': [
            { code: 'KEB_YAB_01', name: 'Kebele 01 (Yabelo Central Wellfield)', localName: 'Ganda 01 Yaaballoo Gidduu' },
            { code: 'KEB_YAB_02', name: 'Kebele 02 (Dharito Pastoral Pan)', localName: 'Ganda 02 Dhaarixoo' },
            { code: 'KEB_YAB_03', name: 'Kebele 03 (Dida Hara Mega-Dam)', localName: 'Ganda 03 Diida Haaraa' },
            { code: 'KEB_YAB_04', name: 'Surupha Resilient Well Kebele', localName: 'Ganda Suruphaa' }
        ]
    };
    // Add all specific kebeles
    INITIAL_WOREDAS.forEach(woreda => {
        const customList = specificKebeles[woreda.id];
        if (customList) {
            customList.forEach((item, idx) => {
                kebeles.push({
                    id: `keb-${woreda.code.toLowerCase()}-${idx + 1}`,
                    code: item.code,
                    name: item.name,
                    localName: item.localName,
                    woredaId: woreda.id,
                    woredaName: woreda.name,
                    regionId: woreda.regionId,
                    description: `Administrative kebele within ${woreda.name}.`,
                    status: 'Active',
                    createdAt: now,
                    updatedAt: now
                });
            });
        }
        else {
            // Default 3 kebeles for all other woredas to guarantee complete coverage
            const woredaShort = woreda.code.replace('WOR_', '');
            [1, 2, 3].forEach(kNum => {
                kebeles.push({
                    id: `keb-${woredaShort.toLowerCase()}-${kNum}`,
                    code: `KEB_${woredaShort}_0${kNum}`,
                    name: `${woreda.name.replace(' Woreda', '')} Kebele 0${kNum}`,
                    localName: `${woreda.localName.replace('Aanaa ', 'Ganda ')} 0${kNum}`,
                    woredaId: woreda.id,
                    woredaName: woreda.name,
                    regionId: woreda.regionId,
                    description: `Registered kebele community unit in ${woreda.name}.`,
                    status: 'Active',
                    createdAt: now,
                    updatedAt: now
                });
            });
        }
    });
    return kebeles;
};
export const INITIAL_KEBELES = generateInitialKebeles();
// Helper to query and filter organization units
export const getRegions = (masterData, statusFilter, searchQuery) => {
    let list = masterData?.regions || INITIAL_REGIONS;
    if (statusFilter && statusFilter !== 'ALL') {
        list = list.filter(r => r.status === statusFilter);
    }
    if (searchQuery?.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(r => r.name.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q) ||
            r.localName.toLowerCase().includes(q));
    }
    return list;
};
export const getWoredasByRegion = (regionId, masterData, statusFilter, searchQuery) => {
    let list = (masterData?.woredas || INITIAL_WOREDAS).filter(w => w.regionId === regionId);
    if (statusFilter && statusFilter !== 'ALL') {
        list = list.filter(w => w.status === statusFilter);
    }
    if (searchQuery?.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(w => w.name.toLowerCase().includes(q) ||
            w.code.toLowerCase().includes(q) ||
            w.localName.toLowerCase().includes(q));
    }
    return list;
};
export const getKebelesByWoreda = (woredaId, masterData, statusFilter, searchQuery) => {
    let list = (masterData?.kebeles || INITIAL_KEBELES).filter(k => k.woredaId === woredaId);
    if (statusFilter && statusFilter !== 'ALL') {
        list = list.filter(k => k.status === statusFilter);
    }
    if (searchQuery?.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(k => k.name.toLowerCase().includes(q) ||
            k.code.toLowerCase().includes(q) ||
            k.localName.toLowerCase().includes(q));
    }
    return list;
};
// Check if an administrative unit is referenced by any business entity
export const checkOrgUnitUsage = (unitType, idOrCodeOrName, projects = [], contracts = [], users = []) => {
    const details = [];
    let usageCount = 0;
    const needle = idOrCodeOrName.trim().toLowerCase();
    if (unitType === 'REGION') {
        const matchingPrj = projects.filter(p => (p.region && p.region.toLowerCase().includes(needle)) ||
            (p.region && needle.includes(p.region.toLowerCase())));
        if (matchingPrj.length > 0) {
            usageCount += matchingPrj.length;
            details.push(`${matchingPrj.length} Project(s) configured under this Region`);
        }
    }
    else if (unitType === 'WOREDA') {
        const matchingPrj = projects.filter(p => (p.woreda && p.woreda.toLowerCase().includes(needle)) ||
            (p.woreda && needle.includes(p.woreda.toLowerCase())));
        if (matchingPrj.length > 0) {
            usageCount += matchingPrj.length;
            details.push(`${matchingPrj.length} Project(s) located in this Woreda`);
        }
        const matchingUsers = users.filter(u => (u.assignedZone && u.assignedZone.toLowerCase().includes(needle)));
        if (matchingUsers.length > 0) {
            usageCount += matchingUsers.length;
            details.push(`${matchingUsers.length} User(s) assigned to this district`);
        }
    }
    else if (unitType === 'KEBELE') {
        const matchingPrj = projects.filter(p => (p.kebele && p.kebele.toLowerCase().includes(needle)) ||
            (p.kebele && needle.includes(p.kebele.toLowerCase())));
        if (matchingPrj.length > 0) {
            usageCount += matchingPrj.length;
            details.push(`${matchingPrj.length} Project site(s) situated in this Kebele`);
        }
    }
    return {
        isUsed: usageCount > 0,
        usageCount,
        details
    };
};
export const buildHierarchyTree = (regions, woredas, kebeles) => {
    return regions.map(reg => {
        const childWoredas = woredas.filter(w => w.regionId === reg.id);
        return {
            id: reg.id,
            code: reg.code,
            name: reg.name,
            localName: reg.localName,
            type: 'REGION',
            status: reg.status,
            children: childWoredas.map(wor => {
                const childKebeles = kebeles.filter(k => k.woredaId === wor.id);
                return {
                    id: wor.id,
                    code: wor.code,
                    name: wor.name,
                    localName: wor.localName,
                    type: 'WOREDA',
                    status: wor.status,
                    children: childKebeles.map(keb => ({
                        id: keb.id,
                        code: keb.code,
                        name: keb.name,
                        localName: keb.localName,
                        type: 'KEBELE',
                        status: keb.status
                    }))
                };
            })
        };
    });
};
