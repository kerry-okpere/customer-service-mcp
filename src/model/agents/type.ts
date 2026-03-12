
export interface Agent {
    id: string;
    name: string;
    email: string;
    status: "available" | "busy" | "on_break";
    rating: number;
    specializations: string[];
    current_load: number;
    max_load: number;
    active_cases: string[];
    resolution_rate: number;
    avg_handle_time_minutes: number;
    csat_score: number;
    cases_resolved_today: number;
    tier_clearance: "Platinum" | "Gold" | "Silver";
    years_experience: number;
    avatar_color: string;
    avatar_initials: string;
    badge: string | null;
}

export interface Agents {
    agents: Agent[];
}