
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, Search, RefreshCw, Music } from "lucide-react";
import { aiSongRecommendation } from "@/ai/flows/ai-song-recommendation";

interface AiRecommenderProps {
  recentRequests: string[];
  onSelect: (query: string) => void;
}

export function AiRecommender({ recentRequests, onSelect }: AiRecommenderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{title: string, artist: string}[]>([]);

  const getRecommendations = async () => {
    setIsLoading(true);
    try {
      const result = await aiSongRecommendation({
        recentRequests,
        currentAtmosphere: "Energetic and modern music studio vibe for students",
        popularTrends: "Contemporary electronic pop, K-pop, and trending synth-pop"
      });
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error("AI recommendation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-muted/30 bg-card/20 backdrop-blur-md overflow-hidden">
      <CardHeader className="pb-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 font-black italic tracking-tighter">
            <Sparkles className="text-accent h-4 w-4" />
            TUNEDIAL AI
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={getRecommendations} 
            disabled={isLoading}
            className="h-8 px-2 text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 hover:text-accent border border-white/5"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : recommendations.length > 0 ? <RefreshCw className="h-3 w-3 mr-1" /> : 'Suggest'}
            {recommendations.length > 0 ? 'Retry' : ''}
          </Button>
        </div>
        <CardDescription className="text-[10px] font-medium uppercase tracking-tight">
          최근 신청곡 분석 및 분위기 맞춤 추천
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-1.5">
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-accent mb-3" />
              <p className="text-[10px] font-bold font-code animate-pulse tracking-[0.2em] uppercase">Vibe Analysis...</p>
            </div>
          ) : recommendations.length > 0 ? (
            recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="group flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-accent/10 transition-all cursor-pointer border border-transparent hover:border-accent/20 active:scale-[0.98]"
                onClick={() => onSelect(rec.title)}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-bold truncate group-hover:text-accent transition-colors leading-tight">{rec.title}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase truncate tracking-tight">{rec.artist}</p>
                </div>
                <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                   <Search className="h-3.5 w-3.5 text-accent" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center gap-2">
              <Music className="w-5 h-5 text-muted-foreground/20" />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-4">추천 버튼을 눌러보세요</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
