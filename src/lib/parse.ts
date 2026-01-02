export type WizardKind = 'bug' | 'feature' | 'enhancement' | 'ui';

const SECTION_LABELS: Record<
	string,
	string[]
> = {
	goal: ['mål', 'goal', '🎯 mål'],
	repro: ['repro', 'reproduktion'],
	expected: ['forventet', 'expected'],
	actual: ['faktisk', 'actual'],
	scope: ['scope'],
	constraints: ['constraints', 'krav', 'constraints (skal overholdes)'],
	files: ['affected files', 'filer', 'indsatte filer'],
	designNotes: ['design notes', 'design', 'ui notes'],
};

const escapeLabel = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractSections = (text: string): Record<string, string> => {
	const sections: Record<string, string[]> = {};
	let current: string | null = null;

	text.split(/\r?\n/).forEach((rawLine) => {
		const line = rawLine.trim();
		if (!line) {
			if (current) sections[current].push('');
			return;
		}
		let matchedKey: string | null = null;
		let remainder = '';
		for (const [key, labels] of Object.entries(SECTION_LABELS)) {
			for (const label of labels) {
				const regex = new RegExp(`^${escapeLabel(label)}(?:\\s*[:\\-–—]+)?\\s*`, 'i');
				const match = line.match(regex);
				if (match) {
					matchedKey = key;
					remainder = line.slice(match[0].length).trim();
					break;
				}
			}
			if (matchedKey) break;
		}
		if (matchedKey) {
			current = matchedKey;
			if (!sections[current]) sections[current] = [];
			if (remainder) sections[current].push(remainder);
		} else if (current) {
			sections[current].push(line);
		}
	});

	return Object.fromEntries(
		Object.entries(sections)
			.map(([key, lines]) => [key, lines.join('\n').trim()])
			.filter(([, value]) => Boolean(value))
	);
};

export function parsePastedSpec(kind: WizardKind, text: string): Record<string, string> {
	const result: Record<string, string> = {};
	if (!text.trim()) return result;

	const lines = text.split(/\r?\n/);
	const firstLine = lines.find((line) => line.trim());
	const assignId = (token: string) => {
		if (!token) return;
		if (kind === 'bug') {
			result.bugId = token;
		} else {
			result.featureId = token;
		}
	};

	if (firstLine) {
		const match = firstLine.trim().match(/^([A-Za-z0-9_-]+)\s*[:\-–]\s*(.+)$/);
		if (match) {
			assignId(match[1].trim());
			if (match[2].trim()) result.title = match[2].trim();
		} else if (!result.title) {
			result.title = firstLine.trim();
		}
	}

	if (!result.bugId && !result.featureId) {
		const inlineId = text.match(/(?:bug|feature|enhancement|ui)?\s*id\s*[:\-]\s*([A-Za-z0-9_-]+)/i);
		if (inlineId) assignId(inlineId[1].trim());
	}

	const sections = extractSections(text);
	const copySection = (sectionKey: string, targetKey = sectionKey) => {
		if (sections[sectionKey]) result[targetKey] = sections[sectionKey];
	};

	copySection('goal');
	copySection('scope');
	copySection('constraints');
	copySection('files', 'filesInserted');
	copySection('designNotes');
	copySection('repro');
	copySection('expected');
	copySection('actual');

	if (!result.title && sections.goal) {
		result.title = sections.goal.split('\n')[0]?.trim() ?? '';
	}

	return Object.fromEntries(Object.entries(result).filter(([, value]) => Boolean(value)));
}
