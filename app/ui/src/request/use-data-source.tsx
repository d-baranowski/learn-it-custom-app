import {SelectRequest} from "@gen/request/v1/base_pb";
import {Message} from "@bufbuild/protobuf";
import {MethodUnaryDescriptor, useQuery} from "@connectrpc/connect-query";
import SelectBuilder from "~/request/select";
import {messages} from "@gen/factory";

const useDataSource = <O extends Message<O>, K extends keyof typeof messages>(query: MethodUnaryDescriptor<SelectRequest, O>, builder: SelectBuilder<K>) => {
  const {
    data,
    isLoading, isError,
    error,
    refetch
  } = useQuery(query, builder.request, {
    enabled: builder.request !== undefined,
    callOptions: {
      headers: builder.headers,
    }
  });

  if (isError) {
    console.error('Query Error:', error);
  }
  //
  // React.useEffect(() => {
  //   if (error?.message?.length || 0 > 0) {
  //     toast.error("Error while fetching data: " + error?.message)
  //   }
  // }, [error])

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export default useDataSource;
