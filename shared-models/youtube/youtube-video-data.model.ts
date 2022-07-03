import { FormControl } from "@angular/forms"

export interface YoutubeVideoDataRaw {
  kind: string,
  etag: string,
  items: [
    {
      kind: string,
      etag: string,
      id: string,
      snippet: {
        publishedAt: string,
        channelId: string,
        title: string,
        description: string
        thumbnails: {
          default: {
            url: string
            width: string,
            height: string
          },
          medium: {
            url: string,
            width: string,
            height: string
          },
          high: {
            url: string,
            width: string,
            height: string
          },
          standard: {
            url: string,
            width: string,
            height: string
          }
        },
        channelTitle: string,
        tags: string[],
        categoryId: string,
        liveBroadcastContent: string,
        localized: {
          title: string,
          description: string
        },
        defaultAudioLanguage: string
      },
      contentDetails: {
        duration: string,
        dimension: string,
        definition: string,
        caption: 'true' | 'false',
        licensedContent: boolean,
        contentRating: {},
        projection: string
      }
    }
  ]
}

export interface YoutubeVideoDataCompact {
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  durationIso: string;
  durationMs: number;
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface YoutubeVideoDataForm {
  [YoutubeVideoDataKeys.VIDEO_URL]: FormControl<string | null>,
  [YoutubeVideoDataKeys.YOUTUBE_VIDEO_DATA_RETREIVED]: FormControl<boolean | null>,
}

export enum YoutubeVideoDataKeys {
  VIDEO_ID = 'videoId',
  VIDEO_URL = 'videoUrl',
  YOUTUBE_VIDEO_DATA_RETREIVED = 'youtubeVideoDataRetrieved'
}