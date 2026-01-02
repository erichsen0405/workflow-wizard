export type FieldType = 'text' | 'textarea' | 'select';

export interface FieldDef {
	key: string;
	label: string;
	type: FieldType;
	required?: boolean;
	options?: string[];
}

export interface Template {
	id: string;
	name: string;
	description: string;
	fields: FieldDef[];
	body: string;
	createdAt: string;
	updatedAt: string;
}

export interface Run {
	id: string;
	templateId: string;
	title: string;
	values: Record<string, string>;
	output: string;
	nextSteps: string;
	createdAt: string;
}

export const NEXT_STEPS_CHECKLIST = `✅ NÆSTE SKRIDT
(1) Indsæt hele indholdet af de ændrede filer til validering (1:1 klar til overskrivning)
(2) Kør tests: Web → \`npm run dev\` og test i browser
(3) Rapportér tilbage: hvad du ser + logs/errors + evt. screenshots
(4) Commit med foreslået commit message
(5) Test igen efter commit (hurtig sanity)
(6) Skriv “bug/feature løst” når det er færdigt`;
