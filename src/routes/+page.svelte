<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { writable } from 'svelte/store';

	// Types
	interface GitHubEvent {
		type: string;
		repo: {
			name: string;
		};
		created_at: string;
		payload: any;
	}

	interface Project {
		name: string;
		url: string;
		description: string;
		stars: number;
		language: string;
		topics: string[];
		updatedAt: string;
	}

	// Stores for better state management
	const activities = writable<GitHubEvent[]>([]);
	const projects = writable<Project[]>([]);
	const loading = writable({
		activities: true,
		projects: true
	});
	const error = writable({
		activities: null,
		projects: null
	});

	// Constants
	const GITHUB_USERNAME = 'BastianAsmussen';
	const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
	const skills = ['Rust', 'C#', 'Linux', 'Nix', 'Docker'];
	let currentSection = 'about';

	// Utility functions
	const fetchWithCache = async (key: string, fetcher: () => Promise<any>) => {
		const cached = localStorage.getItem(key);
		if (cached) {
			const { data, timestamp } = JSON.parse(cached);
			if (Date.now() - timestamp < CACHE_DURATION) {
				return data;
			}
		}

		const data = await fetcher();
		localStorage.setItem(
			key,
			JSON.stringify({
				data,
				timestamp: Date.now()
			})
		);
		return data;
	};

	function formatEventMessage(event: GitHubEvent): { text: string; url: string } {
		const repoUrl = `https://github.com/${event.repo.name}`;

		const formatters = {
			PushEvent: () => ({
				text: `Pushed ${event.payload.size} commit${event.payload.size > 1 ? 's' : ''} to ${
					event.repo.name
				}`,
				url: `${repoUrl}/commit/${event.payload.commits[0].sha}`
			}),
			CreateEvent: () => ({
				text: `Created ${event.payload.ref_type} ${event.payload.ref || ''} in ${event.repo.name}`,
				url: event.payload.ref_type === 'branch' ? `${repoUrl}/tree/${event.payload.ref}` : repoUrl
			}),
			IssuesEvent: () => ({
				text: `${event.payload.action} issue in ${event.repo.name}`,
				url: event.payload.issue.html_url
			}),
			PullRequestEvent: () => ({
				text: `${event.payload.action} pull request in ${event.repo.name}`,
				url: event.payload.pull_request.html_url
			})
		};

		return (
			formatters[event.type]?.() || {
				text: `${event.type} in ${event.repo.name}`,
				url: repoUrl
			}
		);
	}

	function timeAgo(date: string): string {
		const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
		const intervals = {
			year: 31536000,
			month: 2592000,
			week: 604800,
			day: 86400,
			hour: 3600,
			minute: 60,
			second: 1
		};

		for (const [unit, secondsInUnit] of Object.entries(intervals)) {
			const interval = Math.floor(seconds / secondsInUnit);
			if (interval >= 1) {
				return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
			}
		}
		return 'just now';
	}

	// Data fetching
	async function fetchGitHubActivities() {
		loading.update((l) => ({ ...l, activities: true }));
		try {
			const data = await fetchWithCache(`github-activities-${GITHUB_USERNAME}`, async () => {
				const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events`);
				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
				return response.json();
			});
			activities.set(data.slice(0, 5));
			error.update((e) => ({ ...e, activities: null }));
		} catch (err) {
			console.error('Failed to fetch GitHub activities:', err);
			error.update((e) => ({ ...e, activities: 'Failed to load GitHub activities' }));
		} finally {
			loading.update((l) => ({ ...l, activities: false }));
		}
	}

	async function fetchGitHubProjects() {
		loading.update((l) => ({ ...l, projects: true }));
		try {
			const data = await fetchWithCache(`github-projects-${GITHUB_USERNAME}`, async () => {
				const response = await fetch(
					`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
				);
				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
				return response.json();
			});

			projects.set(
				data.map((repo) => ({
					name: repo.name,
					url: repo.html_url,
					description: repo.description,
					stars: repo.stargazers_count,
					language: repo.language,
					topics: repo.topics || [],
					updatedAt: repo.updated_at
				}))
			);
			error.update((e) => ({ ...e, projects: null }));
		} catch (err) {
			console.error('Failed to fetch GitHub projects:', err);
			error.update((e) => ({ ...e, projects: 'Failed to load GitHub projects' }));
		} finally {
			loading.update((l) => ({ ...l, projects: false }));
		}
	}

	onMount(() => {
		fetchGitHubActivities();
		fetchGitHubProjects();
	});
