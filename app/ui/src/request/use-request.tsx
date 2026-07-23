import {useRef} from "react";
import SelectBuilder from "~/request/select";
import {messages} from "@gen/factory";

export const useSelectRequest = <K extends keyof typeof messages>(key: K) => {
  return useRef<SelectBuilder<K>>(new SelectBuilder<K>(key));
}

