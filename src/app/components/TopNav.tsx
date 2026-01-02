import Link from 'next/link';

const links = [
	{ href: '/', label: 'Dashboard' },
	{ href: '/wizard', label: 'Wizard' },
	{ href: '/templates', label: 'Templates' },
	{ href: '/runs', label: 'Runs' },
];

export function TopNav() {
	return (
		<header className="border-b bg-white">
			<nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
				<Link href="/" className="text-lg font-semibold text-slate-900">
					Workflow Wizard
				</Link>
				<div className="flex gap-4 text-sm font-medium text-slate-600">
					{links.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="rounded px-2 py-1 hover:bg-slate-100"
						>
							{link.label}
						</Link>
					))}
				</div>
			</nav>
		</header>
	);
}
