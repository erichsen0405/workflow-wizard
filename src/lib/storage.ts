import { FieldDef, Project, Run, Template } from './models';

export const STORAGE_KEYS = {
	templates: 'ww_templates_v1',
	runs: 'ww_runs_v1',
	projects: 'ww_projects_v1',
	activeProjectId: 'ww_active_project_v1',
};

export const ACTIVE_PROJECT_EVENT = 'ww:active-project-changed';

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

export const createLocalId = () => {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const notifyActiveProjectChange = () => {
	if (hasWindow && typeof window.dispatchEvent === 'function') {
		window.dispatchEvent(new Event(ACTIVE_PROJECT_EVENT));
	}
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
			id: createLocalId(),
			category: 'bug',
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
			id: createLocalId(),
			category: 'feature',
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
			id: createLocalId(),
			category: 'feature',
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
		{
			id: createLocalId(),
			category: 'enhancement',
			name: 'Enhancement (standard)',
			description: 'Standard enhancement prompt',
			fields: [
				defaultField({ key: 'featureId', label: 'Enhancement ID', required: true }),
				defaultField({ key: 'title', label: 'Title' }),
				defaultField({ key: 'goal', label: 'Goal', type: 'textarea' }),
				defaultField({ key: 'scope', label: 'Scope', type: 'textarea' }),
				defaultField({ key: 'constraints', label: 'Constraints', type: 'textarea' }),
				defaultField({ key: 'filesInserted', label: 'Indsatte filer', type: 'textarea' }),
			],
			body: `Enhancement: {{featureId}} – {{title}}

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
			id: createLocalId(),
			category: 'ui',
			name: 'UI design update',
			description: 'UI update prompt',
			fields: [
				defaultField({ key: 'featureId', label: 'Task ID', required: true }),
				defaultField({ key: 'title', label: 'Title', required: true }),
				defaultField({ key: 'goal', label: 'Goal', type: 'textarea' }),
				defaultField({ key: 'scope', label: 'Scope', type: 'textarea' }),
				defaultField({ key: 'constraints', label: 'Constraints', type: 'textarea' }),
				defaultField({ key: 'designNotes', label: 'Design notes', type: 'textarea' }),
				defaultField({ key: 'filesInserted', label: 'Assets / filer', type: 'textarea' }),
			],
			body: `UI update: {{featureId}} – {{title}}

Goal
{{goal}}

Scope
{{scope}}

Constraints
{{constraints}}

Design notes
{{designNotes}}

Assets / filer
{{filesInserted}}`,
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

export const loadProjects = (): Project[] => {
	const storage = getStore();
	if (!storage) return [];
	return safeJSONParse(storage.getItem(STORAGE_KEYS.projects), []);
};

export const saveProjects = (projects: Project[]) => {
	const storage = getStore();
	if (!storage) return;
	storage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
};

export const loadActiveProjectId = (): string | null => {
	const storage = getStore();
	if (!storage) return null;
	return storage.getItem(STORAGE_KEYS.activeProjectId);
};

export const saveActiveProjectId = (projectId: string | null) => {
	const storage = getStore();
	if (!storage) return;
	if (!projectId) {
		storage.removeItem(STORAGE_KEYS.activeProjectId);
	} else {
		storage.setItem(STORAGE_KEYS.activeProjectId, projectId);
	}
	notifyActiveProjectChange();
};

export const getActiveProject = (): Project | null => {
	const id = loadActiveProjectId();
	if (!id) return null;
	return loadProjects().find((project) => project.id === id) ?? null;
};

export const loadRunsForProject = (projectId: string | null): Run[] => {
	const runs = loadRuns();
	if (!projectId) return runs;
	return runs.filter((run) => !run.projectId || run.projectId === projectId);
};

export const seedDefaultsIfEmpty = () => {
	const storage = getStore();
	if (!storage) return;
	const existing = loadTemplates();
	const defaults = createDefaultTemplates();
	if (existing.length === 0) {
		saveTemplates(defaults);
		return;
	}
	const missing = defaults.filter((tpl) => !existing.some((t) => t.name === tpl.name));
	if (missing.length) {
		saveTemplates([...existing, ...missing]);
	}
};
