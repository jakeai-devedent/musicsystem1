
"use client";

import { RequestItem } from "@/app/types/music";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ListMusic, User, Clock3, Youtube, Music, SkipForward, Trash2, Lock, ShieldCheck, MonitorPlay } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RequestQueueProps {
  queue: RequestItem[];
  onSkip: () => void;
  onRemove: (id: string) => void;
  isAdmin: boolean;
  onAdminClick: () => void;
}

export function RequestQueue({ queue, onSkip, onRemove, isAdmin, onAdminClick }: RequestQueueProps) {
  const currentSong = queue.find(r => r.status === 'playing');
  const upNext = queue.filter(r => r.status === 'pending');

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <Card className="h-full border-muted/30 bg-card/30 backdrop-blur-md flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
        <CardTitle className="flex items-center gap-2 text-xl font-black italic tracking-tighter">
          <ListMusic className="text-accent" />
          QUEUE
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  onClick={onAdminClick}
                  className={`ml-2 p-1.5 rounded-lg cursor-pointer transition-colors ${isAdmin ? 'bg-accent/20 text-accent' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                >
                  {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-black border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  {isAdmin ? 'Manager Mode Enabled' : 'Manager Login Required'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <span className="text-[10px] font-code text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
          {upNext.length} Pending
        </span>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pt-4">
          {currentSong && (
            <div className="mb-6 space-y-4">
              <div className="p-4 rounded-xl border border-accent/30 bg-accent/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] flex items-center gap-1">
                    <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
                    Now Playing
                  </div>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onSkip}
                      className="h-7 px-2 text-[9px] font-bold text-accent bg-accent/10 hover:bg-accent/20 gap-1 border border-accent/20"
                    >
                      <SkipForward className="w-3 h-3" />
                      SKIP NEXT
                    </Button>
                  )}
                </div>
                
                {isAdmin ? (
                  currentSong.song.youtubeUrl && (
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black mb-4 border border-white/10 shadow-2xl">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${getYoutubeId(currentSong.song.youtubeUrl)}?autoplay=1&mute=0`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )
                ) : (
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/60 mb-4 border border-white/5 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <MonitorPlay className="w-12 h-12 text-accent/20" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white/80">교실 메인 화면에서 재생 중</p>
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">음악은 관리자용 기기에서만 재생됩니다.<br/>개인 화면에서는 대기열만 확인할 수 있습니다.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onAdminClick} className="h-7 text-[9px] border-white/10 bg-white/5 font-black">
                      관리자로 로그인
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    {currentSong.song.youtubeUrl ? <Youtube className="text-red-500" /> : <Music className="text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg leading-tight truncate">{currentSong.song.title}</h4>
                    <p className="text-muted-foreground text-sm font-medium truncate">{currentSong.song.artist}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3 text-accent" />
                    Requested by <span className="font-bold text-foreground">{currentSong.requesterName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 pb-4">
            {upNext.length > 0 ? (
              upNext.map((item, idx) => (
                <div key={item.id} className="group relative flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                  <div className="font-code text-lg text-muted-foreground/30 pt-1 w-6">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <h5 className="font-bold text-sm truncate group-hover:text-accent transition-colors">{item.song.title}</h5>
                        {item.song.youtubeUrl && <Youtube className="w-3 h-3 text-red-500 shrink-0" />}
                      </div>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onRemove(item.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.song.artist}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                        <User className="w-2.5 h-2.5" />
                        {item.requesterName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                        <Clock3 className="w-2.5 h-2.5" />
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : !currentSong && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/30">
                <ListMusic className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-headline font-black text-xl tracking-tighter italic">QUEUE EMPTY</p>
                <p className="text-xs font-medium">학생들의 신청을 기다리고 있습니다.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
