import { WeeklyWorkPlan, WeeklyProgressReport, User, Project, RoleDefinition, Role } from '../types';
import { canUserAccessProject } from './accessControlService';

const PLANS_STORAGE_KEY = 'oweb_weekly_work_plans';
const REPORTS_STORAGE_KEY = 'oweb_weekly_progress_reports';

export const INITIAL_WEEKLY_PLANS: WeeklyWorkPlan[] = [
  {
    id: 'WP-2025-W34-001',
    projectId: 'OWEB-WAT-2025-0001',
    projectName: 'Shashamane Town Water Expansion',
    zone: 'West Arsi',
    woreda: 'Shashamane',
    kebele: 'Kebele 03',
    weekNumber: 34,
    startDate: '2025-08-18',
    endDate: '2025-08-24',
    preparedByUserId: 'testuser',
    preparedByName: 'Tolasa Bekele',
    preparedDate: '2025-08-17T09:00:00Z',
    targetPhysicalProgressPct: 5.5,
    plannedActivities: [
      {
        id: 'act-1',
        activityName: 'Trench excavation for DN250 HDPE transmission main (Ch 4+200 to 6+700)',
        woreda: 'Shashamane',
        kebele: 'Kebele 03',
        unit: 'meters',
        plannedQuantity: 2500,
        actualQuantity: 2200,
        weightPct: 35,
        assignedTo: 'Oromia Water Works Construction Enterprise',
        status: 'In Progress'
      },
      {
        id: 'act-2',
        activityName: 'Sand bedding and pipe laying for DN250 pipe',
        woreda: 'Shashamane',
        kebele: 'Kebele 03',
        unit: 'meters',
        plannedQuantity: 2000,
        actualQuantity: 1850,
        weightPct: 30,
        assignedTo: 'Subcontractor - Pipe Squad',
        status: 'In Progress'
      },
      {
        id: 'act-3',
        activityName: 'Sectional hydrostatic pressure test on 1.5km finished section',
        woreda: 'Shashamane',
        kebele: 'Kebele 03',
        unit: 'bar/km',
        plannedQuantity: 1.5,
        actualQuantity: 1.5,
        weightPct: 20,
        assignedTo: 'Resident Engineer & Quality Team',
        status: 'Completed'
      },
      {
        id: 'act-4',
        activityName: 'Reinforced concrete casting for Booster Pump Station slab',
        woreda: 'Shashamane',
        kebele: 'Kebele 03',
        unit: 'm3',
        plannedQuantity: 45,
        actualQuantity: 40,
        weightPct: 15,
        assignedTo: 'Civil Structural Team',
        status: 'In Progress'
      }
    ],
    resourcePlan: {
      manpowerCount: 38,
      equipmentOnSite: ['1x CAT 320 Excavator', '1x Wheel Loader', '2x Tipper Trucks', '1x 500L Concrete Mixer'],
      materialsRequired: '250 bags OPC Cement, 12 rolls HDPE DN250, 45m3 Coarse Aggregate'
    },
    weatherForecastNotes: 'Clear sky predicted with occasional afternoon shower. Adequate trench drainage provided.',
    status: 'Approved',
    approvedBy: 'Eng. Hawi Kebede (Supervisor)',
    approvalDate: '2025-08-17T16:30:00Z',
    approvalRemarks: 'Plan approved. Prioritize pressure test verification before backfilling.'
  },
  {
    id: 'WP-2025-W34-002',
    projectId: 'OWEB-WAT-2025-0002',
    projectName: 'Jimma Solar Water Pump',
    zone: 'Jimma',
    woreda: 'Goma',
    kebele: 'Kebele 10',
    weekNumber: 34,
    startDate: '2025-08-18',
    endDate: '2025-08-24',
    preparedByUserId: 'engineer_dawit',
    preparedByName: 'Eng. Dawit Alemu',
    preparedDate: '2025-08-17T11:00:00Z',
    targetPhysicalProgressPct: 8.0,
    plannedActivities: [
      {
        id: 'act-201',
        activityName: 'Ground-mount galvanised steel support structure erection for 24kW PV array',
        woreda: 'Goma',
        kebele: 'Kebele 10',
        unit: 'structures',
        plannedQuantity: 16,
        actualQuantity: 16,
        weightPct: 40,
        assignedTo: 'Solar Engineering Subcontractor',
        status: 'Completed'
      },
      {
        id: 'act-202',
        activityName: 'Mounting and string wiring for 60x 400W Mono-PERC solar modules',
        woreda: 'Goma',
        kebele: 'Kebele 10',
        unit: 'modules',
        plannedQuantity: 60,
        actualQuantity: 52,
        weightPct: 35,
        assignedTo: 'Electro-mechanical Squad',
        status: 'In Progress'
      },
      {
        id: 'act-203',
        activityName: 'Lightning protection and earth pit resistance measurement (<5 ohms)',
        woreda: 'Goma',
        kebele: 'Kebele 10',
        unit: 'pits',
        plannedQuantity: 3,
        actualQuantity: 3,
        weightPct: 25,
        assignedTo: 'Electrical Lead',
        status: 'Completed'
      }
    ],
    resourcePlan: {
      manpowerCount: 14,
      equipmentOnSite: ['1x Mobile Generator 10kVA', 'Torque Wrenches', 'Earth Tester Megger', 'PV Multimeter'],
      materialsRequired: 'Copper tape 25x3mm, Earth rods, MC4 connectors, 4mm2 solar cables'
    },
    weatherForecastNotes: 'Favorable sunshine index. Optimal testing condition for solar irradiance.',
    status: 'Approved',
    approvedBy: 'Eng. Tigist Mengistu (Team Leader)',
    approvalDate: '2025-08-17T14:15:00Z',
    approvalRemarks: 'Verify string inverter DC disconnection switch before full solar energization.'
  },
  {
    id: 'WP-2025-W34-003',
    projectId: 'OWEB-SAN-2024-0015',
    projectName: 'Bale Zone Waste Management',
    zone: 'Bale',
    woreda: 'Goba',
    kebele: 'Kebele 01',
    weekNumber: 34,
    startDate: '2025-08-18',
    endDate: '2025-08-24',
    preparedByUserId: 'supervisor',
    preparedByName: 'Eng. Hawi Kebede',
    preparedDate: '2025-08-16T14:00:00Z',
    targetPhysicalProgressPct: 6.0,
    plannedActivities: [
      {
        id: 'act-301',
        activityName: 'Geomembrane 1.5mm HDPE liner extrusion welding and non-destructive spark test',
        woreda: 'Goba',
        kebele: 'Kebele 01',
        unit: 'm2',
        plannedQuantity: 1200,
        actualQuantity: 1050,
        weightPct: 50,
        assignedTo: 'Specialist Geosynthetics Team',
        status: 'In Progress'
      },
      {
        id: 'act-302',
        activityName: 'Perforated HDPE leachate collector pipe installation and gravel pack',
        woreda: 'Goba',
        kebele: 'Kebele 01',
        unit: 'meters',
        plannedQuantity: 350,
        actualQuantity: 300,
        weightPct: 50,
        assignedTo: 'Civil Works Team',
        status: 'In Progress'
      }
    ],
    resourcePlan: {
      manpowerCount: 22,
      equipmentOnSite: ['Wedge Welder', 'Extrusion Gun', 'Tensiometer', 'Vacuum Box Test Rig'],
      materialsRequired: '1.5mm HDPE Roll, Non-woven Geotextile 300g/m2, Washed River Gravel'
    },
    weatherForecastNotes: 'Intermittent mountain fog and rain showers. Welding pauses during wet periods.',
    status: 'Submitted',
    approvedBy: undefined,
    approvalDate: undefined,
    approvalRemarks: undefined
  }
];

