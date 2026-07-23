import {MRT_ColumnDef} from 'material-react-table';
import {anyCell} from "~/_lib/grid/columns/any";
import {booleanCell} from "~/_lib/grid/columns/boolean";
import {enumArrayCell, enumCell} from "~/_lib/grid/columns/enum";
import {googleTimestampCell} from "~/_lib/grid/columns/google_timestamp";
import {numberArrayCell, stringArrayCell} from "~/_lib/grid/columns/array";
import {dateTimeCell} from "~/_lib/grid/columns/date_time_column";
import {timeCell} from "~/_lib/grid/columns/time";
import {dateCell} from "~/_lib/grid/columns/date";
import {dateStringCell} from "~/_lib/grid/columns/date_string";
import {imageCell} from './image';
import {hourminutesCell} from './hour_minute';
import {imageMultipleCell} from './image_multiple';
import {translatedStringCell} from "~/_lib/grid/columns/translated_string";
import {translatedStringArrayCell} from "~/_lib/grid/columns/translated_string_array";
import {colorCell} from './color';
import {profilePictureCell} from "~/_lib/grid/columns/profile_picture";
import {therapyDaysCell} from '~/_lib/grid/columns/therapy_days';
import {roomOrOnlineCell} from '~/_lib/grid/columns/room_or_online';
import {customersCell} from '~/_lib/grid/columns/customers';
import {notificationStatusCell} from '~/_lib/grid/columns/notification_status';
import {notificationRecipientCell} from '~/_lib/grid/columns/notification_recipient';

export type CellRenderer = MRT_ColumnDef<any, any>['Cell'];

const cell_renderers = {
  any: anyCell,
  boolean: booleanCell,
  color: colorCell,
  date: dateCell,
  dateString: dateStringCell,
  dateTime: dateTimeCell,
  enum: enumCell,
  enumArray: enumArrayCell,
  googleTimestamp: googleTimestampCell,
  hourMinutes: hourminutesCell,
  image: imageCell,
  imageMultiple: imageMultipleCell,
  numberArray: numberArrayCell,
  stringArray: stringArrayCell,
  time: timeCell,
  translatedString: translatedStringCell,
  translatedStringArray: translatedStringArrayCell,
  profilePicture: profilePictureCell,
  therapyDays: therapyDaysCell,
  roomOrOnline: roomOrOnlineCell,
  customers: customersCell,
  notificationStatus: notificationStatusCell,
  notificationRecipient: notificationRecipientCell,
};

export type CellRendererName = keyof typeof cell_renderers

export default cell_renderers;
