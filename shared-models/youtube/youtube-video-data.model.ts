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
            width: string, // 120px
            height: string
          },
          medium: {
            url: string,
            width: string, // 320px
            height: string
          },
          high: {
            url: string,
            width: string, // 480px
            height: string
          },
          standard: {
            url: string,
            width: string, // 640px
            height: string
          },
          maxres: {
            url: string,
            width: string, // 1280
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
  [YoutubeVideoDataKeys.ID]: string;
  title: string;
  thumbnailUrlSmall: string;
  thumbnailUrlLarge: string;
  videoUrl: string;
}

export enum YoutubeVideoDataKeys {
  ID = 'id',
  VIDEO_ID = 'videoId',
  VIDEO_URL = 'videoUrl',
  YOUTUBE_VIDEO_DATA_RETREIVED = 'youtubeVideoDataRetrieved'
}