"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Send, AlertCircle, Youtube, Info, User, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RequestInputProps {
  onRequest: (youtubeUrl: string, studentNum: string) => void;
  isRequesting?: boolean;
}

export function RequestInput({ onRequest, isRequesting }: RequestInputProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [studentNum, setStudentNum] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNum || !youtubeUrl || isRequesting) return;
    
    onRequest(youtubeUrl, studentNum);
    setYoutubeUrl("");
  };

  return (
    <Card className="border-accent/30 bg-primary/10 shadow-xl overflow-hidden backdrop-blur-md">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
              <Youtube className="text-accent h-6 w-6" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-xl">실시간 유튜브 신청</h3>
              <p className="text-xs text-muted-foreground">링크만 넣으면 AI가 제목을 찾아드립니다</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_160px] gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Youtube className="w-3 h-3 text-red-500" /> YouTube URL
              </Label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-14 border-white/10 bg-black/40 focus:ring-red-500 rounded-xl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={isRequesting}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="w-3 h-3 text-accent" /> 내 번호
              </Label>
              <Input
                placeholder="예: 15"
                className="h-14 border-white/10 bg-black/40 focus:ring-accent text-lg font-bold px-4 rounded-xl"
                value={studentNum}
                onChange={(e) => setStudentNum(e.target.value)}
                disabled={isRequesting}
              />
            </div>

            <Button 
              type="submit" 
              className="h-14 bg-accent hover:bg-accent/90 text-white font-black transition-all shadow-lg shadow-accent/30 rounded-xl"
              disabled={!youtubeUrl || !studentNum || isRequesting}
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  신청 전송
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
            <Info className="w-4 h-4 text-accent" />
            <p className="text-[10px] text-muted-foreground font-medium">신청 곡은 AI가 정보를 분석하여 대기열에 추가합니다. 재생은 관리자 화면에서 이루어집니다.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
