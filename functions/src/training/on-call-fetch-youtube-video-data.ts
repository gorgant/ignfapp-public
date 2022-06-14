import * as functions from 'firebase-functions';
import { SecretsManagerKeyNames } from '../../../shared-models/environments/env-vars.model';
import * as Axios from 'axios';
import { submitHttpRequest } from '../config/global-helpers';
import { YoutubeVideoData } from '../../../shared-models/youtube/youtube-video-data.model';

const executeActions = async (videoId: string): Promise<YoutubeVideoData> => {
  const youtubeApiKey = process.env[SecretsManagerKeyNames.YOUTUBE_DATA_API_V3_FETCH];
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

  return youtubeApiResponse as YoutubeVideoData;
}


/////// DEPLOYABLE FUNCTIONS ///////
const functionConfig: functions.RuntimeOptions = {
  secrets: [SecretsManagerKeyNames.YOUTUBE_DATA_API_V3_FETCH]
}

export const onCallFetchYoutubeVideoData = functions.runWith(functionConfig).https.onCall( async (videoId: string): Promise<YoutubeVideoData> => {

  functions.logger.log(`Fetch Youtube Video data with this data`, videoId);

  const youtubeVideoData =  await executeActions(videoId);
  
  return youtubeVideoData;
});
