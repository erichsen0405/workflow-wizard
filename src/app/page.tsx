import Link from 'next/link';

const cards = [
	{ href: '/wizard', title: 'Wizard', body: 'Generér prompts + runs' },
	{ href: '/templates', title: 'Templates', body: 'Administrér felter og body' },
	{ href: '/runs', title: 'Runs', body: 'Historik + detaljer' },
];

export default function Home() {
	return (
		<section className="space-y-8">
			<div className="rounded-xl bg-white p-6 shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Workflow Wizard</p>
				<h1 className="mt-2 text-3xl font-semibold text-slate-900">Lokal-first workflow prompts</h1>
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
