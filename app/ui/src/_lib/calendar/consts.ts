import {momentLocalizer} from "react-big-calendar";
import moment from "moment/moment";

export const localizer = momentLocalizer(moment);
// Any date works; only the time portion is used.
export const minCalendarTime = new Date(1970, 0, 1, 7, 0, 0);   // 07:00
export const maxCalendarTime = new Date(1971, 0, 1, 23, 0, 0);  // 23:00
