export function renderTemplate(body: string, values: Record<string, string>): string {
	if (!body) return '';
	return body.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key: string) => {
		const sanitized = key.trim();
		return values?.[sanitized] ?? '';
	});
}