export const INITIAL_WEEKLY_REPORTS: WeeklyProgressReport[] = [
  {
    id: 'REP-2025-W34-001',
    projectId: 'OWEB-WAT-2025-0001',
    projectName: 'Shashamane Town Water Expansion',
    weeklyPlanId: 'WP-2025-W34-001',
    weekNumber: 34,
    reportDate: '2025-08-24T17:00:00Z',
    submittedByUserId: 'testuser',
    submittedByName: 'Tolasa Bekele (Lead Engineer)',
    previousPhysicalProgressPct: 68.2,
    thisWeekPhysicalProgressPct: 5.1,
    cumulativePhysicalProgressPct: 73.3,
    plannedProgressPct: 73.7,
    progressVariancePct: -0.4,
    status: 'Endorsed',
    endorsedByTeamLeader: 'Eng. Tigist Mengistu',
    approvedBySupervisor: 'Eng. Hawi Kebede',
    approvalRemarks: 'Quality verification completed on site. Hydrostatic test witnessed and certified.',
    siteLaborCount: 42,
    weatherConditions: 'Favorable',
    keyAccomplishments: [
      'Successfully laid 2,200m of DN250 transmission pipeline across Woreda 03 corridor',
      'Completed 1.5km sectional hydrostatic pressure test at 12 bars with zero pressure drop over 2 hours',
      'Poured foundation concrete for booster pump station (40m3 C-25 mix)'
    ],
    challengesBottlenecks: [
      'Subsurface hard basalt rock encountered between chainage 5+800 and 6+100 requiring hydraulic hammer',
      'Traffic detour required at Shashamane Hawassa main junction'
    ],
    correctiveActions: [
      'Deployed additional tracked breaker attachment to maintain trenching rate',
      'Coordinated with Shashamane Woreda Traffic Police for nighttime road crossing'
    ],
    sitePhotosCount: 6
  },
  {
    id: 'REP-2025-W34-002',
    projectId: 'OWEB-WAT-2025-0002',
    projectName: 'Jimma Solar Water Pump',
    weeklyPlanId: 'WP-2025-W34-002',
    weekNumber: 34,
    reportDate: '2025-08-24T16:30:00Z',
    submittedByUserId: 'engineer_dawit',
    submittedByName: 'Eng. Dawit Alemu (Lead Engineer)',
    previousPhysicalProgressPct: 42.0,
    thisWeekPhysicalProgressPct: 8.5,
    cumulativePhysicalProgressPct: 50.5,
    plannedProgressPct: 50.0,
    progressVariancePct: 0.5,
    status: 'Approved',
    endorsedByTeamLeader: 'Eng. Tigist Mengistu',
    approvedBySupervisor: 'Eng. Solomon Tadesse',
    approvalRemarks: 'Ahead of schedule. Solar field mounting aligns with technical specifications.',
    siteLaborCount: 16,
    weatherConditions: 'Favorable',
    keyAccomplishments: [
      'Mounted and grounded all 16 steel support structures',
      'Fastened 52 out of 60 solar panels with anti-theft security hardware',
      'Earth pit test showed 3.8 ohms (well below the 5.0 ohm maximum threshold)'
    ],
    challengesBottlenecks: [
      'Minor delay waiting for special UV-rated conduit fittings from Addis Ababa hub'
    ],
    correctiveActions: [
      'Procured interim stock from Jimma regional warehouse to maintain pace'
    ],
    sitePhotosCount: 4
  },
  {
    id: 'REP-2025-W34-003',
    projectId: 'OWEB-SAN-2024-0015',
    projectName: 'Bale Zone Waste Management',
    weeklyPlanId: 'WP-2025-W34-003',
    weekNumber: 34,
    reportDate: '2025-08-24T18:00:00Z',
    submittedByUserId: 'supervisor',
    submittedByName: 'Eng. Hawi Kebede (Supervising Engineer)',
    previousPhysicalProgressPct: 52.0,
    thisWeekPhysicalProgressPct: 4.8,
    cumulativePhysicalProgressPct: 56.8,
    plannedProgressPct: 58.0,
    progressVariancePct: -1.2,
    status: 'Submitted',
    endorsedByTeamLeader: undefined,
    approvedBySupervisor: undefined,
    approvalRemarks: undefined,
    siteLaborCount: 25,
    weatherConditions: 'Intermittent Rain',
    keyAccomplishments: [
      'Completed extrusion seam welding for 1,050m2 of HDPE liner',
      'Installed 300m of perforated leachate collector pipes with geotextile wrap'
    ],
    challengesBottlenecks: [
      'Heavy afternoon rain showers saturated slopes causing 1.5 days downtime'
    ],
    correctiveActions: [
      'Installed protective tarpaulins over unseamed joints and arranged weekend compensatory shift'
    ],
    sitePhotosCount: 5
  }
];

