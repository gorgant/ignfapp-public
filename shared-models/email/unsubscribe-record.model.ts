import { Timestamp } from '@angular/fire/firestore';


// The base pair
export interface UnsubscribeRecord {
  unsubscribeTimestamp: number | Timestamp;
  asm_group_id?: number;
}

// The object containing any number of base pairs
export interface UnsubscribeRecordList {
  [key: number]: UnsubscribeRecord;
}
