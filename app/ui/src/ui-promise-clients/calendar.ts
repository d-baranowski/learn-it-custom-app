import {createPromiseClient, PromiseClient} from "@connectrpc/connect";
import {CalendarService} from "@gen/core/v1/calendar_connect";
import {ConnectTransport} from "~/utils/connect";

const globalForConnect = globalThis as unknown as {
  calendarBackend: PromiseClient<typeof CalendarService> | undefined;
};

export const calendarBackend=
  globalForConnect.calendarBackend ??
  createPromiseClient(CalendarService, ConnectTransport);

if (process.env.NODE_ENV !== "production") globalForConnect.calendarBackend = calendarBackend;
