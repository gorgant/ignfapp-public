import { Timestamp } from '@angular/fire/firestore';
import { GoogleCloudFunctionsTimestamp } from '../../shared-models/user/public-user.model';


// The base pair
export interface UnsubscribeRecord {
  unsubscribeTimestamp: number | Timestamp | GoogleCloudFunctionsTimestamp;
  asm_group_id?: number;
}

// The object containing any number of base pairs
export interface UnsubscribeRecordList {
  [key: number]: UnsubscribeRecord;
}
