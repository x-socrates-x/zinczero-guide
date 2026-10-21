export const GUIDE_SECTIONS_KEYS = [
    "overview",
    "architecture",
    "requirements",
    "build_plan",
    "security",
    "database",
    "testing",
    "deployment",
    "handoff",
] as const;

export type GuideSectionKey = (typeof GUIDE_SECTIONS_KEYS)[number];