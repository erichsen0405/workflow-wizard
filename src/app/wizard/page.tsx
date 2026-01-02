'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NEXT_STEPS_CHECKLIST, Project, Run, Template } from '@/lib/models';
import { renderTemplate } from '@/lib/render';
import { parsePastedSpec, WizardKind } from '@/lib/parse';
import {
	ACTIVE_PROJECT_EVENT,
	getActiveProject,
	loadRuns,
	loadTemplates,
	saveRuns,
	seedDefaultsIfEmpty,
} from '@/lib/storage';

const typeOptions: { label: string; value: WizardKind }[] = [
	{ label: 'Bug', value: 'bug' },
	{ label: 'Feature', value: 'feature' },
	{ label: 'Enhancement', value: 'enhancement' },
	{ label: 'UI design update', value: 'ui' },
];

const createId = () => {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return `run_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export default function WizardPage() {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [selectedId, setSelectedId] = useState<string>('');
	const [values, setValues] = useState<Record<string, string>>({});
	const [title, setTitle] = useState('');
	const [output, setOutput] = useState('');
	const [status, setStatus] = useState<string | null>(null);
	const [activeProject, setActiveProject] = useState<Project | null>(null);
	const [wizardKind, setWizardKind] = useState<WizardKind>('bug');
	const [pastedText, setPastedText] = useState('');
	const kindRef = useRef<WizardKind | null>(null);

	const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedId), [templates, selectedId]);

	useEffect(() => {
		seedDefaultsIfEmpty();
		const data = loadTemplates();
		setTemplates(data);
		if (data.length) {
			setSelectedId(data[0].id);
		}
	}, []);

	useEffect(() => {
		if (!templates.length) return;
		if (kindRef.current === wizardKind && selectedId) return;
		const match = templates.find((tpl) => (tpl.category ?? 'feature') === wizardKind);
		if (match) {
			setSelectedId(match.id);
		} else if (!selectedId && templates[0]) {
			setSelectedId(templates[0].id);
		}
		kindRef.current = wizardKind;
	}, [wizardKind, templates, selectedId]);

	useEffect(() => {
		if (!selectedTemplate) return;
		setValues((prev) => {
			const next: Record<string, string> = {};
			selectedTemplate.fields.forEach((field) => {
				next[field.key] = prev[field.key] ?? '';
			});
			setOutput(renderTemplate(selectedTemplate.body, next));
			return next;
		});
		setTitle(`${selectedTemplate.name} – ${new Date().toLocaleDateString()}`);
	}, [selectedTemplate]);

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

	const handleParse = () => {
		if (!selectedTemplate) {
			setStatus('Vælg template før parse');
			return;
		}
		if (!pastedText.trim()) {
			setStatus('Indsæt tekst til parsing');
			return;
		}
		const parsed = parsePastedSpec(wizardKind, pastedText);
		const allowedKeys = new Set(selectedTemplate.fields.map((f) => f.key));
		const next = { ...values };
		let changed = false;

		Object.entries(parsed).forEach(([key, value]) => {
			if (!value) return;
			if (key === 'title') setTitle(value);
			if (allowedKeys.has(key)) {
				next[key] = value;
				changed = true;
			}
		});

		if (!changed && !parsed.title) {
			setStatus('Ingen matchende felter fundet');
			return;
		}

		setValues(next);
		setOutput(renderTemplate(selectedTemplate.body, next));
		setStatus('Felter udfyldt – dobbelttjek efter parse');
	};

	const handleValueChange = (key: string, val: string) => {
		const next = { ...values, [key]: val };
		setValues(next);
		if (selectedTemplate) {
			setOutput(renderTemplate(selectedTemplate.body, next));
		}
	};

	const handleGenerate = () => {
		if (selectedTemplate) {
			setOutput(renderTemplate(selectedTemplate.body, values));
			setStatus('Output opdateret');
		}
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setStatus('Kopieret!');
		} catch {
			setStatus('Kunne ikke kopiere');
		}
	};

	const handleSaveRun = () => {
		if (!selectedTemplate || !activeProject) {
			setStatus('Vælg projekt + template');
			return;
		}
		const generated = output || renderTemplate(selectedTemplate.body, values);
		const now = new Date().toISOString();
		const newRun: Run = {
			id: createId(),
			projectId: activeProject.id,
			templateId: selectedTemplate.id,
			title: title || `${selectedTemplate.name} – ${new Date().toLocaleString()}`,
			values,
			output: generated,
			nextSteps: NEXT_STEPS_CHECKLIST,
			createdAt: now,
		};
		const runs = loadRuns();
		saveRuns([newRun, ...runs]);
		setStatus('Run gemt ✅');
	};

	if (!activeProject) {
		return (
			<div className="rounded-lg border bg-white p-6 text-sm text-slate-700">
				Vælg eller opret et projekt under{' '}
				<Link href="/projects" className="font-semibold text-slate-900 underline">
					Projects
				</Link>{' '}
				for at bruge wizard.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<header className="rounded-lg bg-white p-4 shadow-sm">
				<h1 className="text-2xl font-semibold">Workflow Wizard</h1>
				<p className="text-sm text-slate-600">
					Aktivt projekt: <span className="font-semibold">{activeProject.name}</span>
				</p>
				{status && <p className="mt-2 text-sm text-emerald-600">{status}</p>}
			</header>

			<div className="grid gap-6 lg:grid-cols-2">
				<section className="rounded-lg bg-white p-4 shadow-sm space-y-4">
					<div className="space-y-4">
						<label className="block text-sm font-semibold">
							Type
							<select
								value={wizardKind}
								onChange={(e) => setWizardKind(e.target.value as WizardKind)}
								className="mt-1 w-full rounded border p-2"
							>
								{typeOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</label>

						<label className="block text-sm font-semibold">
							Paste specs
							<textarea
								value={pastedText}
								onChange={(e) => setPastedText(e.target.value)}
								rows={4}
								className="mt-1 w-full rounded border p-2"
								placeholder="Indsæt bug/feature beskrivelse her"
							/>
							<p className="mt-1 text-xs text-slate-500">Best effort parsing – tjek felter efter parse.</p>
						</label>

						<button onClick={handleParse} className="rounded bg-slate-900 px-4 py-2 text-white">
							Parse &amp; udfyld
						</button>
					</div>

					<div>
						<label className="block text-sm font-semibold">Template</label>
						<select
							value={selectedId}
							onChange={(e) => setSelectedId(e.target.value)}
							className="mt-1 w-full rounded border p-2"
						>
							{templates.map((tpl) => (
								<option key={tpl.id} value={tpl.id}>
									{tpl.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-semibold">Run title</label>
						<input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="mt-1 w-full rounded border p-2"
						/>
					</div>

					<div className="space-y-4">
						{selectedTemplate?.fields.map((field) => (
							<div key={field.key}>
								<label className="block text-sm font-semibold">
									{field.label}
									{field.required && <span className="text-red-500"> *</span>}
								</label>
								{field.type === 'textarea' ? (
									<textarea
										value={values[field.key] ?? ''}
										onChange={(e) => handleValueChange(field.key, e.target.value)}
										className="mt-1 w-full rounded border p-2"
										rows={3}
									/>
								) : field.type === 'select' ? (
									<select
										value={values[field.key] ?? ''}
										onChange={(e) => handleValueChange(field.key, e.target.value)}
										className="mt-1 w-full rounded border p-2"
									>
										<option value="">Vælg...</option>
										{field.options?.map((opt) => (
											<option key={opt} value={opt}>
												{opt}
											</option>
										))}
									</select>
								) : (
									<input
										value={values[field.key] ?? ''}
										onChange={(e) => handleValueChange(field.key, e.target.value)}
										className="mt-1 w-full rounded border p-2"
									/>
								)}
							</div>
						))}
					</div>

					<div className="flex gap-2">
						<button onClick={handleGenerate} className="rounded bg-slate-900 px-4 py-2 text-white">
							Generate
						</button>
						<button onClick={handleSaveRun} className="rounded bg-emerald-600 px-4 py-2 text-white">
							Save run
						</button>
					</div>
				</section>

				<section className="space-y-4">
					<div className="rounded-lg bg-white p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<h2 className="font-semibold">Prompt output</h2>
							<button
								onClick={() => copyToClipboard(output)}
								className="text-sm text-slate-600 hover:text-slate-900"
							>
								Copy prompt
							</button>
						</div>
						<pre className="mt-2 max-h-80 overflow-auto rounded bg-slate-100 p-3 text-sm whitespace-pre-wrap">
							{output}
						</pre>
					</div>

					<div className="rounded-lg bg-white p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<h2 className="font-semibold">✅ NÆSTE SKRIDT</h2>
							<button
								onClick={() => copyToClipboard(NEXT_STEPS_CHECKLIST)}
								className="text-sm text-slate-600 hover:text-slate-900"
							>
								Copy checklist
							</button>
						</div>
						<pre className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{NEXT_STEPS_CHECKLIST}</pre>
					</div>
				</section>
			</div>
		</div>
	);
}
