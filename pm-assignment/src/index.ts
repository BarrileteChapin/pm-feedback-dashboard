import { FeedbackProcessorWorkflow } from './workflow';

// Re-export the workflow for Cloudflare to register it
export { FeedbackProcessorWorkflow };

// Feedback item type
interface Feedback {
	id: string;
	source: string;
	source_id?: string;
	title?: string;
	content: string;
	sentiment?: string;
	sentiment_score?: number;
	urgency?: string;
	themes?: string;
	summary?: string;
	status: string;
	created_at: string;
	processed_at?: string;
}

// Sample/simulated feedback data for demo
const SAMPLE_FEEDBACK = [
	{
		source: 'discord',
		title: 'Dashboard loading slowly',
		content: 'The analytics dashboard takes forever to load. Sometimes it just shows a spinning loader for 30+ seconds. This is really frustrating when I need to check metrics quickly.',
	},
	{
		source: 'github',
		title: 'Feature Request: Dark Mode',
		content: 'Would love to have a dark mode option! I work late nights and the bright white UI is harsh on my eyes. This would be a great addition.',
	},
	{
		source: 'twitter',
		title: null,
		content: 'Just discovered @YourProduct and I am blown away! The onboarding was seamless and I was up and running in minutes. Best tool I have used this year! 🚀',
	},
	{
		source: 'email',
		title: 'Urgent: API returning 500 errors',
		content: 'Our production integration is completely broken. The /users endpoint is returning 500 errors since this morning. We have customers unable to access their accounts. Please fix ASAP!',
	},
	{
		source: 'discord',
		title: 'Export to PDF?',
		content: 'Is there any way to export reports as PDF? I need to share them with stakeholders who don\'t have accounts. An export feature would be super helpful.',
	},
	{
		source: 'github',
		title: 'Bug: Search not finding exact matches',
		content: 'When I search for "project-alpha" it does not find exact matches, only partial ones. The search should prioritize exact string matches over fuzzy matching.',
	},
];

/**
 * Product Feedback Dashboard - Cloudflare Worker
 * 
 * API Endpoints:
 * - GET /api/feedback - List all feedback items
 * - POST /api/feedback - Create new feedback (triggers AI analysis)
 * - PATCH /api/feedback/:id - Update feedback status
 * - DELETE /api/feedback/:id - Delete feedback item
 * - POST /api/seed - Seed database with sample data
 * - POST /api/init - Initialize database schema
 * - POST /api/login - Authenticate user
 * - POST /api/logout - Clear session
 */

// Simple auth credentials (in production, use environment secrets)
const AUTH_USERNAME = 'internshipPT';
const AUTH_PASSWORD = 'internshipPT';

// Active sessions (in production, use KV storage)
const activeSessions = new Set<string>();

// Generate a simple session token with embedded timestamp
function generateSessionToken(): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 15);
	const token = `${timestamp}.${random}`;
	activeSessions.add(token);
	return token;
}

// Validate session token (check exists and not expired - 24 hours)
function isValidSession(token: string | null): boolean {
	if (!token) return false;

	// Check if session exists (for local dev, we accept any token with valid format)
	const parts = token.split('.');
	if (parts.length !== 2) return false;

	const timestamp = parseInt(parts[0]);
	if (isNaN(timestamp)) return false;

	const hoursSinceCreation = (Date.now() - timestamp) / (1000 * 60 * 60);
	return hoursSinceCreation < 24;
}

