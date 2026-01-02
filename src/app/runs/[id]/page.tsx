'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Run } from '@/lib/models';
import { loadRuns } from '@/lib/storage';

export default function RunDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const [run, setRun] = useState<Run | null>(null);

	useEffect(() => {
		const found = loadRuns().find((r) => r.id === params.id);
		setRun(found ?? null);
	}, [params.id]);

	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// ignore
		}
	};

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

	return (
		<div className="space-y-4">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">{run.title}</h1>
					<p className="text-sm text-slate-600">{new Date(run.createdAt).toLocaleString()}</p>
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
