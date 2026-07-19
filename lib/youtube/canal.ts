import { chamarYoutubeApi } from "./oauth";

interface ChannelsListResponse {
  items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[];
}

export async function obterUploadsPlaylistId(channelId: string): Promise<string> {
  const data = await chamarYoutubeApi<ChannelsListResponse>("channels", {
    part: "contentDetails",
    id: channelId,
  });
  const playlistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) {
    throw new Error(`Uploads playlist não encontrada para o canal ${channelId}`);
  }
  return playlistId;
}

export interface VideoDoCanal {
  videoId: string;
  titulo: string;
  publicadoEm: string;
  thumbnailUrl: string | null;
}

type Thumbnails = Record<string, { url?: string } | undefined>;

// Maior resolução disponível: maxres (1280x720) nem sempre existe, então
// a cascata segue a ordem oficial da Data API até o default.
export function melhorThumbnail(thumbnails: Thumbnails | undefined): string | null {
  for (const nivel of ["maxres", "standard", "high", "medium", "default"]) {
    const url = thumbnails?.[nivel]?.url;
    if (url) return url;
  }
  return null;
}

interface PlaylistItemsResponse {
  items?: {
    snippet?: { title?: string; thumbnails?: Thumbnails };
    contentDetails?: { videoId?: string; videoPublishedAt?: string };
  }[];
  nextPageToken?: string;
}

// Lista todos os vídeos da uploads playlist, seguindo o nextPageToken
// até acabar (Manual das Ferramentas: "não esquecer a paginação").
export async function listarVideosDoCanal(
  uploadsPlaylistId: string
): Promise<VideoDoCanal[]> {
  const videos: VideoDoCanal[] = [];
  let pageToken = "";

  do {
    const data = await chamarYoutubeApi<PlaylistItemsResponse>("playlistItems", {
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });

    for (const item of data.items ?? []) {
      const videoId = item.contentDetails?.videoId;
      const titulo = item.snippet?.title;
      const publicadoEm = item.contentDetails?.videoPublishedAt;
      if (videoId && titulo && publicadoEm) {
        videos.push({
          videoId,
          titulo,
          publicadoEm,
          thumbnailUrl: melhorThumbnail(item.snippet?.thumbnails),
        });
      }
    }

    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  return videos;
}
