import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const PORT = Number(process.env.PORT ?? 8787);
const MCP_PATH = '/mcp';
const WIDGET_URL = new URL('./public/workflow-widget.html', import.meta.url);
const WIDGET_URI = 'ui://widget/workflow.html';

// --------- Schemas ----------
const GeneratePromptSchema = z.object({
  projectName: z.string().optional(),
  chatgptProjectName: z.string().optional(),
  taskName: z.string().optional(),
  kind: z.enum(['bug', 'feature', 'enhancement', 'ui']).optional(),
  pastedText: z.string().optional(),
  systemType: z.enum(['Base44', 'Natively']).optional(),
  copilotMode: z.enum(['agent', 'edit']).optional(),
  appType: z.enum(['web', 'react-native-expo', 'backend']).optional(),
  copilotModel: z.string().optional(),

  bugId: z.string().optional(),
  goalBullets: z.string().optional(),
  reproSteps: z.string().optional(),
  expectedVsActual: z.string().optional(),
  scope: z.string().optional(),
  constraints: z.string().optional(),
  filesList: z.string().optional(),
  doneCriteria: z.string().optional()
});

// --------- Prompt helpers ----------
function buildNextStepsBlock() {
  return (
    '✅ NÆSTE SKRIDT\n' +
    '1) Indsæt hele indholdet af alle ændrede filer (1:1) i næste svar.\n' +
    '2) Opsummer præcist hvad du har ændret og hvorfor.\n' +
    '3) Vent på feedback og vær klar til flere iterationer – ingen test/QA endnu.\n'
  );
}

function selectCopilotModel(args) {
  const provided = (args.copilotModel ?? '').toString().trim();
  return provided || 'GPT-5.1-Codex';
}

function buildBrief(args) {
  const parts = [];
  const add = (label, value) => {
    const v = (value ?? '').toString().trim();
    if (v) parts.push(`- ${label}: ${v}`);
  };

  add('ID/titel', args.bugId);
  add('Mål', args.goalBullets);
  add('Repro steps', args.reproSteps);
  add('Forventet vs faktisk', args.expectedVsActual);
  add('Scope (screens/flows)', args.scope);
  add('Constraints', args.constraints);
  add('Indsatte filer', args.filesList);
  add('Done criteria', args.doneCriteria);

  const structured = parts.length ? parts.join('\n') : '';
  const pasted = (args.pastedText ?? '').toString().trim();

  if (structured) return structured + (pasted ? `\n\n---\n\n${pasted}` : '');
  return pasted || '(ingen input)';
}

function buildPromptPayload(args) {
  const projectName = (args.projectName ?? '').toString().trim();
  const chatgptProjectName = (args.chatgptProjectName ?? '').toString().trim();
  const taskName = (args.taskName ?? args.projectName ?? '').toString().trim() || 'Ukendt opgave';
  const systemType = args.systemType ?? 'Natively';
  const mode = args.copilotMode ?? 'agent';
  const modeLabel = mode === 'edit' ? 'Edit mode' : 'Agent mode';
  const copilotModel = selectCopilotModel(args);
  const briefHeading = args.kind ? `BRIEF (${args.kind.toUpperCase()})` : 'BRIEF';
  const briefBody = buildBrief(args);
  const headerParts = [`OPGAVE: ${taskName}`];
  if (projectName) headerParts.push(`Projekt: ${projectName}`);
  if (chatgptProjectName) headerParts.push(`ChatGPT Project: ${chatgptProjectName}`);
  headerParts.push(`System: ${systemType}`);
  headerParts.push(`Mode: ${modeLabel}`);
  headerParts.push(`Copilot model: ${copilotModel}`);
  const rulesBlock = [
    'Regler (fast workflow)',
    mode === 'edit'
      ? '- Du arbejder i VS Code Copilot Edit mode (inline edits).'
      : '- Du arbejder i VS Code Copilot Agent mode (chat).',
    '- Ingen repo-søgning (“find…”, “søg…”). Arbejd kun ud fra det jeg indsætter.',
    '- Returnér ALTID hele opdaterede filer (1:1 klar til overskrivning), aldrig diff/uddrag.',
    '- Branch: Hvis dette er første prompt for opgaven, så arbejd i en dedikeret branch.'
  ].join('\n');

  const nextStepsText = buildNextStepsBlock().trimEnd();
  const outputText = [
    headerParts.join('\n'),
    '',
    rulesBlock,
    '',
    briefHeading,
    briefBody,
    '',
    nextStepsText
  ].join('\n').trimEnd();

  return { outputText, nextStepsText, copilotModel };
}

function loadWidgetHtml() {
  return readFileSync(WIDGET_URL, 'utf8');
}

function buildWidgetResourceContent() {
  return {
    type: 'resource_link',
    name: 'Workflow Wizard',
    uri: WIDGET_URI,
    mimeType: 'text/html+skybridge',
    title: 'Workflow Wizard'
  };
}

