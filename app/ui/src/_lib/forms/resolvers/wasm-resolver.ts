/**
 * wasm-resolver — adapter from the project's WASM validateMessage flow to
 * the FormResolver interface used by the new forms framework.
 *
 * Wraps the same proto+WASM mechanism as ~/components/form/wasm-resolver
 * but exposes the new shape (`validateField` / `validateAll` returning
 * Record<string, FieldError>) and consumes flat-keyed values via the
 * proto-bridge.
 *
 * Logging: deliberately silent on the happy path. Validation runs on every
 * blur — verbose console logs would flood the console under normal use.
 * Errors and unexpected states still log.
 */

import { Message } from '@bufbuild/protobuf';
import type { TFunction } from 'next-i18next';
import { RpgWindow } from '~/rpg';
import { waitForWasmReady } from '~/validation/initialise-wasm-validators';
import { buildProtoFromValues, ProtoConstructor } from '../proto/proto-bridge';
import type { FieldError } from '../state/forms-slice';
import type { FormResolver } from '../runtime/create-form-runtime';

// Map a WASM error message → i18n key. Same logic as the legacy resolver;
// extracted so both can use it during the transition. Returns the i18n key
// plus interpolation values, with the raw message as fallback.
export interface TranslationLookup {
  key: string;
  values?: Record<string, unknown>;
}

export function wasmMessageToTranslation(message: string): TranslationLookup {
  // field.required: "value is required" (exact — must not swallow custom CEL
  // messages that also contain "is required", e.g. "Office is required").
  if (message === 'value is required') return { key: 'validation.required' };

  // repeated.min_items: "value must contain at least 1 item(s)"
  const minItems = message.match(/must contain at least (\d+) item/);
  if (minItems) return { key: 'validation.min_items', values: { min: minItems[1] } };

  // string.min_len
  const minLen = message.match(/length must be at least (\d+) character/);
  if (minLen) return { key: 'validation.min_len', values: { min: minLen[1] } };

  // string.max_len
  const maxChars = message.match(/not be more than (\d+) character/);
  if (maxChars) return { key: 'validation.max_len', values: { max: maxChars[1] } };

  if (message.includes('greater than or equal')) {
    const m = message.match(/greater than or equal to (-?\d+)/);
    return { key: 'validation.gte', values: { value: m ? m[1] : '' } };
  }
  if (message.includes('greater than')) {
    const m = message.match(/greater than (-?\d+)/);
    return { key: 'validation.gt', values: { value: m ? m[1] : '' } };
  }
  if (message.includes('less than or equal')) {
    const m = message.match(/less than or equal to (-?\d+)/);
    return { key: 'validation.lte', values: { value: m ? m[1] : '' } };
  }
  if (message.includes('less than')) {
    const m = message.match(/less than (-?\d+)/);
    return { key: 'validation.lt', values: { value: m ? m[1] : '' } };
  }
  if (message.includes('valid email')) return { key: 'validation.email' };
  if (message.includes('valid uuid')) return { key: 'validation.uuid' };
  if (message.includes('one of')) return { key: 'validation.enum' };
  if (message.includes('does not match regex pattern')) return { key: 'validation.pattern' };

  return { key: message };
}

export type CustomValidationFn = (
  values: Record<string, unknown>,
  t?: TFunction
) => Record<string, string>;

export interface CreateWasmResolverOpts<T extends Message<T>> {
  protoConstructor: ProtoConstructor<T>;
  /** Optional i18n function. If absent, raw WASM messages are used. */
  t?: TFunction;
  /** Synchronous custom rules layered on top of proto validation. */
  customValidation?: CustomValidationFn;
}

interface WasmValidationResult {
  ok?: boolean;
  errors?: Array<{ fieldPath: string; message: string }>;
}

function translate(
  message: string,
  t: TFunction | undefined
): string {
  const { key, values } = wasmMessageToTranslation(message);
  return t ? (t(key, values) as string) : message;
}

export function createWasmResolver<T extends Message<T>>(
  opts: CreateWasmResolverOpts<T>
): FormResolver {
  const validateAll = async (
    values: Record<string, unknown>
  ): Promise<Record<string, FieldError>> => {
    const errors: Record<string, FieldError> = {};

    let proto: Message<T>;
    try {
      proto = buildProtoFromValues(opts.protoConstructor, values);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors['_form'] = {
        type: 'proto_build_error',
        message: `Could not build proto for validation: ${message}`,
        path: '_form',
      };
      return errors;
    }

    const w = window as unknown as RpgWindow;
    if (!w.validateMessage) {
      try {
        await waitForWasmReady();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors['_form'] = {
          type: 'wasm_unavailable',
          message: `Form validation is unavailable: ${message}`,
          path: '_form',
        };
        return errors;
      }
    }
    if (!w.validateMessage) {
      errors['_form'] = {
        type: 'wasm_unavailable',
        message: 'Form validation is unavailable. Please reload the page.',
        path: '_form',
      };
      return errors;
    }

    const json = proto.toJson({ useProtoFieldName: true }) as Record<string, unknown>;
    const toValidate = { ...json, '@type': proto.getType().typeName };

    let result: WasmValidationResult | undefined;
    try {
      result = w.validateMessage(JSON.stringify(toValidate)) as WasmValidationResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors['_form'] = {
        type: 'wasm_threw',
        message: `WASM validator threw: ${message}`,
        path: '_form',
      };
      return errors;
    }

    if (result?.errors?.length) {
      for (const e of result.errors) {
        errors[e.fieldPath] = {
          type: 'wasm',
          message: translate(e.message, opts.t),
          path: e.fieldPath,
        };
      }
    } else if (result && !result.ok && Object.keys(errors).length === 0) {
      errors['_form'] = {
        type: 'wasm_unknown',
        message: 'Validation failed (no field-level details available).',
        path: '_form',
      };
    }

    if (opts.customValidation) {
      const custom = opts.customValidation(values, opts.t);
      for (const name in custom) {
        // Custom validation overrides WASM for the same field.
        errors[name] = {
          type: 'custom',
          message: custom[name],
          path: name,
        };
      }
    }

    return errors;
  };

  const validateField = async (
    name: string,
    _value: unknown,
    allValues: Record<string, unknown>
  ): Promise<FieldError | null> => {
    // The WASM validator is whole-message; we run it and extract the error
    // for this field. Slightly wasteful but semantically correct, and the
    // 200ms blur debounce in the validation middleware coalesces rapid blurs.
    const all = await validateAll(allValues);
    return all[name] ?? null;
  };

  return { validateField, validateAll };
}
