'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Project, Run, Template } from '@/lib/models';
import { loadProjects, loadRuns, loadTemplates } from '@/lib/storage';

export default function RunsPage() {
	const [runs, setRuns] = useState<Run[]>([]);
	const [templates, setTemplates] = useState<Record<string, Template>>({});
	const [projects, setProjects] = useState<Record<string, Project>>({});

	useEffect(() => {
		setRuns(loadRuns().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
		const tmplLookup = Object.fromEntries(loadTemplates().map((t) => [t.id, t]));
		const projectLookup = Object.fromEntries(loadProjects().map((p) => [p.id, p]));
		setTemplates(tmplLookup);
		setProjects(projectLookup);
	}, []);

	const copyOutput = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// ignore
		}
	};

	return (
		<div className="space-y-4">
			<header className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Runs</h1>
				<p className="text-sm text-slate-600">Nyeste først</p>
			</header>

			{runs.length === 0 ? (
				<p className="rounded border bg-white p-4 text-sm text-slate-600">Ingen runs endnu.</p>
			) : (
				<div className="space-y-3">
					{runs.map((run) => (
						<div key={run.id} className="rounded-lg border bg-white p-4 shadow-sm">
							<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<h2 className="text-lg font-semibold">{run.title}</h2>
									<p className="text-sm text-slate-600">
										Template: {templates[run.templateId]?.name ?? 'Ukendt'} ·{' '}
										{new Date(run.createdAt).toLocaleString()}
									</p>
									<p className="text-xs text-slate-500">
										Projekt:{' '}
										{run.projectId ? projects[run.projectId]?.name ?? 'Slettet projekt' : 'Ingen valgt'}
									</p>
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
					))}
				</div>
			)}
		</div>
	);
}
