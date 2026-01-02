import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const PORT = Number(process.env.PORT ?? 8787);
const MCP_PATH = '/mcp';

const NEXT_STEPS = `✅ NÆSTE SKRIDT
(1) Indsæt hele indholdet af de ændrede filer til validering (1:1 klar til overskrivning)
(2) Kør tests: Web → \`npm run dev\` og test i browser
(3) Rapportér tilbage: hvad du ser + logs/errors + evt. screenshots
(4) Commit med foreslået commit message
(5) Test igen efter commit (hurtig sanity)
(6) Skriv “bug/feature løst” når det er færdigt
`;

function buildPrompt({ kind, projectName, pastedText }) {
	const kindTitle =
		kind === 'bug'
			? 'BUG PROMPT'
			: kind === 'feature'
				? 'FEATURE PROMPT'
				: kind === 'enhancement'
					? 'ENHANCEMENT PROMPT'
					: 'UI DESIGN UPDATE PROMPT';

	const proj = (projectName ?? '').trim();
	const input = (pastedText ?? '').trim();

	return [
		kindTitle,
		proj ? `Projekt: ${proj}` : null,
		'',
		'INPUT:',
		input || '(ingen input)',
		'',
		NEXT_STEPS.trimEnd(),
	]
		.filter(Boolean)
		.join('\n');
}

function createWizardServer() {
	const server = new McpServer({ name: 'workflow-wizard', version: '0.1.0' });

	server.registerResource(
		'workflow-widget',
		'ui://widget/workflow.html',
		{},
		async () => {
			const widgetHtml = readFileSync(new URL('./public/workflow-widget.html', import.meta.url), 'utf8');
			return {
				contents: [
					{
						uri: 'ui://widget/workflow.html',
						mimeType: 'text/html+skybridge',
						text: widgetHtml,
						_meta: { 'openai/widgetPrefersBorder': true },
					},
				],
			};
		},
	);

	server.registerTool(
		'open_wizard',
		{
			title: 'Open workflow wizard',
			description: 'Open the embedded workflow wizard widget.',
			inputSchema: {},
			_meta: {
				'openai/widgetAccessible': true,
				'openai/outputTemplate': 'ui://widget/workflow.html',
				'openai/toolInvocation/invoking': 'Opening wizard',
				'openai/toolInvocation/invoked': 'Wizard opened',
			},
		},
		async () => ({
			content: [{ type: 'text', text: 'Wizard opened.' }],
			structuredContent: { outputText: '', kind: 'feature', lastError: '' },
		}),
	);

	const generatePromptInputSchema = {
		kind: z.enum(['bug', 'feature', 'enhancement', 'ui']),
		pastedText: z.string().optional(),
		projectName: z.string().optional(),
	};

	server.registerTool(
		'generate_prompt',
		{
			title: 'Generate prompt',
			description: 'Generate a DK prompt + next steps based on pasted input.',
			inputSchema: generatePromptInputSchema,
			_meta: {
				'openai/widgetAccessible': true,
				'openai/outputTemplate': 'ui://widget/workflow.html',
				'openai/toolInvocation/invoking': 'Generating prompt',
				'openai/toolInvocation/invoked': 'Prompt generated',
			},
		},
		async (args) => {
			const kind = args?.kind ?? 'feature';
			const outputText = buildPrompt({
				kind,
				projectName: args?.projectName,
				pastedText: args?.pastedText,
			});

			return {
				content: [{ type: 'text', text: 'Generated prompt.' }],
				structuredContent: { outputText },
			};
		},
	);

	return server;
}

const mcpServer = createWizardServer();

const transport = new StreamableHTTPServerTransport({
	sessionIdGenerator: undefined,
	enableJsonResponse: true,
});

await mcpServer.connect(transport);

const httpServer = createServer(async (req, res) => {
	const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

	if (req.method === 'OPTIONS' && url.pathname === MCP_PATH) {
		res.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
			'Access-Control-Allow-Headers': 'content-type, mcp-session-id',
			'Access-Control-Expose-Headers': 'Mcp-Session-Id',
		});
		res.end();
		return;
	}

	if (url.pathname === '/') {
		res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
		res.end('Workflow Wizard MCP server');
		return;
	}

	if (url.pathname === MCP_PATH) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
		await transport.handleRequest(req, res);
		return;
	}

	res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
	res.end('Not found');
});

httpServer.listen(PORT, () => {
	console.log(`Workflow Wizard MCP server listening on http://localhost:${PORT}${MCP_PATH}`);
});
