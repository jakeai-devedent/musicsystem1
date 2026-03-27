
"use client";

import Image from "next/image";
import { Song } from "@/app/types/music";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Plus } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

interface SongCardProps {
  song: Song;
  onSelect?: (catalogNumber: string) => void;
}

export function SongCard({ song, onSelect }: SongCardProps) {
  const placeholder = PlaceHolderImages.find(img => img.id === song.imageUrl) || PlaceHolderImages[0];

  return (
    <div 
      className={cn(
        "group relative flex items-center gap-4 px-6 py-4 transition-all duration-200 cursor-pointer border-b border-white/[0.02] last:border-none",
        "hover:bg-white/[0.05] active:bg-white/[0.08]"
      )}
      onClick={() => onSelect?.(song.catalogNumber)}
    >
      {/* Catalog Number */}
      <div className="w-12 text-center">
        <span className="font-code font-black text-accent text-lg group-hover:scale-110 transition-transform inline-block">
          {song.catalogNumber}
        </span>
      </div>

      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-md">
        <Image 
          src={placeholder.imageUrl} 
          alt={song.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          data-ai-hint={placeholder.imageHint}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Plus className="text-white w-5 h-5" />
        </div>
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base truncate group-hover:text-accent transition-colors">
          {song.title}
        </h3>
        <p className="text-muted-foreground text-xs truncate uppercase tracking-tight font-medium">
          {song.artist}
        </p>
      </div>

      {/* Meta Info */}
      <div className="hidden md:flex items-center gap-6 text-muted-foreground">
        <Badge variant="outline" className="text-[10px] py-0 border-white/10 font-medium bg-white/5">
          {song.genre}
        </Badge>
        <div className="flex items-center gap-1.5 text-[11px] font-code min-w-[50px]">
          <Clock className="w-3.5 h-3.5 opacity-50" />
          {song.duration}
        </div>
      </div>

      {/* Action Hover */}
      <div className="w-8 flex justify-end">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <Plus className="text-accent w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
