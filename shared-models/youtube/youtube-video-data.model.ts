
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
  duration: string;
  id: string;
  title: string;
  thumbnailUrl: string;
}