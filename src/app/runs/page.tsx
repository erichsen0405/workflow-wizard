'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Project, Run, Template } from '@/lib/models';
import {
	ACTIVE_PROJECT_EVENT,
	getActiveProject,
	loadProjects,
	loadRuns,
	loadTemplates,
} from '@/lib/storage';

export default function RunsPage() {
	const [runs, setRuns] = useState<Run[]>([]);
	const [templates, setTemplates] = useState<Record<string, Template>>({});
  	const [projects, setProjects] = useState<Record<string, Project>>({});
	const [activeProject, setActiveProject] = useState<Project | null>(null);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setRuns(loadRuns().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
		setTemplates(Object.fromEntries(loadTemplates().map((t) => [t.id, t])));
		setProjects(Object.fromEntries(loadProjects().map((p) => [p.id, p])));
	}, []);

	useEffect(() => {
		const update = () => {
			setActiveProject(getActiveProject());
			setHydrated(true);
		};
		update();
		if (typeof window !== 'undefined') {
			window.addEventListener(ACTIVE_PROJECT_EVENT, update);
		}
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener(ACTIVE_PROJECT_EVENT, update);
			}
		};
	}, []);

	const visibleRuns = useMemo(() => {
		if (!activeProject) return [];
		return runs.filter((run) => !run.projectId || run.projectId === activeProject.id);
	}, [runs, activeProject]);

	const copyOutput = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// ignore
		}
	};

	if (!hydrated) {
		return <div className="rounded border bg-white p-4 text-sm text-slate-600">Indlæser runs…</div>;
	}

	if (!activeProject) {
		return (
			<div className="space-y-3 rounded border bg-white p-4 text-sm text-slate-700">
				<p>Vælg eller opret et projekt for at se runs.</p>
				<Link href="/projects" className="inline-flex rounded bg-slate-900 px-3 py-1 text-white">
					Gå til Projects
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<header className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Runs · {activeProject.name}</h1>
				<p className="text-sm text-slate-600">Nyeste først</p>
			</header>

			{visibleRuns.length === 0 ? (
				<p className="rounded border bg-white p-4 text-sm text-slate-600">
					Ingen runs for {activeProject.name} endnu.
				</p>
			) : (
				<div className="space-y-3">
					{visibleRuns.map((run) => {
						const projectLabel = run.projectId
							? projects[run.projectId]?.name ?? 'Slettet projekt'
							: 'Legacy run (ingen projekt)';
						return (
							<div key={run.id} className="rounded-lg border bg-white p-4 shadow-sm">
								<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<h2 className="text-lg font-semibold">{run.title}</h2>
										<p className="text-sm text-slate-600">
											Template: {templates[run.templateId]?.name ?? 'Ukendt'} ·{' '}
											{new Date(run.createdAt).toLocaleString()}
										</p>
										<p className="text-xs text-slate-500">Projekt: {projectLabel}</p>
									</div>
									<div className="flex gap-2 text-sm">
										<Link href={`/runs/${run.id}`} className="text-slate-900 underline">
											Detaljer
										</Link>
										<button onClick={() => copyOutput(run.output)} className="text-slate-600 hover:text-slate-900">
											Copy output
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
