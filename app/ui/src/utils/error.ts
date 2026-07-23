import {Code, ConnectError} from "@connectrpc/connect";

import {toast} from "react-hot-toast";

export const handleApiError = (err: any) => {
  try {
    const connectErr = ConnectError.from(err)

    switch (connectErr.code) {
      case Code.Unknown:
        toast.error('Unknown error: ' + connectErr.rawMessage);
        break;
      default:
        toast.error(connectErr.rawMessage);
    }
  } catch (e) {
    if (err instanceof Error) {
      toast.error(err.message);
    } else {
      console.error("An unexpected error occurred:", err);
      toast.error('An unexpected error occurred');
    }
  }
}