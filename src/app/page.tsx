'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Project } from '@/lib/models';
import { ACTIVE_PROJECT_EVENT, getActiveProject } from '@/lib/storage';

const cards = [
	{ href: '/wizard', title: 'Wizard', body: 'Generér prompts + runs' },
	{ href: '/templates', title: 'Templates', body: 'Administrér felter og body' },
	{ href: '/runs', title: 'Runs', body: 'Historik + detaljer' },
];

export default function Home() {
	const [activeProject, setActiveProject] = useState<Project | null>(null);
	const [hydrated, setHydrated] = useState(false);

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

	if (!hydrated) {
		return <section className="rounded-xl bg-white p-6 shadow-sm text-sm text-slate-600">Indlæser dashboard…</section>;
	}

	if (!activeProject) {
		return (
			<section className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
				<h1 className="text-2xl font-semibold text-slate-900">Vælg eller opret projekt</h1>
				<p className="text-sm text-slate-600">
					Du skal vælge et aktivt projekt, før dashboardet og wizard er tilgængelige.
				</p>
				<Link href="/projects" className="inline-flex items-center rounded bg-slate-900 px-4 py-2 text-sm text-white">
					Gå til Projects
				</Link>
			</section>
		);
	}

	return (
		<section className="space-y-8">
			<div className="rounded-xl bg-white p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Workflow Wizard</p>
				<h1 className="mt-2 text-3xl font-semibold text-slate-900">Lokal-first workflow prompts</h1>
				<p className="mt-1 text-sm text-slate-500">
					Aktivt projekt: <span className="font-semibold text-slate-900">{activeProject.name}</span>
				</p>
				<p className="mt-3 text-sm text-slate-600">
					Byg standardiserede prompts, gem runs og hold styr på næste skridt direkte i browseren.
				</p>
				<p className="mt-5 text-sm font-medium text-emerald-700">
					Commit message forslag:{' '}
					<span className="font-semibold">mvp: add workflow wizard templates + runs (localStorage)</span>
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				{cards.map((card) => (
					<Link
						key={card.href}
						href={card.href}
						className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-400"
					>
						<h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
						<p className="mt-2 text-sm text-slate-600">{card.body}</p>
					</Link>
				))}
			</div>

			<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
				Hurtig guide: Start i Wizard for at oprette et run, ret templates efter behov, og find historik under Runs.
			</div>
		</section>
	);
}
