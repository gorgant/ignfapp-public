import { logger } from 'firebase-functions/v2';
import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { submitHttpRequest } from '../config/global-helpers';
import { YoutubeVideoDataCompact, YoutubeVideoDataRaw } from '../../../shared-models/youtube/youtube-video-data.model';
import { findPublicTrainingSessionByVideoId } from './find-session-by-video-id';
import { SocialUrlPrefixes } from '../../../shared-models/meta/social-urls.model';
import { Duration } from 'luxon';
import { youtubeApiSecret } from '../config/api-key-config';
import { AxiosRequestConfig } from 'axios';

const executeActions = async (videoId: string): Promise<YoutubeVideoDataRaw> => {
  // Guide to setting secrets using firebase CLI: https://firebase.google.com/docs/functions/config-env
  // const youtubeApiKey = process.env[SecretsManagerKeyNames.YOUTUBE_DATA_API_V3_FETCH];
  // See api here: // https://developers.google.com/youtube/v3/docs/videos/list
  const requestUrl = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails&id=${videoId}&key=${youtubeApiSecret.value()}`;

  // logger.log(`Snippit of YT Key ${youtubeApiSecret.value().substring(1,3)}...`, );

  const requestOptions: AxiosRequestConfig = {
    method: 'GET',
    url: requestUrl,
    headers: 
      { 
        'content-type': 'application/json',
      }
  };
  
  logger.log('Getting Youtube video data with these options', requestOptions);

  const youtubeApiResponse = await submitHttpRequest(requestOptions)
    .catch(err => {logger.log(`Error with Youtube API request:`, err); throw new HttpsError('internal', err);});

  return youtubeApiResponse as YoutubeVideoDataRaw;
}

const convertRawDataToCompactData = (rawVideoData: YoutubeVideoDataRaw): YoutubeVideoDataCompact => {
  
  const thumbnailUrlDefault = rawVideoData.items[0].snippet.thumbnails.default?.url; // 120px, has black bars
  const thumbnailUrlMedium = rawVideoData.items[0].snippet.thumbnails.medium?.url; // 320px, no black bars
  const thumbnailUrlHigh = rawVideoData.items[0].snippet.thumbnails.high?.url; // 480px, has black bars
  const thumbnailUrlStandard = rawVideoData.items[0].snippet.thumbnails.standard?.url; //640px, has black bars
  const thumbnailUrlMaxRes = rawVideoData.items[0].snippet.thumbnails.maxres?.url; // 1280px, no black bars


  const compactThumbnail = thumbnailUrlMedium ? thumbnailUrlMedium : thumbnailUrlMaxRes ? thumbnailUrlMaxRes : thumbnailUrlStandard ? thumbnailUrlStandard : thumbnailUrlHigh ? thumbnailUrlHigh : thumbnailUrlDefault;
  const maxResThumbnail = thumbnailUrlMaxRes ? thumbnailUrlMaxRes : thumbnailUrlStandard ? thumbnailUrlStandard : thumbnailUrlHigh ? thumbnailUrlHigh : thumbnailUrlMedium ? thumbnailUrlMedium : thumbnailUrlDefault;
  
  const durationIso = rawVideoData.items[0].contentDetails.duration;
  const durationMs = Duration.fromISO(durationIso).toMillis();

  const compactVideoData: YoutubeVideoDataCompact = {
    channelId: rawVideoData.items[0].snippet.channelId,
    channelTitle: rawVideoData.items[0].snippet.channelTitle,
    channelUrl: `${SocialUrlPrefixes.YOUTUBE_CHANNEL}/${rawVideoData.items[0].snippet.channelId}`,
    durationIso,
    durationMs,
    id: rawVideoData.items[0].id,
    title: rawVideoData.items[0].snippet.title,
    thumbnailUrlSmall: compactThumbnail,
    thumbnailUrlLarge: maxResThumbnail,
    videoUrl: `${SocialUrlPrefixes.YOUTUBE_VIDEO}/${rawVideoData.items[0].id}`
  }

  logger.log('Compact video data created', compactVideoData);
  return compactVideoData;
}


/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  secrets: [youtubeApiSecret],
  enforceAppCheck: true
};

export const onCallFetchYoutubeVideoData = onCall(callableOptions, async (request: CallableRequest<string>): Promise<YoutubeVideoDataCompact | null> => {

  const videoId = request.data;
  logger.log(`Fetch Youtube Video data request received with this data`, videoId);

  const existingTrainingSession = await findPublicTrainingSessionByVideoId(videoId);

  // Exit function if training session with that videoId already exists (prevents duplicates)
  if (existingTrainingSession) {
    logger.log('Matching public training session found, exiting function', existingTrainingSession);
    return null;
  }

  logger.log('No matching training session exists, proceeding to fetch Youtube Video Data');

  const rawYoutubeVideoData =  await executeActions(videoId);

  const compactYouTubeVideoData = convertRawDataToCompactData(rawYoutubeVideoData);
  
  return compactYouTubeVideoData;
});