</script>

<svelte:head>
	<title>Bastian Asmussen | Developer</title>
	<meta
		name="description"
		content="Personal website of Bastian Asmussen, a passionate developer from Denmark."
	/>
	<meta name="keywords" content="Bastian Asmussen, Developer, Rust, C#, Linux, Nix, Docker" />
</svelte:head>

<div class="min-h-screen w-full bg-base flex items-center justify-center p-4">
	<div class="container max-w-4xl mx-auto">
		<div class="flex flex-col md:flex-row gap-20">
			<div class="md:w-48 md:sticky md:top-4 shrink-0">
				<nav class="flex md:flex-col gap-6 text-lg font-mono justify-center md:justify-start">
					<button
						class="text-blue hover:text-sapphire transition-colors text-left relative group"
						class:text-sapphire={currentSection === 'about'}
						on:click={() => (currentSection = 'about')}
					>
						~/about
						{#if currentSection === 'about'}
							<span class="absolute -left-4 top-1/2 -translate-y-1/2 text-green">●</span>
						{/if}
					</button>
					<button
						class="text-blue hover:text-sapphire transition-colors text-left relative group"
						class:text-sapphire={currentSection === 'projects'}
						on:click={() => (currentSection = 'projects')}
					>
						~/projects
						{#if currentSection === 'projects'}
							<span class="absolute -left-4 top-1/2 -translate-y-1/2 text-green">●</span>
						{/if}
					</button>
					<a
						href="https://github.com/BastianAsmussen"
						class="text-blue hover:text-sapphire transition-colors"
						target="_blank"
						rel="noopener noreferrer"
					>
						~/github
					</a>
				</nav>
			</div>

			<div class="flex-1">
				<div class="mb-12">
					<h1 class="text-4xl font-bold text-text mb-2">Bastian Asmussen</h1>
					<div class="flex items-center gap-2">
						<span class="text-overlay0 font-mono">0x0FE5A355DBC92568</span>
					</div>
				</div>

				{#if currentSection === 'about'}
					<div class="space-y-8" in:fade={{ duration: 300 }}>
						<!-- About Section -->
						<section aria-label="About Me">
							<div class="flex items-center gap-2 mb-4 font-mono">
								<span class="text-green">$</span>
								<span class="text-text">cat about.md</span>
							</div>
							<p class="text-text leading-relaxed font-mono">
								Hi! I'm a passionate developer from Denmark who loves working with Linux and
								open-source technologies. Currently focusing on web development and system
								administration while studying Computer Science. I enjoy building modern, accessible
								web applications and exploring new technologies.
							</p>
						</section>

						<section aria-label="Skills">
							<div class="flex items-center gap-2 mb-4 font-mono">
								<span class="text-green">$</span>
								<span class="text-text">ls ~/skills</span>
							</div>
							<div class="flex flex-wrap gap-3">
								{#each skills as skill}
									<span
										class="font-mono bg-surface0 text-text px-3 py-1 rounded
                             transform transition-all duration-200 hover:bg-surface1 hover:translate-y-[-2px]"
									>
										{skill}
									</span>
								{/each}
							</div>
						</section>

						<section aria-label="Recent GitHub Activity">
							<div class="flex items-center gap-2 mb-4 font-mono">
								<span class="text-green">$</span>
								<span class="text-text">git log --pretty=format:'%h %s' -n 5</span>
							</div>

							{#if $loading.activities}
								<div class="space-y-2">
									{#each Array(3) as _}
										<div
											class="animate-pulse bg-surface0 p-3 rounded h-12 opacity-50"
											aria-hidden="true"
										/>
									{/each}
								</div>
							{:else if $error.activities}
								<div class="text-red p-3 rounded font-mono">
									{$error.activities}
									<button
										class="text-blue hover:text-sapphire ml-2 underline"
										on:click={fetchGitHubActivities}
									>
										Retry
									</button>
								</div>
							{:else if $activities.length === 0}
								<div class="text-text font-mono">No recent activity</div>
							{:else}
								<div class="space-y-2">
									{#each $activities as activity}
										{@const eventInfo = formatEventMessage(activity)}
										<a
											href={eventInfo.url}
											target="_blank"
											rel="noopener noreferrer"
											class="block bg-surface0 p-3 rounded font-mono text-sm
                             transform transition-all duration-200 hover:bg-surface1 hover:translate-y-[-2px]"
										>
											<div class="flex justify-between items-start">
												<span class="text-text">{eventInfo.text}</span>
												<span class="text-subtext0 text-xs">{timeAgo(activity.created_at)}</span>
											</div>
										</a>
									{/each}
								</div>
							{/if}
						</section>
					</div>
				{:else if currentSection === 'projects'}
					<div class="space-y-8" in:fade={{ duration: 300 }}>
						<section aria-label="Projects">
							<div class="flex items-center gap-2 mb-4 font-mono">
								<span class="text-green" aria-hidden="true">$</span>
								<span class="text-text">ls ~/projects</span>
							</div>

							{#if $loading.projects}
								<div class="space-y-4">
									{#each Array(3) as _}
										<div
											class="animate-pulse bg-surface0 p-4 rounded-lg opacity-50"
											aria-hidden="true"
										>
											<div class="h-6 bg-surface1 rounded w-1/3 mb-4"></div>
											<div class="h-4 bg-surface1 rounded w-3/4"></div>
										</div>
									{/each}
								</div>
							{:else if $error.projects}
								<div class="text-red-500 font-mono p-4 bg-surface0 rounded-lg">
									<p>{$error.projects}</p>
									<button
										class="mt-2 text-blue hover:text-sapphire underline"
										on:click={fetchGitHubProjects}
									>
										Retry loading projects
									</button>
								</div>
							{:else if $projects.length === 0}
								<div class="text-text font-mono p-4 bg-surface0 rounded-lg">No projects found.</div>
							{:else}
								<div class="grid grid-cols-1 gap-4">
									{#each $projects as project (project.name)}
										<a
											href={project.url}
											target="_blank"
											rel="noopener noreferrer"
											class="block bg-surface0 p-4 rounded-lg hover:bg-surface1
                            transform transition-all duration-200 hover:scale-[1.01]"
										>
											<div class="flex justify-between items-start">
												<h3 class="text-text font-bold font-mono">{project.name}</h3>
												{#if project.stars > 0}
													<span class="text-yellow flex items-center gap-1">
														<span class="text-xs" aria-label="stars">★</span>
														{project.stars}
													</span>
												{/if}
											</div>

											{#if project.description}
												<p class="text-subtext0 mt-2 font-mono">{project.description}</p>
											{/if}

											<div class="flex flex-wrap gap-2 mt-3">
												{#if project.language}
													<span class="text-xs bg-surface2 text-text px-2 py-1 rounded font-mono">
														{project.language}
													</span>
												{/if}

												{#each project.topics as topic}
													<span class="text-xs bg-surface2 text-text px-2 py-1 rounded font-mono">
														{topic}
													</span>
												{/each}
											</div>

											<div class="mt-3 text-xs text-overlay0 font-mono">
												Updated {timeAgo(project.updatedAt)}
											</div>
										</a>
									{/each}
								</div>
							{/if}
						</section>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
