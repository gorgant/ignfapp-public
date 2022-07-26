import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from 'luxon';

@Pipe({
  name: 'durationMsToMmSs'
})
export class DurationMsToMmSsPipe implements PipeTransform {

  transform(duration: number): unknown {
    
    if (duration >= 3600000) {
      return Duration.fromMillis(duration).toFormat('hh:mm:ss');
    } else {
      return Duration.fromMillis(duration).toFormat('mm:ss');
    }
  }

}
