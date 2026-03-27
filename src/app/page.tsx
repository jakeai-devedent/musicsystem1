
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Song, RequestItem } from "./types/music";
import { RequestQueue } from "@/components/music/RequestQueue";
import { RequestInput } from "@/components/music/RequestInput";
import { AiRecommender } from "@/components/music/AiRecommender";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Headphones, Volume2, Lock, ArrowRight, Music2, History, Clock, RotateCcw, PlayCircle, Youtube, Loader2, ShieldCheck } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { formatDistanceToNow } from "date-fns";
import { 
  useFirestore, 
  useCollection, 
  useAuth, 
  useUser, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  initiateAnonymousSignIn
} from "@/firebase";
import { collection, query, orderBy, limit, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { getYoutubeMetadata } from "@/ai/flows/youtube-metadata";

export default function Home() {
  const [isJoined, setIsJoined] = useState(false);
  const [entryCode, setEntryCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<Song | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const { toast } = useToast();

  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const VALID_CODE = "1234";
  const ADMIN_PWD = "0605music";

  const handleJoin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (entryCode === VALID_CODE) {
      if (!user) {
        initiateAnonymousSignIn(auth);
      }
      setIsJoined(true);
    } else {
      setRequestError("잘못된 방 번호입니다.");
      setEntryCode("");
      setTimeout(() => setRequestError(null), 2000);
    }
  };

  const handleAdminAuth = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (adminPassword === ADMIN_PWD) {
      setIsAdmin(true);
      setShowAdminDialog(false);
      setAdminPassword("");
      toast({
        title: "관리자 모드 활성화",
        description: "이제 동영상 재생 및 대기열 관리가 가능합니다.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "인증 실패",
        description: "비밀번호가 올바르지 않습니다.",
      });
    }
  };

  const queueQuery = useMemoFirebase(() => {
    if (!db || !isJoined || !user) return null;
    return query(
      collection(db, "rooms", VALID_CODE, "queue"),
      orderBy("timestamp", "asc")
    );
  }, [db, isJoined, user]);

  const historyQuery = useMemoFirebase(() => {
    if (!db || !isJoined || !user) return null;
    return query(
      collection(db, "rooms", VALID_CODE, "history"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
  }, [db, isJoined, user]);

  const { data: queueData } = useCollection<any>(queueQuery);
  const { data: historyData } = useCollection<any>(historyQuery);

  const queue: RequestItem[] = useMemo(() => {
    return (queueData || []).map(item => ({
      ...item,
      timestamp: item.timestamp instanceof Timestamp ? item.timestamp.toDate() : new Date(),
    }));
  }, [queueData]);

  const history: RequestItem[] = useMemo(() => {
    return (historyData || []).map(item => ({
      ...item,
      timestamp: item.timestamp instanceof Timestamp ? item.timestamp.toDate() : new Date(),
    }));
  }, [historyData]);

  const heroImage = useMemo(() => {
    return PlaceHolderImages.find(img => img.id === 'hero-studio') || PlaceHolderImages[0];
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleRequest = async (youtubeUrl: string, studentNum: string) => {
    if (!db || !isJoined || !user) return;
    setIsRequesting(true);

    let finalTitle = "분석 중...";
    let finalArtist = "Unknown";

    try {
      const metadata = await getYoutubeMetadata({ url: youtubeUrl });
      finalTitle = metadata.title;
      finalArtist = metadata.artist;
    } catch (error) {
      const vid = getYoutubeId(youtubeUrl);
      finalTitle = vid ? `YouTube 영상 (${vid})` : "신청된 영상";
    }

    const song: Song = {
      id: `yt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: finalTitle,
      artist: finalArtist,
      genre: 'YouTube',
      duration: 'Live',
      youtubeUrl,
      imageUrl: 'album-3'
    };

    const queueRef = collection(db, "rooms", VALID_CODE, "queue");
    addDocumentNonBlocking(queueRef, {
      song,
      requesterName: `${studentNum}번 학생`,
      timestamp: serverTimestamp(),
      status: queue.length === 0 ? 'playing' : 'pending'
    });

    toast({
      title: "신청 완료!",
      description: `${finalTitle} 곡이 대기열에 추가되었습니다.`,
    });
    
    setIsRequesting(false);
  };

  const handleSkip = () => {
    if (!db || !isJoined || queue.length === 0 || !isAdmin) return;
    
    const playingItem = queue.find(r => r.status === 'playing') || queue[0];
    const historyRef = collection(db, "rooms", VALID_CODE, "history");

    addDocumentNonBlocking(historyRef, {
      ...playingItem,
      status: 'completed',
      timestamp: serverTimestamp()
    });

    deleteDocumentNonBlocking(doc(db, "rooms", VALID_CODE, "queue", playingItem.id));

    const nextItem = queue.find(r => r.id !== playingItem.id && r.status === 'pending');
    if (nextItem) {
      updateDocumentNonBlocking(doc(db, "rooms", VALID_CODE, "queue", nextItem.id), {
        status: 'playing'
      });
    }
  };

  const handleRemove = (id: string) => {
    if (!db || !isJoined || !isAdmin) return;
    const itemToRemove = queue.find(r => r.id === id);
    const isPlaying = itemToRemove?.status === 'playing';
    
    deleteDocumentNonBlocking(doc(db, "rooms", VALID_CODE, "queue", id));
    
    if (isPlaying) {
      const nextItem = queue.find(r => r.id !== id && r.status === 'pending');
      if (nextItem) {
        updateDocumentNonBlocking(doc(db, "rooms", VALID_CODE, "queue", nextItem.id), {
          status: 'playing'
        });
      }
    }
  };

  const handleAiSelect = (query: string) => {
    setSearchQuery(query);
  };

  const recentTrackStrings = useMemo(() => {
    return [...history, ...queue].slice(0, 5).map(r => `${r.song.artist} - ${r.song.title}`);
  }, [queue, history]);

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
        </div>

        <Card className="w-full max-w-md bg-white/[0.03] border-white/10 backdrop-blur-2xl shadow-2xl relative z-10">
          <CardContent className="p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-[2rem] flex items-center justify-center shadow-2xl shadow-accent/20 mb-8 animate-in zoom-in-50 duration-500">
              <Headphones className="text-white w-10 h-10" />
            </div>
            
            <h1 className="text-3xl font-black tracking-tighter mb-2">
              TUNE<span className="text-accent italic">DIAL</span> CLASS
            </h1>
            <p className="text-muted-foreground text-sm font-medium mb-10">
              우리 반 음악실에 입장하려면 <br/> 방 번호를 입력하세요.
            </p>

            <form onSubmit={handleJoin} className="w-full space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="방 번호 4자리"
                  className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-center text-xl font-bold tracking-[0.5em] focus:ring-accent focus:border-accent"
                  value={entryCode}
                  onChange={(e) => setEntryCode(e.target.value)}
                  maxLength={4}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl transition-all shadow-lg shadow-accent/20 text-lg group"
                disabled={entryCode.length < 4 || isUserLoading}
              >
                {isUserLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    입장하기
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {requestError && (
              <p className="mt-4 text-destructive text-sm font-bold animate-pulse">
                {requestError}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white selection:bg-accent selection:text-white font-body">
      <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#0a0a0b]/80 backdrop-blur-2xl">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Headphones className="text-white w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tighter leading-none">
                TUNE<span className="text-accent italic">DIAL</span>
              </h1>
            </div>
          </div>

          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent" />
            <Input
              type="text"
              placeholder="음악 검색 (AI 추천 참고)..."
              className="w-full pl-11 h-11 bg-white/[0.03] border-white/10 rounded-xl focus:ring-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAdmin && (
              <Badge variant="outline" className="border-accent text-accent animate-pulse font-black px-2 py-1">
                <ShieldCheck className="w-3 h-3 mr-1" /> MANAGER MODE
              </Badge>
            )}
             <Button variant="ghost" size="sm" onClick={() => setIsJoined(false)} className="text-xs text-muted-foreground hover:text-white">
               나가기
             </Button>
            <div className="w-px h-6 bg-white/10" />
            <Volume2 className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-white" />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-10">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
          
          <div className="space-y-12">
            <section className="relative rounded-[2rem] overflow-hidden group min-h-[220px] flex items-end">
              <div className="absolute inset-0 z-0">
                <Image 
                  src={heroImage.imageUrl} 
                  alt="Studio" 
                  fill 
                  className="object-cover opacity-30"
                  data-ai-hint={heroImage.imageHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/20 to-transparent" />
              </div>
              
              <div className="relative z-10 p-8 lg:p-10">
                <Badge className="mb-4 bg-accent/20 text-accent font-bold px-3 py-1 rounded-full text-[10px] border-accent/30 backdrop-blur-sm">CLASS RADIO</Badge>
                <h2 className="text-4xl lg:text-5xl font-black mb-2 tracking-tighter leading-tight">
                  유튜브 링크로 신청하는 <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent italic">우리 반 플레이리스트</span>
                </h2>
              </div>
            </section>

            <RequestInput onRequest={handleRequest} isRequesting={isRequesting} />
          </div>

          <aside className="space-y-8">
            <div className="sticky top-28 space-y-8">
              <RequestQueue 
                queue={queue} 
                onSkip={handleSkip} 
                onRemove={handleRemove}
                isAdmin={isAdmin}
                onAdminClick={() => !isAdmin && setShowAdminDialog(true)}
              />
              
              <AiRecommender recentRequests={recentTrackStrings} onSelect={handleAiSelect} />

              <Card className="border-muted/30 bg-card/20 backdrop-blur-md overflow-hidden">
                <CardHeader className="pb-3 border-b border-white/5 bg-white/[0.02]">
                  <CardTitle className="text-sm flex items-center justify-between font-black italic tracking-tighter">
                    <div className="flex items-center gap-2">
                      <History className="text-accent h-4 w-4" />
                      RECENTLY PLAYED
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[250px]">
                    <div className="divide-y divide-white/5">
                      {history.length > 0 ? (
                        history.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => setViewingVideo(item.song)}
                            className="p-4 flex items-center gap-3 hover:bg-accent/10 transition-all cursor-pointer group active:scale-[0.98]"
                          >
                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors relative">
                              {item.song.youtubeUrl ? (
                                <Youtube className="w-4 h-4 text-red-500" />
                              ) : (
                                <Music2 className="w-4 h-4 text-muted-foreground/50" />
                              )}
                              <PlayCircle className="absolute inset-0 w-full h-full text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate leading-none mb-1 group-hover:text-accent transition-colors">{item.song.title}</p>
                              <p className="text-[10px] text-muted-foreground font-medium truncate uppercase">{item.song.artist}</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <div className="text-[9px] text-muted-foreground font-code whitespace-nowrap mb-1">
                                {formatDistanceToNow(item.timestamp, { addSuffix: false })} ago
                              </div>
                              <RotateCcw 
                                className="w-3 h-3 text-accent/50 hover:text-accent transition-colors" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.song.youtubeUrl) {
                                    handleRequest(item.song.youtubeUrl, item.requesterName.replace("번 학생", ""));
                                  }
                                }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center text-muted-foreground/30 flex flex-col items-center gap-2">
                          <Clock className="w-8 h-8 opacity-20" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">No history yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </main>

      <Dialog open={!!viewingVideo} onOpenChange={(open) => !open && setViewingVideo(null)}>
        <DialogContent className="max-w-4xl bg-[#0a0a0b] border-white/10 p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 bg-white/[0.02] border-b border-white/5">
            <DialogTitle className="flex items-center gap-3 font-black italic tracking-tighter text-xl">
              <Youtube className="text-red-500 w-6 h-6" />
              {viewingVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black">
            {viewingVideo?.youtubeUrl && (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYoutubeId(viewingVideo.youtubeUrl)}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
          <div className="p-6 flex items-center justify-between bg-white/[0.02]">
            <div>
              <p className="text-sm font-bold text-accent uppercase tracking-widest">{viewingVideo?.artist}</p>
              <p className="text-xs text-muted-foreground">이전 재생 기록 다시 보기</p>
            </div>
            <Button 
              variant="outline" 
              className="border-accent/30 text-accent hover:bg-accent/10 font-bold"
              onClick={() => {
                if (viewingVideo?.youtubeUrl) {
                  handleRequest(viewingVideo.youtubeUrl, "기존");
                  setViewingVideo(null);
                }
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              재신청하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="max-w-md bg-[#0a0a0b] border-white/10 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black italic tracking-tighter text-2xl">
              <Lock className="text-accent w-6 h-6" />
              MANAGER ACCESS
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              동영상 재생 및 관리 기능을 활성화하려면 <br/> 비밀번호를 입력하세요.
            </p>
            <form onSubmit={handleAdminAuth}>
              <Input
                type="password"
                placeholder="비밀번호 입력"
                className="h-14 bg-white/5 border-white/10 rounded-xl text-center text-xl tracking-[0.2em] focus:ring-accent"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
              />
            </form>
          </div>
          <DialogFooter>
            <Button 
              className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl"
              onClick={handleAdminAuth}
            >
              권한 활성화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
