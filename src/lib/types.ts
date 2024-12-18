export interface GitHubEvent {
	type: string;
	repo: {
		name: string;
	};
	created_at: string;
	payload: any;
}

export interface Project {
	name: string;
	description: string;
	url: string;
	stars: number;
	language: string;
	topics: string[];
	updatedAt: string;
}

// Add this new interface here
export interface GroupedEvent {
	repo: string;
	commits: number;
	url: string;
	timestamp: string;
	text?: string;
	type?: string;
	payload?: any;
}

export interface Skill {
	name: string;
	yearsOfExperience: number;
}
