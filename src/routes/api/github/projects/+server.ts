import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Project } from '$lib/types';

const CACHE_TIME = 3600;
let cache = {
	data: null as Project[] | null,
	timestamp: 0
};

export const GET: RequestHandler = async () => {
	if (cache.data && Date.now() - cache.timestamp < CACHE_TIME * 1000) {
		return new Response(JSON.stringify(cache.data));
	}

	try {
		const response = await fetch('https://api.github.com/users/BastianAsmussen/repos', {
			headers: {
				Accept: 'application/vnd.github.v3+json'
			}
		});

		if (!response.ok) throw new Error('Failed to fetch');

		const repos = await response.json();

		const projects = repos
			.filter((repo: any) => !repo.fork && !repo.private)
			.map((repo: any) => ({
				name: repo.name,
				description: repo.description || '',
				url: repo.html_url,
				stars: repo.stargazers_count,
				language: repo.language,
				topics: repo.topics || []
			}));

		cache = {
			data: projects,
			timestamp: Date.now()
		};

		return new Response(JSON.stringify(projects));
	} catch (err) {
		throw error(500, 'Failed to fetch GitHub projects');
	}
};
