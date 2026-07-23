import type {FC} from 'react';
import Head from 'next/head';

interface SeoProps {
  prefix?: string;
  title?: string;
}

export const Seo: FC<SeoProps> = (props) => {
  const { prefix, title } = props;

  const fullTitle = title ? title + ' | Utro' : 'Utro';

  return (
    <Head>
      <title key="seo-title">{fullTitle}</title>
    </Head>
  );
};
