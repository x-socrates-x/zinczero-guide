import { all, one, run } from "./db";
import type { GuideSectionKey } from "../constants/guideSections";

export function ensureSectionsForAllGuides() {
  const guides = all<{ id: string }>(`SELECT id FROM guides;`);
  guides.forEach((g) => ensureDefaultSections(g.id));
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export type GuideSectionRow = {
  id: string;
  guide_id: string;
  key: GuideSectionKey;
  content_json: string;
  updated_at: number;
};

export function getSection(guideId: string, key: GuideSectionKey) {
  const row = one<GuideSectionRow>(
    `SELECT id, guide_id, key, content_json, updated_at
     FROM guide_sections
     WHERE guide_id = ? AND key = ?;`,
    [guideId, key]
  );

  if (!row) return null;

  let content: any = {};
  try {
    content = JSON.parse(row.content_json || "{}");
  } catch {
    content = {};
  }

  return {
    ...row,
    content,
  };
}

export function upsertSection(guideId: string, key: GuideSectionKey, content: any) {
  const now = Date.now();
  const content_json = JSON.stringify(content ?? {});

  // Use UNIQUE(guide_id, key) to upsert
  run(
    `INSERT INTO guide_sections (id, guide_id, key, content_json, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(guide_id, key)
     DO UPDATE SET content_json = excluded.content_json,
                   updated_at = excluded.updated_at;`,
    [id("sec"), guideId, key, content_json, now]
  );

  return true;
}

/**
 * Call this when a guide is created so every guide starts
 * with all template sections.
 */
export function ensureDefaultSections(guideId: string) {
  const now = Date.now();

  const defaults: Record<GuideSectionKey, any> = {
    overview: {
      whatBuilding:
        "Describe the solution in one clear paragraph. State what the system is, what it does, and the business outcome it supports.",
      whoFor: [
        { id: "wf1", text: "Primary user: ..." },
        { id: "wf2", text: "Secondary user: ..." },
        { id: "wf3", text: "Goal/context: ..." },
      ],
      acceptanceCriteria: [
        { id: "ac1", text: "The core user journey works from start to finish." },
        { id: "ac2", text: "The solution meets the required functional and non-functional requirements." },
        { id: "ac3", text: "Security basics are in place." },
        { id: "ac4", text: "The system is deployable and ready for hand-off." },
      ],
    },

    architecture: {
      techStack: {
        frontend: "State the frontend technology and why it fits this project.",
        backend: "State the backend technology and why it fits this project.",
        db: "State the database choice and why it fits the data model and scale.",
        auth: "State the authentication approach (e.g. sessions, JWT, OAuth).",
        hosting: "State where the frontend, backend, and database will be hosted.",
      },
      diagram: [
        { id: "dg1", text: "Client" },
        { id: "dg2", text: "Frontend" },
        { id: "dg3", text: "API" },
        { id: "dg4", text: "Database" },
        { id: "dg5", text: "External Services" },
      ],
      modules: [
        { id: "m1", text: "Frontend UI modules" },
        { id: "m2", text: "Backend API modules" },
        { id: "m3", text: "Database / persistence layer" },
        { id: "m4", text: "Auth / security services" },
        { id: "m5", text: "Third-party integrations" },
      ],
    },

    requirements: {
      functionalRequirements: [
        { id: "fr1", text: "As a [user], I want to [...], so that [...]" },
        { id: "fr2", text: "As an [admin], I want to [...], so that [...]" },
        { id: "fr3", text: "..." },
      ],
      nonFunctionalRequirements: [
        { id: "nfr1", text: "Security: Define auth, validation, data protection." },
        { id: "nfr2", text: "Performance: Define acceptable response times/load expectations." },
        { id: "nfr3", text: "Availability: Define uptime/reliability expectations." },
        { id: "nfr4", text: "Maintainability: Define code quality, modularity, documentation expectations." },
        { id: "nfr5", text: "Logging: Define what should be logged and monitored." },
        { id: "nfr6", text: "Compliance: Note GDPR or other legal/privacy considerations if relevant." },
      ],
      constraints: [
        { id: "c1", key: "Time", value: "State delivery deadline or target timeframe." },
        { id: "c2", key: "Budget", value: "State client budget or delivery constraints." },
        { id: "c3", key: "Hosting", value: "State platform/provider limits." },
        { id: "c4", key: "User scale", value: "Estimate users, traffic, and data growth." },
        { id: "c5", key: "Legal/compliance", value: "State any business or regulatory constraints." },
      ],
    },

    build_plan: {
      milestones: [
        { id: "ms1", text: "MVP: Define the minimum client-ready version." },
        { id: "ms2", text: "v1: Define the first full release." },
        { id: "ms3", text: "v1.1: Define the first improvement pass." },
      ],
      dependencies: [
        { id: "d1", text: "Client content" },
        { id: "d2", text: "Third-party APIs" },
        { id: "d3", text: "Access / credentials" },
        { id: "d4", text: "Domain / hosting" },
      ],
      risks: [
        { id: "r1", text: "Scope creep" },
        { id: "r2", text: "API instability" },
        { id: "r3", text: "Unclear requirements" },
        { id: "r4", text: "Tight deadlines" },
      ],
      mitigations: [
        { id: "mt1", text: "Agree scope before build starts." },
        { id: "mt2", text: "Validate external dependencies early." },
        { id: "mt3", text: "Review requirements regularly with the client." },
        { id: "mt4", text: "Plan delivery milestones clearly." },
      ],
    },

    security: {
      authStrategy:
        "State the authentication and authorization strategy. Explain whether this project uses sessions, JWT, OAuth, role-based access control, or another model, and why.",
      checklist: [
        { id: "sc1", text: "Validate all input on the server" },
        { id: "sc2", text: "Use password hashing for stored credentials" },
        { id: "sc3", text: "Apply authorization checks to protected actions" },
        { id: "sc4", text: "Configure CORS properly" },
        { id: "sc5", text: "Store secrets in environment variables" },
        { id: "sc6", text: "Avoid committing keys to the repository" },
        { id: "sc7", text: "Apply rate limiting where needed" },
        { id: "sc8", text: "Log security-relevant events" },
        { id: "sc9", text: "Review relevant OWASP risks" },
      ],
    },

    database: {
      erdNotes: [
        { id: "erd1", text: "List the main entities." },
        { id: "erd2", text: "Describe their relationships." },
        { id: "erd3", text: "State key attributes." },
        { id: "erd4", text: "State which objects own which data." },
      ],
      migrations: [
        { id: "mig1", text: "Explain how schema changes will be managed over time." },
        { id: "mig2", text: "Note migration order." },
        { id: "mig3", text: "Include rollback considerations." },
        { id: "mig4", text: "State deployment approach." },
      ],
      indexesConstraints: {
        columns: [
          { key: "entity", label: "Entity" },
          { key: "type", label: "Type" },
          { key: "details", label: "Details" },
        ],
        rows: [],
      },
      seedData: [
        { id: "sd1", text: "Default roles" },
        { id: "sd2", text: "Users" },
        { id: "sd3", text: "Demo content" },
        { id: "sd4", text: "Reference data / lookup values" },
      ],
      backupRestore: [
        { id: "br1", text: "Explain how the database will be backed up." },
        { id: "br2", text: "State where backups are stored." },
        { id: "br3", text: "Explain how restore would be performed if data is lost or corrupted." },
      ],
    },

    testing: {
      unit: [
        { id: "u1", text: "List the most important services to test." },
        { id: "u2", text: "List the most important utilities to test." },
        { id: "u3", text: "List the most important logic units to test." },
      ],
      api: [
        { id: "api1", text: "List the most important endpoints to verify." },
        { id: "api2", text: "Include success cases." },
        { id: "api3", text: "Include failure cases." },
        { id: "api4", text: "Include authorization checks." },
      ],
      smokeChecklist: [
        { id: "sm1", text: "App loads successfully" },
        { id: "sm2", text: "Authentication works" },
        { id: "sm3", text: "Core CRUD actions work" },
        { id: "sm4", text: "Validation errors display correctly" },
        { id: "sm5", text: "Protected routes are protected" },
        { id: "sm6", text: "Data persists correctly" },
        { id: "sm7", text: "No critical crashes during key user flows" },
      ],
      e2e: [
        { id: "e1", text: "Sign in" },
        { id: "e2", text: "Create record" },
        { id: "e3", text: "Edit record" },
        { id: "e4", text: "Delete record" },
        { id: "e5", text: "Sign out" },
      ],
    },

    deployment: {
      environments: [
        { id: "env1", text: "Development" },
        { id: "env2", text: "Staging" },
        { id: "env3", text: "Production" },
      ],
      steps: [
        { id: "dep1", text: "Deploy frontend" },
        { id: "dep2", text: "Deploy backend" },
        { id: "dep3", text: "Apply database migrations" },
        { id: "dep4", text: "Set environment variables" },
        { id: "dep5", text: "Configure domains" },
        { id: "dep6", text: "Run post-deploy verification" },
      ],
      cicd: [
        { id: "ci1", text: "Lint" },
        { id: "ci2", text: "Run tests" },
        { id: "ci3", text: "Build" },
        { id: "ci4", text: "Deploy" },
        { id: "ci5", text: "Run smoke checks" },
        { id: "ci6", text: "Monitor logs after release" },
      ],
      monitoring: [
        { id: "mon1", text: "Logs" },
        { id: "mon2", text: "Errors" },
        { id: "mon3", text: "Uptime" },
        { id: "mon4", text: "Critical business events" },
      ],
    },

    handoff: {
      adminHandover: [
        { id: "ah1", text: "Admin access details" },
        { id: "ah2", text: "Credentials" },
        { id: "ah3", text: "Sensitive setup information" },
        { id: "ah4", text: "Secure transfer method" },
      ],
      userGuide: [
        { id: "ug1", text: "Log in to the system" },
        { id: "ug2", text: "Use the main features" },
        { id: "ug3", text: "Complete common tasks" },
        { id: "ug4", text: "Log out safely" },
      ],
      maintenancePlan: [
        { id: "mp1", text: "State what support is included after delivery." },
        { id: "mp2", text: "State what counts as a bug fix." },
        { id: "mp3", text: "State what counts as a change request." },
      ],
      pricingTiers: {
        columns: [
          { key: "tier", label: "Tier" },
          { key: "price", label: "Price" },
          { key: "includes", label: "Includes" },
        ],
        rows: [],
      },
    },
  };
  
  (Object.keys(defaults) as GuideSectionKey[]).forEach((key) => {
    run(
      `INSERT INTO guide_sections (id, guide_id, key, content_json, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(guide_id, key) DO NOTHING;`,
      [id("sec"), guideId, key, JSON.stringify(defaults[key]), now]
    );
  });
}

export function listSectionsForGuide(guideId: string) {
  const rows = all<GuideSectionRow>(
    `SELECT id, guide_id, key, content_json, updated_at
     FROM guide_sections
     WHERE guide_id = ?
     ORDER BY key ASC;`,
    [guideId]
  );

  return rows.map((r) => {
    let content: any = {};
    try {
      content = JSON.parse(r.content_json || "{}");
    } catch {
      content = {};
    }
    return { ...r, content };
  });
}
