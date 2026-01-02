export function renderTemplate(body: string, values: Record<string, string>): string {
	return body.replace(/{{\s*([^}]+)\s*}}/g, (_match, key: string) => {
		const sanitized = key.trim();
		return values[sanitized] ?? '';
	});
}
