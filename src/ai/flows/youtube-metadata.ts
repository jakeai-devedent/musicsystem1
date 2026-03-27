
'use server';
/**
 * @fileOverview 유튜브 링크를 분석하여 곡 제목과 아티스트 정보를 추출하는 AI 에이전트.
 * 분석 실패 시에도 오류를 내지 않고 유추된 정보를 반환하도록 설계되었습니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const YoutubeMetadataInputSchema = z.object({
  url: z.string().describe('분석할 유튜브 동영상 URL'),
});
export type YoutubeMetadataInput = z.infer<typeof YoutubeMetadataInputSchema>;

const YoutubeMetadataOutputSchema = z.object({
  title: z.string().describe('정리된 곡 제목 (예: Midnight City)'),
  artist: z.string().describe('아티스트 이름 (예: M83)'),
});
export type YoutubeMetadataOutput = z.infer<typeof YoutubeMetadataOutputSchema>;

export async function getYoutubeMetadata(
  input: YoutubeMetadataInput
): Promise<YoutubeMetadataOutput> {
  return youtubeMetadataFlow(input);
}

const youtubeMetadataPrompt = ai.definePrompt({
  name: 'youtubeMetadataPrompt',
  input: {schema: YoutubeMetadataInputSchema},
  output: {schema: YoutubeMetadataOutputSchema},
  prompt: `당신은 음악 정보 전문가입니다. 제공된 유튜브 URL이나 ID를 바탕으로 해당 영상의 곡 제목과 아티스트를 식별하세요.
유튜브 제목에 포함된 [MV], (Official), [4K], 공식뮤직비디오, 가사 등 음악 감상에 방해되는 불필요한 태그는 제거하고 순수한 곡 정보만 추출하세요.

중요: 만약 정확한 곡 정보(제목/아티스트)를 확신할 수 없다면, URL의 뒷부분이나 영상 제목을 참고하여 가장 그럴듯한 제목을 'title'에 넣고 'artist'는 'Unknown' 혹은 'V.A'로 설정하여 반드시 JSON 형식에 맞춰 응답하세요. 절대 오류를 내거나 빈 값을 주지 마세요.

URL: {{{url}}}`,
});

const youtubeMetadataFlow = ai.defineFlow(
  {
    name: 'youtubeMetadataFlow',
    inputSchema: YoutubeMetadataInputSchema,
    outputSchema: YoutubeMetadataOutputSchema,
  },
  async input => {
    try {
      const {output} = await youtubeMetadataPrompt(input);
      return output || { title: "YouTube 영상", artist: "Unknown" };
    } catch (e) {
      console.error("Genkit prompt execution failed:", e);
      return { title: "YouTube 영상", artist: "Unknown" };
    }
  }
);
