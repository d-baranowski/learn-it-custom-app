import moment from 'moment';

export function dayKey(date: Date): string {
  return moment(date).format('YYYY-MM-DD');
}
