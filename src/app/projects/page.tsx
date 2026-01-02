'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Project } from '@/lib/models';
import {
	ACTIVE_PROJECT_EVENT,
	createLocalId,
	loadActiveProjectId,
	loadProjects,
	saveActiveProjectId,
	saveProjects,
} from '@/lib/storage';

export default function ProjectsPage() {
	const router = useRouter();
	const [projects, setProjects] = useState<Project[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [name, setName] = useState('');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setProjects(loadProjects());
		setActiveId(loadActiveProjectId());
		const sync = () => setActiveId(loadActiveProjectId());
		if (typeof window !== 'undefined') {
			window.addEventListener(ACTIVE_PROJECT_EVENT, sync);
		}
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener(ACTIVE_PROJECT_EVENT, sync);
			}
		};
	}, []);

	const refresh = (next: Project[]) => {
		setProjects(next);
		saveProjects(next);
	};

	const handleCreate = () => {
		const trimmed = name.trim();
		if (!trimmed) {
			setError('Navn påkrævet');
			return;
		}
		setError(null);
		const now = new Date().toISOString();
		const project: Project = { id: createLocalId(), name: trimmed, createdAt: now, updatedAt: now };
		const next = [project, ...projects];
		refresh(next);
		saveActiveProjectId(project.id);
		setName('');
		router.push('/');
	};

	const handleSelect = (project: Project) => {
		saveActiveProjectId(project.id);
		router.push('/');
	};

	const handleDelete = (project: Project) => {
		if (!confirm(`Slet projekt "${project.name}"?`)) return;
		const next = projects.filter((p) => p.id !== project.id);
		refresh(next);
		if (activeId === project.id) {
			saveActiveProjectId(null);
			setActiveId(null);
		}
	};

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h1 className="text-2xl font-semibold">Projects</h1>
				<p className="text-sm text-slate-600">Vælg et aktivt projekt før du bruger wizard eller templates.</p>
			</header>

			<section className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
				<label className="text-sm font-semibold text-slate-700">
					Projekt-navn
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="mt-1 w-full rounded border px-2 py-1 text-sm"
						placeholder="fx: Webplatform v2"
					/>
				</label>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<button onClick={handleCreate} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
					Opret nyt projekt
				</button>
			</section>

			<section className="space-y-3">
				<h2 className="text-sm font-semibold text-slate-700">Eksisterende projekter</h2>
				{projects.length === 0 ? (
					<p className="rounded border bg-white p-4 text-sm text-slate-600">Ingen projekter endnu.</p>
				) : (
					<ul className="space-y-3">
						{projects.map((project) => {
							const isActive = activeId === project.id;
							return (
								<li key={project.id} className="rounded-lg border bg-white p-4 shadow-sm">
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<p className="text-sm font-semibold text-slate-900">{project.name}</p>
											<p className="text-xs text-slate-500">
												Oprettet {new Date(project.createdAt).toLocaleDateString()}
												{isActive ? ' · Aktivt projekt' : null}
											</p>
										</div>
										<div className="flex gap-2 text-sm">
											<button
												onClick={() => handleSelect(project)}
												className={`rounded px-3 py-1 ${
													isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
												}`}
											>
												{isActive ? 'Allerede aktiv' : 'Sæt aktivt'}
											</button>
											<button
												onClick={() => handleDelete(project)}
												className="rounded px-3 py-1 text-red-600 hover:bg-red-50"
											>
												Slet
											</button>
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</section>
		</div>
	);
}
