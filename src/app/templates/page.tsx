'use client';

import { useEffect, useMemo, useState } from 'react';
import { FieldDef, Template } from '@/lib/models';
import { loadTemplates, saveTemplates, seedDefaultsIfEmpty } from '@/lib/storage';

const newTemplate = (): Template => {
	const timestamp = new Date().toISOString();
	const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tpl_${timestamp}`;
	return {
		id,
		name: 'Ny template',
		description: '',
		fields: [],
		body: '',
		category: undefined,
		createdAt: timestamp,
		updatedAt: timestamp,
	};
};

export default function TemplatesPage() {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [selectedId, setSelectedId] = useState<string>('');
	const [draft, setDraft] = useState<Template | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		seedDefaultsIfEmpty();
		const data = loadTemplates();
		setTemplates(data);
		if (data.length) {
			setSelectedId(data[0].id);
			setDraft(structuredClone(data[0]));
		}
	}, []);

	useEffect(() => {
		if (!selectedId) return;
		const tmpl = templates.find((t) => t.id === selectedId);
		setDraft(tmpl ? structuredClone(tmpl) : null);
	}, [selectedId, templates]);

	const validationError = useMemo(() => {
		if (!draft) return 'Ingen template valgt';
		const seen = new Set<string>();
		for (const field of draft.fields) {
			const key = field.key.trim();
			if (!key) return 'Field keys må ikke være tomme';
			if (seen.has(key)) return 'Field keys skal være unikke';
			seen.add(key);
		}
		return null;
	}, [draft]);

	const updateField = (index: number, partial: Partial<FieldDef>) => {
		if (!draft) return;
		const fields = draft.fields.map((field, idx) => (idx === index ? { ...field, ...partial } : field));
		setDraft({ ...draft, fields });
	};

	const addField = () => {
		if (!draft) return;
		setDraft({
			...draft,
			fields: [
				...draft.fields,
				{ key: `field_${draft.fields.length + 1}`, label: 'Label', type: 'text' },
			],
		});
	};

	const removeField = (index: number) => {
		if (!draft) return;
		setDraft({
			...draft,
			fields: draft.fields.filter((_, idx) => idx !== index),
		});
	};

	const handleSave = () => {
		if (!draft) return;
		if (validationError) {
			setError(validationError);
			return;
		}
		setError(null);
		const updated: Template = {
			...draft,
			updatedAt: new Date().toISOString(),
		};
		const next = templates.some((t) => t.id === updated.id)
			? templates.map((t) => (t.id === updated.id ? updated : t))
			: [updated, ...templates];
		setTemplates(next);
		saveTemplates(next);
		setSelectedId(updated.id);
	};

	const createTemplate = () => {
		const tpl = newTemplate();
		setTemplates([tpl, ...templates]);
		setSelectedId(tpl.id);
		setDraft(tpl);
	};

	const deleteTemplate = () => {
		if (!draft) return;
		if (!confirm('Slet template?')) return;
		const next = templates.filter((t) => t.id !== draft.id);
		setTemplates(next);
		saveTemplates(next);
		if (next.length) {
			setSelectedId(next[0].id);
		} else {
			setSelectedId('');
			setDraft(null);
		}
	};

	return (
		<div className="space-y-6">
			<header className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Templates</h1>
				<button onClick={createTemplate} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
					Create template
				</button>
			</header>

			<div className="grid gap-6 lg:grid-cols-[200px,1fr]">
				<ul className="space-y-2">
					{templates.map((tpl) => (
						<li key={tpl.id}>
							<button
								onClick={() => setSelectedId(tpl.id)}
								className={`w-full rounded border px-3 py-2 text-left text-sm ${
									tpl.id === selectedId ? 'border-slate-900 bg-white font-semibold' : 'bg-slate-100'
								}`}
							>
								{tpl.name}
							</button>
						</li>
					))}
				</ul>

				{draft ? (
					<section className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
						{error && <p className="text-sm text-red-600">{error}</p>}
						<label className="block text-sm font-semibold">
							Name
							<input
								value={draft.name}
								onChange={(e) => setDraft({ ...draft, name: e.target.value })}
								className="mt-1 w-full rounded border p-2"
							/>
						</label>
						<label className="block text-sm font-semibold">
							Description
							<input
								value={draft.description}
								onChange={(e) => setDraft({ ...draft, description: e.target.value })}
								className="mt-1 w-full rounded border p-2"
							/>
						</label>
						<label className="block text-sm font-semibold">
							Body
							<textarea
								value={draft.body}
								onChange={(e) => setDraft({ ...draft, body: e.target.value })}
								className="mt-1 w-full rounded border p-2"
								rows={8}
							/>
						</label>
						<label className="block text-sm font-semibold">
							Category
							<select
								value={draft.category ?? ''}
								onChange={(e) =>
									setDraft({
										...draft,
										category: (e.target.value || undefined) as Template['category'],
									})
								}
								className="mt-1 w-full rounded border p-2"
							>
								<option value="">Ingen</option>
								<option value="bug">Bug</option>
								<option value="feature">Feature</option>
								<option value="enhancement">Enhancement</option>
								<option value="ui">UI</option>
							</select>
						</label>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<h2 className="text-sm font-semibold">Fields</h2>
								<button onClick={addField} className="text-sm text-slate-600 hover:text-slate-900">
									Add field
								</button>
							</div>
							{draft.fields.map((field, index) => (
								<div key={field.key} className="rounded border p-3 text-sm">
									<div className="grid gap-2 sm:grid-cols-2">
										<label>
											Key
											<input
												value={field.key}
												onChange={(e) => updateField(index, { key: e.target.value })}
												className="mt-1 w-full rounded border p-1"
											/>
										</label>
										<label>
											Label
											<input
												value={field.label}
												onChange={(e) => updateField(index, { label: e.target.value })}
												className="mt-1 w-full rounded border p-1"
											/>
										</label>
									</div>
									<div className="mt-2 grid gap-2 sm:grid-cols-3">
										<label>
											Type
											<select
												value={field.type}
												onChange={(e) => updateField(index, { type: e.target.value as FieldDef['type'] })}
												className="mt-1 w-full rounded border p-1"
											>
												<option value="text">Text</option>
												<option value="textarea">Textarea</option>
												<option value="select">Select</option>
											</select>
										</label>
										<label className="flex items-center gap-2 text-sm">
											<input
												type="checkbox"
												checked={field.required ?? false}
												onChange={(e) => updateField(index, { required: e.target.checked })}
											/>
											Required
										</label>
										{field.type === 'select' && (
											<label className="sm:col-span-3">
												Options (kommasepareret)
												<input
													value={field.options?.join(',') ?? ''}
													onChange={(e) =>
														updateField(index, {
															options: e.target.value
																.split(',')
																.map((val) => val.trim())
																.filter(Boolean),
														})
													}
													className="mt-1 w-full rounded border p-1"
												/>
											</label>
										)}
									</div>
									<button
										onClick={() => removeField(index)}
										className="mt-2 text-xs text-red-600 hover:text-red-800"
									>
										Remove
									</button>
								</div>
							))}
						</div>

						<div className="flex gap-2">
							<button onClick={handleSave} className="rounded bg-emerald-600 px-4 py-2 text-white">
								Save template
							</button>
							<button onClick={deleteTemplate} className="rounded border border-red-200 px-4 py-2 text-red-600">
								Delete
							</button>
						</div>
					</section>
				) : (
					<p className="rounded border bg-white p-4 text-sm text-slate-600">Vælg eller opret en template.</p>
				)}
			</div>
		</div>
	);
}
