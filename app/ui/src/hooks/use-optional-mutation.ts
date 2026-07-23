import type {Message, PartialMessage} from '@bufbuild/protobuf';
import type {UseMutationResult} from '@tanstack/react-query';
import type {ConnectError} from '@connectrpc/connect';
import {MethodUnaryDescriptor, useMutation, UseMutationOptions} from '@connectrpc/connect-query';

function useOptionalMutation<I extends Message<I>, O extends Message<O>>(methodSig?: MethodUnaryDescriptor<I, O>, opts?: UseMutationOptions<I, O>): UseMutationResult<O, ConnectError, PartialMessage<I>> {
  if (methodSig) {
    // Callers pass a constant methodSig per call site, so hook order is stable.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMutation(methodSig, opts);
  }

  const stub: UseMutationResult<O, ConnectError, PartialMessage<I>> = {
    variables: undefined as any,
    context: undefined,
    data: undefined as any,
    error: null,
    failureCount: 0,
    failureReason: null,
    isError: false,
    isIdle: false,
    isPaused: false,
    isPending: false,
    isSuccess: true,
    mutate(args: any): void {
    },
    mutateAsync(variables, options) {
      return Promise.reject(new Error('Not implemented'));
    },
    reset(): void {
    },
    status: 'success',
    submittedAt: 0
  };

  return stub;
}

export default useOptionalMutation;
