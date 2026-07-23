import apiProxy from "~/api-proxy";

// Make sure that we don't parse JSON bodies on this route:
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default apiProxy;
