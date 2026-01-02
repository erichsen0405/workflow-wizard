import { FieldDef, Run, Template } from './models';

const STORAGE_KEYS = {
	templates: 'ww_templates_v1',
	runs: 'ww_runs_v1',
};

const hasWindow = typeof window !== 'undefined';

const safeJSONParse = <T>(raw: string | null, fallback: T): T => {
	if (!raw) return fallback;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
};

const getStore = () => (hasWindow ? window.localStorage : null);

const generateId = () => {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const defaultField = (overrides: Partial<FieldDef>): FieldDef => ({
	key: '',
	label: '',
	type: 'text',
	required: false,
	options: [],
	...overrides,
});

const createDefaultTemplates = (): Template[] => {
	const timestamp = new Date().toISOString();
	return [
		{
			id: generateId(),
			name: 'Bug fix (standard)',
			description: 'Standard bugfix prompt',
			fields: [
				defaultField({ key: 'bugId', label: 'Bug ID', required: true }),
				defaultField({ key: 'title', label: 'Title', required: true }),
				defaultField({ key: 'goal', label: 'Goal', type: 'textarea' }),
				defaultField({ key: 'repro', label: 'Repro', type: 'textarea' }),
				defaultField({ key: 'expected', label: 'Expected', type: 'textarea' }),
				defaultField({ key: 'actual', label: 'Actual', type: 'textarea' }),
				defaultField({ key: 'scope', label: 'Scope', type: 'textarea' }),
				defaultField({ key: 'constraints', label: 'Constraints', type: 'textarea' }),
				defaultField({ key: 'filesInserted', label: 'Indsatte filer', type: 'textarea' }),
			],
			body: `Titel: {{bugId}} – {{title}}

Mål
{{goal}}

Repro
{{repro}}

Forventet
{{expected}}

Faktisk
{{actual}}

Scope
{{scope}}

Constraints
{{constraints}}

Indsatte filer
{{filesInserted}}`,
			createdAt: timestamp,
			updatedAt: timestamp,
		},
		{
			id: generateId(),
			name: 'Feature (standard)',
			description: 'Feature prompt',
			fields: [
				defaultField({ key: 'featureId', label: 'Feature ID', required: true }),
				defaultField({ key: 'goal', label: 'Goal', type: 'textarea' }),
				defaultField({ key: 'scope', label: 'Scope', type: 'textarea' }),
				defaultField({ key: 'constraints', label: 'Constraints', type: 'textarea' }),
				defaultField({ key: 'filesInserted', label: 'Indsatte filer', type: 'textarea' }),
			],
			body: `Feature: {{featureId}}

Mål
{{goal}}

Scope
{{scope}}

Constraints
{{constraints}}

Indsatte filer
{{filesInserted}}`,
			createdAt: timestamp,
			updatedAt: timestamp,
		},
		{
			id: generateId(),
			name: 'Start ny prompt',
			description: 'Blank prompt starter',
			fields: [
				defaultField({ key: 'context', label: 'Context', type: 'textarea' }),
				defaultField({ key: 'objective', label: 'Objective', type: 'textarea' }),
				defaultField({ key: 'constraints', label: 'Constraints', type: 'textarea' }),
				defaultField({ key: 'filesInserted', label: 'Indsatte filer', type: 'textarea' }),
				defaultField({ key: 'nextSteps', label: 'Ekstra next steps', type: 'textarea' }),
			],
			body: `Context
{{context}}

Objective
{{objective}}

Constraints
{{constraints}}

Indsatte filer
{{filesInserted}}

Ekstra next steps (valgfrit)
{{nextSteps}}`,
			createdAt: timestamp,
			updatedAt: timestamp,
		},
	];
};

export const loadTemplates = (): Template[] => {
	const storage = getStore();
	if (!storage) return [];
	return safeJSONParse(storage.getItem(STORAGE_KEYS.templates), []);
};

export const saveTemplates = (templates: Template[]) => {
	const storage = getStore();
	if (!storage) return;
	storage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
};

export const loadRuns = (): Run[] => {
	const storage = getStore();
	if (!storage) return [];
	return safeJSONParse(storage.getItem(STORAGE_KEYS.runs), []);
};

export const saveRuns = (runs: Run[]) => {
	const storage = getStore();
	if (!storage) return;
	storage.setItem(STORAGE_KEYS.runs, JSON.stringify(runs));
};

export const seedDefaultsIfEmpty = () => {
	const storage = getStore();
	if (!storage) return;
	const existing = loadTemplates();
	if (existing.length === 0) {
		saveTemplates(createDefaultTemplates());
	}
};
