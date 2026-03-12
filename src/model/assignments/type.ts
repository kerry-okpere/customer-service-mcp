export interface Assignment {
    id: string;
    customer_id: string;
    agent_id: string;
    assigned_at: string; // ISO date string
    reason: string; // Explanation of why this agent was assigned to this customer
    score_breakdown: {
        agent_rating_score: number; // Score based on agent's rating (e.g., out of 50)
        specialization_match_score: number; // Score based on how well the agent's specializations match the customer's issue (e.g., out of 30)
        availability_score: number; // Score based on the agent's current load and availability (e.g., out of 20)
        tier_clearance_score: number; // Score based on the agent's tier clearance relative to the customer's tier (e.g., out of 10)
        total: number; // Total score used for assignment decision
    };
    status: "active" | "resolved" | "escalated";
    resolved_at: string | null; // ISO date string or null if not resolved
}

export interface Assignments {
    assignments: Assignment[];
}