export const loadWeeklyPlans = (): WeeklyWorkPlan[] => {
  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load weekly plans from localStorage:', e);
  }
  return INITIAL_WEEKLY_PLANS;
};

export const saveWeeklyPlans = (plans: WeeklyWorkPlan[]): void => {
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error('Failed to save weekly plans to localStorage:', e);
  }
};

export const loadWeeklyReports = (): WeeklyProgressReport[] => {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load weekly reports from localStorage:', e);
  }
  return INITIAL_WEEKLY_REPORTS;
};

export const saveWeeklyReports = (reports: WeeklyProgressReport[]): void => {
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save weekly reports to localStorage:', e);
  }
};

export const filterWeeklyPlansByScope = (
  plans: WeeklyWorkPlan[],
  user: User | null | undefined,
  projects: Project[],
  customRoles: RoleDefinition[] = []
): WeeklyWorkPlan[] => {
  if (!user || !plans || !Array.isArray(plans)) return [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  return plans.filter(plan => {
    // If user prepared it directly
    if (plan.preparedByUserId === user.id || plan.preparedByUserId === user.username) {
      return true;
    }
    const targetProject = safeProjects.find(p => p && p.id === plan.projectId);
    if (!targetProject) {
      return user.role === Role.ADMIN || user.role === Role.DIRECTOR || user.role === Role.COORDINATOR;
    }
    return canUserAccessProject(user, targetProject, customRoles);
  });
};

export const filterWeeklyReportsByScope = (
  reports: WeeklyProgressReport[],
  user: User | null | undefined,
  projects: Project[],
  customRoles: RoleDefinition[] = []
): WeeklyProgressReport[] => {
  if (!user || !reports || !Array.isArray(reports)) return [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  return reports.filter(report => {
    if (report.submittedByUserId === user.id || report.submittedByUserId === user.username) {
      return true;
    }
    const targetProject = safeProjects.find(p => p && p.id === report.projectId);
    if (!targetProject) {
      return user.role === Role.ADMIN || user.role === Role.DIRECTOR || user.role === Role.COORDINATOR;
    }
    return canUserAccessProject(user, targetProject, customRoles);
  });
};
