'use server';
/**
 * @fileOverview An AI agent that provides song recommendations.
 *
 * - aiSongRecommendation - A function that handles the AI song recommendation process.
 * - AiSongRecommendationInput - The input type for the aiSongRecommendation function.
 * - AiSongRecommendationOutput - The return type for the aiSongRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSongRecommendationInputSchema = z.object({
  popularTrends: z
    .string()
    .optional()
    .describe('A description of current popular music trends.'),
  currentAtmosphere: z
    .string()
    .optional()
    .describe('A description of the current mood or atmosphere.'),
  recentRequests: z
    .array(z.string())
    .optional()
    .describe('A list of recently requested songs (e.g., "Artist - Song Title").'),
});
export type AiSongRecommendationInput = z.infer<typeof AiSongRecommendationInputSchema>;

const AiSongRecommendationOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        title: z.string().describe('The title of the recommended song.'),
        artist: z.string().describe('The artist of the recommended song.'),
      })
    )
    .describe('An array of recommended songs, each with a title and artist.'),
});
export type AiSongRecommendationOutput = z.infer<typeof AiSongRecommendationOutputSchema>;

export async function aiSongRecommendation(
  input: AiSongRecommendationInput
): Promise<AiSongRecommendationOutput> {
  return aiSongRecommendationFlow(input);
}

const aiSongRecommendationPrompt = ai.definePrompt({
  name: 'aiSongRecommendationPrompt',
  input: {schema: AiSongRecommendationInputSchema},
  output: {schema: AiSongRecommendationOutputSchema},
  prompt: `You are an AI song recommendation system for the TuneDial app. Your goal is to suggest songs based on the provided context.
Consider the following information to generate suitable recommendations. Prioritize relevance to recent requests and current atmosphere if provided.

{{#if popularTrends}}
Current Popular Music Trends: {{{popularTrends}}}
{{/if}}

{{#if currentAtmosphere}}
Current Atmosphere or Mood: {{{currentAtmosphere}}}
{{/if}}

{{#if recentRequests}}
Recently Requested Songs (to inform style/genre preferences):
{{#each recentRequests}} - {{{this}}}
{{/each}}
{{/if}}

Please provide 5 distinct song recommendations that fit the criteria. For each recommendation, provide the song title and the artist.`,
});

const aiSongRecommendationFlow = ai.defineFlow(
  {
    name: 'aiSongRecommendationFlow',
    inputSchema: AiSongRecommendationInputSchema,
    outputSchema: AiSongRecommendationOutputSchema,
  },
  async input => {
    const {output} = await aiSongRecommendationPrompt(input);
    return output!;
  }
);
