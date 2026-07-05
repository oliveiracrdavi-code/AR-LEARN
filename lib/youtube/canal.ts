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
}

interface PlaylistItemsResponse {
  items?: {
    snippet?: { title?: string };
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
        videos.push({ videoId, titulo, publicadoEm });
      }
    }

    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  return videos;
}
