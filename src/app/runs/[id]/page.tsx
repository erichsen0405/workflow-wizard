'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, Run } from '@/lib/models';
import {
	ACTIVE_PROJECT_EVENT,
	getActiveProject,
	loadProjects,
	loadRuns,
} from '@/lib/storage';

export default function RunDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const [run, setRun] = useState<Run | null>(null);
	const [projectName, setProjectName] = useState<string>('Ukendt');
	const [activeProject, setActiveProject] = useState<Project | null>(null);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		const allRuns = loadRuns();
		const found = allRuns.find((r) => r.id === params.id);
		setRun(found ?? null);
		if (found?.projectId) {
			const project = loadProjects().find((p) => p.id === found.projectId);
			setProjectName(project?.name ?? 'Slettet projekt');
		} else {
			setProjectName('Legacy run (ingen projekt)');
		}
	}, [params.id]);

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

	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// ignore
		}
	};

	if (!hydrated) {
		return <p className="rounded border bg-white p-4 text-sm text-slate-600">Indlæser run…</p>;
	}

	if (!activeProject) {
		return (
			<div className="space-y-4">
				<p className="rounded border bg-white p-4 text-sm text-slate-600">
					Vælg et aktivt projekt for at se runs.
				</p>
				<button onClick={() => router.push('/projects')} className="text-sm text-slate-900 underline">
					Gå til Projects
				</button>
			</div>
		);
	}

	if (!run) {
		return (
			<div className="space-y-4">
				<p className="rounded border bg-white p-4 text-sm text-red-600">Run ikke fundet.</p>
				<button onClick={() => router.push('/runs')} className="text-sm text-slate-900 underline">
					Tilbage til runs
				</button>
			</div>
		);
	}

	const mismatch = run.projectId && run.projectId !== activeProject.id;
	if (mismatch) {
		return (
			<div className="space-y-4">
				<p className="rounded border bg-white p-4 text-sm text-slate-700">
					Run tilhører projektet “{projectName}”. Skift aktivt projekt for at se detaljerne.
				</p>
				<div className="flex gap-3 text-sm">
					<button onClick={() => router.push('/runs')} className="text-slate-900 underline">
						Tilbage til runs
					</button>
					<button onClick={() => router.push('/projects')} className="text-slate-900 underline">
						Vælg projekt
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">{run.title}</h1>
					<p className="text-sm text-slate-600">
						{new Date(run.createdAt).toLocaleString()} · Projekt: {run.projectId ? projectName : `${projectName} (matches aktivt)`}
					</p>
				</div>
				<button onClick={() => router.push('/runs')} className="text-sm text-slate-900 underline">
					Tilbage
				</button>
			</header>

			<section className="rounded-lg bg-white p-4 shadow-sm space-y-2">
				<div className="flex items-center justify-between">
					<h2 className="font-semibold">Output</h2>
					<button onClick={() => copy(run.output)} className="text-sm text-slate-600 hover:text-slate-900">
						Copy output
					</button>
				</div>
				<pre className="whitespace-pre-wrap text-sm text-slate-800">{run.output}</pre>
			</section>

			<section className="rounded-lg bg-white p-4 shadow-sm space-y-2">
				<div className="flex items-center justify-between">
					<h2 className="font-semibold">✅ NÆSTE SKRIDT</h2>
					<button onClick={() => copy(run.nextSteps)} className="text-sm text-slate-600 hover:text-slate-900">
						Copy checklist
					</button>
				</div>
				<pre className="whitespace-pre-wrap text-sm text-slate-800">{run.nextSteps}</pre>
			</section>
		</div>
	);
}
