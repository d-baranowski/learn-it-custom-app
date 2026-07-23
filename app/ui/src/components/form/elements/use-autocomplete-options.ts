/**
 * useAutocompleteOptions — non-form-bound entity autocomplete loader.
 *
 * Used by view components that want an entity picker without a surrounding
 * form (calendar filters, working-hours selector). For form-bound usage
 * prefer `RpgAutocompleteFe` and the per-entity wrappers.
 */

import { useCallback, useMemo } from 'react';
import {
  MethodUnaryDescriptor,
  callUnaryMethod,
  createConnectQueryKey,
  useTransport,
} from '@connectrpc/connect-query';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import {
  AutocompleteRequest,
  AutocompleteResponse,
} from '@gen/request/v1/base_pb';

export interface AutocompleteOption {
  id: string;
  label: string;
}

const DEFAULT_REQUEST = new AutocompleteRequest({});

function localiseLabel(
  rawLabel: string,
  language: string,
  t: (key: string) => string
): string {
  try {
    const parsed = JSON.parse(rawLabel);
    if (
      parsed &&
      typeof parsed === 'object' &&
      ('en' in parsed || 'pl' in parsed || 'vi' in parsed)
    ) {
      return parsed[language] ?? parsed.en ?? parsed.pl ?? parsed.vi ?? rawLabel;
    }
  } catch {
    // not JSON, fall through
  }
  return t(rawLabel);
}

export function useAutocompleteOptions(
  query: MethodUnaryDescriptor<AutocompleteRequest, AutocompleteResponse>,
  request?: AutocompleteRequest
): { options: AutocompleteOption[]; isLoading: boolean; refetch: () => void } {
  const { t, i18n } = useTranslation('common');
  const transport = useTransport();
  const effectiveRequest = request ?? DEFAULT_REQUEST;
  const queryKey = useMemo(
    () => [...createConnectQueryKey(query, effectiveRequest), i18n.language] as const,
    [query, effectiveRequest, i18n.language]
  );
  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => callUnaryMethod(query, effectiveRequest, { transport }),
  });

  const triggerRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);

  const options = useMemo<AutocompleteOption[]>(() => {
    if (!data) return [];
    return (
      data.items?.map((o) => ({
        id: o.ID,
        label: localiseLabel(o.label, i18n.language ?? 'en', t),
      })) ?? []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, i18n.language]);

  return { options, isLoading, refetch: triggerRefetch };
}
