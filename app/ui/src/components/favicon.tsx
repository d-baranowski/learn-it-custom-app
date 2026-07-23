import React from 'react';
import Head from "next/head";
import {config} from "~/config";

interface Props {

}

const Favicon: React.FunctionComponent<Props> = function Favicon() {
  return (
    <Head>
      <link
        rel="icon"
        href={config.BRAND_FAVICON}
        type="image/x-icon"
      />
    </Head>
  );
};

export default Favicon;
