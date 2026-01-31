import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

// Workflow parameters
interface FeedbackParams {
    id: string;
    source: string;
    sourceId?: string;
    title?: string;
    content: string;
}

// AI analysis result structure
interface AnalysisResult {
    sentiment: 'positive' | 'negative' | 'neutral';
    sentiment_score: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    themes: string[];
    summary: string;
}

/**
 * Feedback Processor Workflow
 * Analyzes incoming feedback using Workers AI and stores results in D1
 */
export class FeedbackProcessorWorkflow extends WorkflowEntrypoint<Env, FeedbackParams> {
    async run(event: WorkflowEvent<FeedbackParams>, step: WorkflowStep) {
        const { id, source, sourceId, title, content } = event.payload;

        // Step 1: Analyze feedback with Workers AI
        const analysis = await step.do('analyze-feedback', async () => {
            const prompt = `You are a product feedback analyzer. Analyze the following customer feedback and respond with ONLY a valid JSON object (no markdown, no code blocks, just JSON):

{
  "sentiment": "positive" or "negative" or "neutral",
  "sentiment_score": number between 0.0 and 1.0 representing confidence,
  "urgency": "critical" or "high" or "medium" or "low",
  "themes": ["array", "of", "relevant", "themes"],
  "summary": "one sentence summary of the feedback"
}

Classification guidelines:
- CRITICAL urgency: System down, data loss, security issues, blocking issues
- HIGH urgency: Major bugs, significant user impact, time-sensitive
- MEDIUM urgency: Feature requests, improvements, minor bugs
- LOW urgency: Suggestions, cosmetic issues, nice-to-haves

Common themes: Performance, UX, Bug, Feature Request, Documentation, Security, Pricing, Integration, Mobile, API

Feedback to analyze:
${title ? `Title: ${title}\n` : ''}Content: ${content}`;

            const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
                prompt,
                max_tokens: 300,
            });

            try {
                // Parse the AI response as JSON
                const text = (response as { response: string }).response;
                // Extract JSON from potential markdown code blocks
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]) as AnalysisResult;
                }
                throw new Error('No JSON found in response');
            } catch (e) {
                // Fallback if parsing fails
                console.error('Failed to parse AI response:', e);
                return {
                    sentiment: 'neutral' as const,
                    sentiment_score: 0.5,
                    urgency: 'medium' as const,
                    themes: ['Uncategorized'],
                    summary: content.substring(0, 100),
                };
            }
        });

        // Step 2: Store in D1 database
        await step.do('store-feedback', async () => {
            await this.env.DB.prepare(`
				UPDATE feedback 
				SET sentiment = ?, sentiment_score = ?, urgency = ?, themes = ?, summary = ?, processed_at = datetime('now')
				WHERE id = ?
			`).bind(
                analysis.sentiment,
                analysis.sentiment_score,
                analysis.urgency,
                JSON.stringify(analysis.themes),
                analysis.summary,
                id
            ).run();

            return { success: true };
        });

        return {
            id,
            source,
            ...analysis,
        };
    }
}