// --------- MCP server ----------
function createWizardServer() {
  const server = new McpServer({ name: 'workflow-wizard', version: '1.0.0' });

  server.registerResource(
    'workflow-widget',
    WIDGET_URI,
    {
      title: 'Workflow Wizard Widget',
      description: 'Interactive workflow wizard UI',
      mimeType: 'text/html+skybridge'
    },
    async (uri) => {
      const widgetHtml = loadWidgetHtml();
      const resolvedUri =
        typeof uri === 'string'
          ? uri || WIDGET_URI
          : uri instanceof URL
            ? uri.href
            : WIDGET_URI;

      return {
        contents: [
          {
            uri: resolvedUri,
            mimeType: 'text/html+skybridge',
            text: widgetHtml,
            _meta: { 'openai/widgetPrefersBorder': true }
          }
        ]
      };
    }
  );

  const widgetToolMeta = {
    'openai/widgetAccessible': true,
    'openai/outputTemplate': WIDGET_URI,
    'openai/toolInvocation/invoking': 'Opening wizard',
    'openai/toolInvocation/invoked': 'Wizard opened'
  };

  server.registerTool(
    'open_wizard',
    {
      title: 'Open Workflow Wizard',
      description: 'Åbn Workflow Wizard UI',
      inputSchema: z.object({}),
      _meta: widgetToolMeta
    },
    async () => {
      console.log('[MCP] open_wizard called');
      return {
        content: [
          buildWidgetResourceContent(),
          { type: 'text', text: 'Wizard opened.' }
        ],
        structuredContent: { outputText: '', nextStepsText: '' }
      };
    }
  );

  server.registerTool(
    'start_ny_prompt',
    {
      title: 'Start ny prompt',
      description: 'Åbn Workflow Wizard UI (alias)',
      inputSchema: z.object({}),
      _meta: {
        'openai/widgetAccessible': true,
        'openai/outputTemplate': WIDGET_URI,
        'openai/toolInvocation/invoking': 'Starting new prompt',
        'openai/toolInvocation/invoked': 'New prompt started'
      }
    },
    async () => {
      console.log('[MCP] start_ny_prompt called');
      return {
        content: [
          buildWidgetResourceContent(),
          { type: 'text', text: 'New prompt started.' }
        ],
        structuredContent: { outputText: '', nextStepsText: '' }
      };
    }
  );

  server.registerTool(
    'generate_prompt',
    {
      title: 'Generate prompt',
      description: 'Generate a Copilot prompt + next steps based on the user input.',
      inputSchema: GeneratePromptSchema,
      _meta: {
        'openai/widgetAccessible': true,
        'openai/outputTemplate': WIDGET_URI,
        'openai/toolInvocation/invoking': 'Generating prompt',
        'openai/toolInvocation/invoked': 'Prompt generated'
      }
    },
    async (rawArgs) => {
      console.log('[MCP] generate_prompt called', {
        projectName: rawArgs?.projectName,
        kind: rawArgs?.kind,
        taskName: rawArgs?.taskName
      });
      const args = GeneratePromptSchema.parse(rawArgs ?? {});
      const promptPayload = buildPromptPayload(args);
      const structuredContent = promptPayload;
      const fallbackPayload = JSON.stringify(structuredContent);

      return {
        content: [
          { type: 'text', text: 'Prompt generated.' },
          { type: 'text', text: fallbackPayload }
        ],
        structuredContent
      };
    }
  );

  return server;
}

async function main() {
  const mcpServer = createWizardServer();

  let transport;
  try {
    transport = new StreamableHTTPServerTransport(MCP_PATH, mcpServer);
  } catch {
    transport = new StreamableHTTPServerTransport({
      mcpPath: MCP_PATH,
      server: mcpServer,
      enableJsonResponse: true,
      sessionIdGenerator: undefined
    });
  }

  if (typeof mcpServer.connect === 'function') {
    await mcpServer.connect(transport);
  }

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, Mcp-Session-Id');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

    if (req.method === 'OPTIONS' && url.pathname === MCP_PATH) {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Workflow Wizard MCP server');
      return;
    }

    if (url.pathname === MCP_PATH) {
      const acceptHeader = req.headers['accept'];
      const accept = Array.isArray(acceptHeader) ? acceptHeader.join(',') : (acceptHeader ?? '');
      const normalized = accept.toLowerCase();
      const hasJson = normalized.includes('application/json');
      const hasSse = normalized.includes('text/event-stream');

      if (!hasJson || !hasSse) {
        req.headers['accept'] = 'application/json, text/event-stream';
      }

      await transport.handleRequest(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });

  httpServer.listen(PORT, () => {
    console.log(`Workflow Wizard MCP server listening on http://localhost:${PORT}`);
    console.log(`MCP endpoint: http://localhost:${PORT}${MCP_PATH}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
