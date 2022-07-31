import * as functions from 'firebase-functions';
import { SecretsManagerKeyNames } from '../../../shared-models/environments/env-vars.model';
import * as Axios from 'axios';
import { submitHttpRequest } from '../config/global-helpers';
import { YoutubeVideoDataCompact, YoutubeVideoDataRaw } from '../../../shared-models/youtube/youtube-video-data.model';
import { findSessionByVideoId } from './find-session-by-video-id';
import { SocialUrlPrefixes } from '../../../shared-models/meta/social-urls.model';
import { Duration } from 'luxon';

const executeActions = async (videoId: string): Promise<YoutubeVideoDataRaw> => {
  const youtubeApiKey = process.env[SecretsManagerKeyNames.YOUTUBE_DATA_API_V3_FETCH];
  // See api here: // https://developers.google.com/youtube/v3/docs/videos/list
  const requestUrl = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails&id=${videoId}&key=${youtubeApiKey}`;

  const requestOptions: Axios.AxiosRequestConfig = {
    method: 'GET',
    url: requestUrl,
    headers: 
      { 
        'content-type': 'application/json',
      }
  };
  
  functions.logger.log('Getting Youtube video data with these options', requestOptions);

  const youtubeApiResponse = await submitHttpRequest(requestOptions)
    .catch(err => {functions.logger.log(`Error with Youtube API request:`, err); throw new functions.https.HttpsError('internal', err);});

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

  functions.logger.log('Compact video data created', compactVideoData);
  return compactVideoData;
}


/////// DEPLOYABLE FUNCTIONS ///////
const functionConfig: functions.RuntimeOptions = {
  secrets: [SecretsManagerKeyNames.YOUTUBE_DATA_API_V3_FETCH]
}

export const onCallFetchYoutubeVideoData = functions.runWith(functionConfig).https.onCall( async (videoId: string): Promise<YoutubeVideoDataCompact | null> => {

  functions.logger.log(`Fetch Youtube Video data request received with this data`, videoId);

  const existingTrainingSession = await findSessionByVideoId(videoId);

  // Exit function if training session with that videoId already exists (prevents duplicates)
  if (existingTrainingSession) {
    functions.logger.log('Matching training session found, exiting function', existingTrainingSession);
    return null;
  }

  functions.logger.log('No matching training session exists, proceeding to fetch Youtube Video Data');

  const rawYoutubeVideoData =  await executeActions(videoId);

  const compactYouTubeVideoData = convertRawDataToCompactData(rawYoutubeVideoData);
  
  return compactYouTubeVideoData;
});
