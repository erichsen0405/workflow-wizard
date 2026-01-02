'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Project } from '@/lib/models';
import { ACTIVE_PROJECT_EVENT, getActiveProject } from '@/lib/storage';

const links = [
	{ href: '/', label: 'Dashboard' },
	{ href: '/wizard', label: 'Wizard' },
	{ href: '/templates', label: 'Templates' },
	{ href: '/runs', label: 'Runs' },
	{ href: '/projects', label: 'Projects' },
];

export function TopNav() {
	const router = useRouter();
	const [activeProject, setActiveProject] = useState<Project | null>(null);
	const [command, setCommand] = useState('');

	useEffect(() => {
		const update = () => setActiveProject(getActiveProject());
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

	const handleCommand = (value: string) => {
		const normalized = value.trim().toLowerCase();
		if (!normalized) return;
		if (normalized === 'start ny prompt') {
			router.push('/wizard');
			setCommand('');
		} else if (normalized === 'start nyt projekt') {
			router.push('/projects');
			setCommand('');
		}
	};

	return (
		<header className="border-b bg-white">
			<nav className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
				<Link href="/" className="text-lg font-semibold text-slate-900">
					Workflow Wizard
				</Link>
				<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
					<div className="flex gap-3 text-sm font-medium text-slate-600">
						{links.map((link) => (
							<Link key={link.href} href={link.href} className="rounded px-2 py-1 hover:bg-slate-100">
								{link.label}
							</Link>
						))}
					</div>
					<div className="flex items-center gap-3">
						<span className="text-xs text-slate-500">
							Projekt:{' '}
							<span className="font-semibold text-slate-900">{activeProject?.name ?? 'No project selected'}</span>
						</span>
						<input
							value={command}
							onChange={(e) => setCommand(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleCommand(command)}
							placeholder="Command… (fx: start ny prompt)"
							className="w-56 rounded border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
						/>
					</div>
				</div>
			</nav>
		</header>
	);
}
