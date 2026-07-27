import type { Batch, DashboardStats, Tender } from "./types";

// Helper to generate dates
function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
}

const today = new Date();

// Mock tender data - Tunisian public tender context
export const mockTenders: Tender[] = [
  {
    id: 1,
    batchId: 1,
    bidNum: "APP-2025-001",
    bidMasterNum: "MASTER-2025-001",
    bidNameFr: "Appel d'offre pour rénovation de route municipale",
    bidNameEn: "Call for Tender - Municipal Road Renovation",
    bidNameAr: null,
    scrapedData: {
      source: "tunisie-appels-offres.gov.tn",
      scraped_date: "2025-01-15",
      raw_content: "...",
    },
    status: "needs_more_data",
    datePublished: "2025-01-10",
    finalSubmissionDate: addDays(today, 3),
    institution: "Municipalité de Tunis",
    generalInfo: {
      budget_estimated: "150 000 TND",
      duration_months: "6",
      location: "Tunis Centre",
      contact_email: "appels@tunis.gov.tn",
    },
    lotsInfo: {
      lot_1: {
        description: "Préparation et terrassement",
        quantity: "5 km",
        unit_price: "10000 TND/km",
      },
      lot_2: {
        description: "Asphalte et finition",
        quantity: "5 km",
        unit_price: "20000 TND/km",
      },
    },
    llmMergedObject: {
      project_type: "Infrastructure",
      estimated_total: "150000 TND",
      key_requirements: [
        "Road resurfacing",
        "Traffic management",
        "Environmental compliance",
      ],
    },
    llmSummary:
      "Municipal road renovation project in central Tunis spanning 5km. Estimated budget 150,000 TND. Requires phased approach for traffic management.",
    proposalAiGenerated: null,
    proposalFinal: null,
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-15T14:30:00Z",
  },
  {
    id: 2,
    batchId: 1,
    bidNum: "APP-2025-002",
    bidMasterNum: "MASTER-2025-002",
    bidNameFr: "Appel d'offre pour équipement informatique",
    bidNameEn: "Call for Tender - IT Equipment Supply",
    bidNameAr: null,
    scrapedData: {
      source: "tunisie-appels-offres.gov.tn",
      scraped_date: "2025-01-15",
      raw_content: "...",
    },
    status: "accepted",
    datePublished: "2025-01-12",
    finalSubmissionDate: addDays(today, 8),
    institution: "Ministère de l'Éducation",
    generalInfo: {
      budget_estimated: "500 000 TND",
      duration_months: "3",
      location: "Tunis",
      contact_phone: "+216 71 123 456",
    },
    lotsInfo: {
      computers: {
        quantity: "100 units",
        specifications: "Intel i7, 16GB RAM, 512GB SSD",
        unit_price: "2000 TND",
      },
      peripherals: {
        quantity: "100 sets",
        specifications: "Keyboard, mouse, monitor",
        unit_price: "500 TND",
      },
    },
    llmMergedObject: {
      project_type: "Technology",
      estimated_total: "250000 TND",
      timeline: "2-3 months",
      key_requirements: [
        "Warranty 3 years",
        "Local supplier preferred",
        "Standard IT configuration",
      ],
    },
    llmSummary:
      "Supply of 100 complete computer workstations with peripherals for Ministry of Education. Budget 500,000 TND. Preference for local suppliers with 3-year warranty.",
    proposalAiGenerated:
      "We propose supplying 100 high-performance workstations meeting all specifications...",
    proposalFinal:
      "We propose supplying 100 high-performance workstations meeting all specifications. Our company has 15 years of experience in IT procurement and maintains local inventory for rapid deployment.",
    createdAt: "2025-01-12T09:30:00Z",
    updatedAt: "2025-01-15T11:20:00Z",
  },
  {
    id: 3,
    batchId: 1,
    bidNum: "APP-2025-003",
    bidMasterNum: "MASTER-2025-003",
    bidNameFr: "Appel d'offre pour services de nettoyage",
    bidNameEn: "Call for Tender - Cleaning Services",
    bidNameAr: null,
    scrapedData: {
      source: "tunisie-appels-offres.gov.tn",
      scraped_date: "2025-01-16",
      raw_content: "...",
    },
    status: "rejected",
    datePublished: "2025-01-14",
    finalSubmissionDate: addDays(today, 5),
    institution: "Hôpital Central de Tunis",
    generalInfo: {
      budget_estimated: "50 000 TND",
      duration_months: "12",
      location: "Tunis",
      contact_person: "Dr. Hmida Ben Ali",
    },
    lotsInfo: {
      daily_cleaning: {
        frequency: "7 days/week",
        area_sqm: "15000",
        rate_daily: "150 TND",
      },
      specialized_cleaning: {
        frequency: "Monthly",
        services: "Carpet cleaning, window cleaning, sanitization",
        rate_monthly: "2000 TND",
      },
    },
    llmMergedObject: {
      project_type: "Services",
      estimated_total: "50000 TND",
      requirements: "Medical-grade cleaning protocols",
      staffing: "10-15 personnel required",
    },
    llmSummary:
      "Hospital cleaning services contract for 15,000 sqm facility. 12-month duration with daily and specialized monthly cleaning. Budget 50,000 TND. Requires medical-grade sanitization protocols.",
    proposalAiGenerated: null,
    proposalFinal: null,
    createdAt: "2025-01-14T13:15:00Z",
    updatedAt: "2025-01-16T09:00:00Z",
  },
  {
    id: 4,
    batchId: 1,
    bidNum: "APP-2025-004",
    bidMasterNum: "MASTER-2025-004",
    bidNameFr: "Appel d'offre pour formation professionnelle",
    bidNameEn: "Call for Tender - Vocational Training Program",
    bidNameAr: null,
    scrapedData: {
      source: "tunisie-appels-offres.gov.tn",
      scraped_date: "2025-01-16",
      raw_content: "...",
    },
    status: "needs_more_data",
    datePublished: "2025-01-15",
    finalSubmissionDate: addDays(today, 2),
    institution: "ONEC - Office National de l'Emploi et des Compétences",
    generalInfo: {
      budget_estimated: "200 000 TND",
      duration_months: "6",
      location: "Sousse",
      target_participants: "200 trainees",
    },
    lotsInfo: {
      digital_skills: {
        course_duration_hours: "120",
        participant_count: "100",
        cost_per_person: "500 TND",
      },
      business_skills: {
        course_duration_hours: "80",
        participant_count: "100",
        cost_per_person: "300 TND",
      },
    },
    llmMergedObject: {
      project_type: "Education/Training",
      total_participants: "200",
      estimated_budget: "200000 TND",
      focus_areas: [
        "Digital transformation",
        "Business management",
        "Industry 4.0",
      ],
    },
    llmSummary:
      "Vocational training program for 200 participants covering digital skills and business management. 6-month program in Sousse. Budget 200,000 TND. Accredited trainer certification required.",
    proposalAiGenerated: null,
    proposalFinal: null,
    createdAt: "2025-01-15T16:45:00Z",
    updatedAt: "2025-01-16T10:30:00Z",
  },
  {
    id: 5,
    batchId: 2,
    bidNum: "APP-2025-005",
    bidMasterNum: "MASTER-2025-005",
    bidNameFr: "Appel d'offre pour construction d'école",
    bidNameEn: "Call for Tender - School Construction",
    bidNameAr: null,
    scrapedData: {
      source: "tunisie-appels-offres.gov.tn",
      scraped_date: "2025-01-17",
      raw_content: "...",
    },
    status: "accepted",
    datePublished: "2025-01-16",
    finalSubmissionDate: addDays(today, 10),
    institution: "Ministère de l'Éducation",
    generalInfo: {
      budget_estimated: "1 000 000 TND",
      duration_months: "18",
      location: "Sfax",
      capacity_students: "500",
    },
    lotsInfo: {
      civil_works: {
        area_sqm: "8000",
        cost_estimate: "600 000 TND",
        timeline_months: "12",
      },
      equipment_furnishing: {
        description: "Classroom furniture, labs, library",
        cost_estimate: "300 000 TND",
      },
    },
    llmMergedObject: {
      project_type: "Infrastructure",
      scope: "New school complex for 500 students",
      estimated_total: "1000000 TND",
      key_phases: [
        "Site preparation",
        "Construction",
        "Equipment installation",
        "Handover",
      ],
    },
    llmSummary:
      "Construction of new 500-student capacity school in Sfax. 18-month project. Budget 1,000,000 TND. Includes civil works and equipment procurement. Environmental and accessibility standards compliance required.",
    proposalAiGenerated:
      "Our company proposes a comprehensive approach to school construction...",
    proposalFinal: null,
    createdAt: "2025-01-16T12:00:00Z",
    updatedAt: "2025-01-17T08:30:00Z",
  },
];