// Get session from cookie
function getSessionFromCookie(request: Request): string | null {
	const cookie = request.headers.get('Cookie');
	if (!cookie) return null;
	const match = cookie.match(/session=([^;]+)/);
	return match ? match[1] : null;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers for API requests
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Public routes (no auth required)
			if (path === '/' || path === '/login' || path === '/login.html') {
				// Redirect to dashboard if already logged in
				const session = getSessionFromCookie(request);
				if (isValidSession(session)) {
					return Response.redirect(new URL('/dashboard', url).toString(), 302);
				}
				// Serve login page
				return env.ASSETS.fetch(new Request(new URL('/login.html', url).toString(), request));
			}

			// Login API (no auth required)
			if (path === '/api/login' && request.method === 'POST') {
				const body = await request.json() as { username: string; password: string };

				if (body.username === AUTH_USERNAME && body.password === AUTH_PASSWORD) {
					const token = generateSessionToken();
					return new Response(JSON.stringify({ success: true }), {
						status: 200,
						headers: {
							'Content-Type': 'application/json',
							'Set-Cookie': `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
						},
					});
				}

				return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
			}

			// Logout API
			if (path === '/api/logout' && request.method === 'POST') {
				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						'Set-Cookie': 'session=; Path=/; HttpOnly; Max-Age=0',
					},
				});
			}

			// All other routes require authentication
			const session = getSessionFromCookie(request);
			if (!isValidSession(session)) {
				// Redirect to login for page requests
				if (!path.startsWith('/api/')) {
					return Response.redirect(new URL('/login', url).toString(), 302);
				}
				// Return 401 for API requests
				return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
			}

			// Dashboard route (authenticated)
			if (path === '/dashboard' || path === '/dashboard/') {
				return env.ASSETS.fetch(new Request(new URL('/index.html', url).toString(), request));
			}

			// API Routes (authenticated)
			if (path.startsWith('/api/')) {
				const response = await handleAPI(request, env, path);
				// Add CORS headers to API responses
				const headers = new Headers(response.headers);
				Object.entries(corsHeaders).forEach(([key, value]) => {
					headers.set(key, value);
				});
				return new Response(response.body, {
					status: response.status,
					headers,
				});
			}

			// Serve static assets for everything else
			return env.ASSETS.fetch(request);
		} catch (error) {
			console.error('Error handling request:', error);
			return Response.json(
				{ error: error instanceof Error ? error.message : 'Internal server error' },
				{ status: 500, headers: corsHeaders }
			);
		}
	},
};

async function handleAPI(request: Request, env: Env, path: string): Promise<Response> {
	// POST /api/init - Initialize database schema
	if (path === '/api/init' && request.method === 'POST') {
		try {
			// Create table first
			await env.DB.prepare(`
				CREATE TABLE IF NOT EXISTS feedback (
					id TEXT PRIMARY KEY,
					source TEXT NOT NULL,
					source_id TEXT,
					title TEXT,
					content TEXT NOT NULL,
					sentiment TEXT,
					sentiment_score REAL,
					urgency TEXT,
					themes TEXT,
					summary TEXT,
					status TEXT DEFAULT 'inbox',
					created_at TEXT DEFAULT (datetime('now')),
					processed_at TEXT
				)
			`).run();

			// Create indexes separately
			await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status)`).run();
			await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_feedback_urgency ON feedback(urgency)`).run();
			await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment)`).run();
			await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at)`).run();

			return Response.json({ success: true, message: 'Database initialized' });
		} catch (error) {
			console.error('Init error:', error);
			return Response.json({ success: false, error: String(error) }, { status: 500 });
		}
	}

	// POST /api/seed - Seed database with sample data
	if (path === '/api/seed' && request.method === 'POST') {
		const results = [];
		for (const sample of SAMPLE_FEEDBACK) {
			const id = crypto.randomUUID();

			// Insert feedback
			await env.DB.prepare(`
				INSERT INTO feedback (id, source, title, content, status)
				VALUES (?, ?, ?, ?, 'inbox')
			`).bind(id, sample.source, sample.title, sample.content).run();

			// Start workflow to analyze
			try {
				await env.FEEDBACK_WORKFLOW.create({
					id: `workflow-${id}`,
					params: {
						id,
						source: sample.source,
						title: sample.title || undefined,
						content: sample.content,
					},
				});
				results.push({ id, status: 'processing' });
			} catch (e) {
				console.error('Workflow error:', e);
				results.push({ id, status: 'inserted-no-analysis' });
			}
		}
		return Response.json({ success: true, count: results.length, results });
	}

	// GET /api/feedback - List all feedback
	if (path === '/api/feedback' && request.method === 'GET') {
		const url = new URL(request.url);
		const status = url.searchParams.get('status');

		let query = 'SELECT * FROM feedback ORDER BY created_at DESC';
		if (status) {
			query = 'SELECT * FROM feedback WHERE status = ? ORDER BY created_at DESC';
		}

		const stmt = status
			? env.DB.prepare(query).bind(status)
			: env.DB.prepare(query);

		const { results } = await stmt.all<Feedback>();

		// Parse themes JSON for each result
		const feedback = results.map(item => ({
			...item,
			themes: item.themes ? JSON.parse(item.themes) : [],
		}));

		return Response.json({ feedback });
	}

	// POST /api/feedback - Create new feedback
	if (path === '/api/feedback' && request.method === 'POST') {
		const body = await request.json() as {
			source: string;
			title?: string;
			content: string;
		};

		if (!body.content) {
			return Response.json({ error: 'Content is required' }, { status: 400 });
		}

		const id = crypto.randomUUID();
		const source = body.source || 'manual';

		// Insert into database
		await env.DB.prepare(`
			INSERT INTO feedback (id, source, title, content, status)
			VALUES (?, ?, ?, ?, 'inbox')
		`).bind(id, source, body.title || null, body.content).run();

		// Start workflow to analyze
		try {
			await env.FEEDBACK_WORKFLOW.create({
				id: `workflow-${id}`,
				params: {
					id,
					source,
					title: body.title,
					content: body.content,
				},
			});
		} catch (e) {
			console.error('Failed to start workflow:', e);
		}

		return Response.json({
			success: true,
			id,
			message: 'Feedback submitted and queued for analysis'
		}, { status: 201 });
	}

	// PATCH /api/feedback/:id - Update feedback (mainly for status changes)
	const patchMatch = path.match(/^\/api\/feedback\/([a-f0-9-]+)$/);
	if (patchMatch && request.method === 'PATCH') {
		const id = patchMatch[1];
		const body = await request.json() as { status?: string };

		if (body.status) {
			await env.DB.prepare(`
				UPDATE feedback SET status = ? WHERE id = ?
			`).bind(body.status, id).run();
		}

		return Response.json({ success: true, id });
	}

	// DELETE /api/feedback/:id - Delete feedback
	const deleteMatch = path.match(/^\/api\/feedback\/([a-f0-9-]+)$/);
	if (deleteMatch && request.method === 'DELETE') {
		const id = deleteMatch[1];
		await env.DB.prepare('DELETE FROM feedback WHERE id = ?').bind(id).run();
		return Response.json({ success: true, id });
	}

	return Response.json({ error: 'Not found' }, { status: 404 });
}
