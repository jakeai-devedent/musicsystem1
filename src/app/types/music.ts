
export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: string;
  imageUrl?: string;
  youtubeUrl?: string;
}

export interface RequestItem {
  id: string;
  song: Song;
  requesterName: string;
  timestamp: Date;
  status: 'pending' | 'playing' | 'completed';
}