// Mock batch data
export const mockBatches: Batch[] = [
  {
    id: 1,
    runNumber: 42,
    tendersFoundCount: 5,
    runDate: new Date().toISOString().split("T")[0],
    targetDate: addDays(today, 7),
  },
  {
    id: 2,
    runNumber: 41,
    tendersFoundCount: 12,
    runDate: addDays(today, -1),
    targetDate: addDays(today, 6),
  },
  {
    id: 3,
    runNumber: 40,
    tendersFoundCount: 8,
    runDate: addDays(today, -2),
    targetDate: addDays(today, 5),
  },
];

// Helper functions
export function getTenderById(id: number | string): Tender | undefined {
  const numId = typeof id === "string" ? parseInt(id.split("-")[1] || "0") : id;
  return mockTenders.find((t) => t.id === numId);
}

export function getAllTenders(): Tender[] {
  return mockTenders;
}

export function filterTenders(
  status?: string,
  institution?: string,
  dateRange?: { from: Date; to: Date },
): Tender[] {
  return mockTenders.filter((tender) => {
    if (status && tender.status !== status) return false;
    if (institution && tender.institution !== institution) return false;
    if (dateRange && tender.finalSubmissionDate) {
      const deadline = new Date(tender.finalSubmissionDate);
      if (deadline < dateRange.from || deadline > dateRange.to) return false;
    }
    return true;
  });
}

export function getDistinctInstitutions(): string[] {
  const institutions = new Set(
    mockTenders
      .map((t) => t.institution)
      .filter((i): i is string => i !== null && i !== undefined),
  );
  return Array.from(institutions).sort();
}

export function getDashboardStats(): DashboardStats {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const needsMoreDataCount = mockTenders.filter(
    (t) => t.status === "needs_more_data",
  ).length;
  const acceptedCount = mockTenders.filter(
    (t) => t.status === "accepted",
  ).length;
  const dueWithin7Days = mockTenders.filter((t) => {
    if (!t.finalSubmissionDate) return false;
    const deadline = new Date(t.finalSubmissionDate);
    return deadline >= now && deadline <= sevenDaysFromNow;
  }).length;

  return {
    totalTenders: mockTenders.length,
    needsMoreDataCount,
    dueWithin7Days,
    acceptedCount,
  };
}

export function getLatestBatch(): Batch | undefined {
  return mockBatches[0];
}

export function getAllBatches(): Batch[] {
  return mockBatches;
}
