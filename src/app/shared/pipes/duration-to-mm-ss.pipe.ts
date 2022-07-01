import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from 'luxon';

@Pipe({
  name: 'durationToMmSs'
})
export class DurationToMmSsPipe implements PipeTransform {

  transform(duration: string): unknown {
    if (duration.includes('H')) {
      return Duration.fromISO(duration).toFormat('hh:mm:ss');
    } else {
      return Duration.fromISO(duration).toFormat('mm:ss');
    }
  }

}
