import React, { ReactElement } from 'react'
import type { DocumentContext, DocumentProps } from 'next/document'
import Document, { Head, Html, Main, NextScript } from 'next/document'
import Script from 'next/script'
import createEmotionServer from '@emotion/server/create-instance'
import { createEmotionCache } from '~/utils/emotion-cache'

interface CustomDocumentProps extends DocumentProps {
  emotionStyleTags: ReactElement[];
}

const CustomDocument = ({ emotionStyleTags, __NEXT_DATA__ }: CustomDocumentProps & { __NEXT_DATA__?: any }) => {
  const locale = __NEXT_DATA__?.locale || 'en'
  return (
    <Html lang={locale}>
      <Head>
        <meta
          name="emotion-insertion-point"
          content=""
        />
        <meta
          name="viewport"
          content="viewport-fit=cover, initial-scale=1, maximum-scale=1"
        />
        {/* Warning this will need updating if we make changes to lua-ls-client  */}
        <Script src="/wasm_exec.js" strategy="beforeInteractive" />
        {emotionStyleTags}
      </Head>
      <body>
      <Main />
      <NextScript />
      </body>
    </Html>
  )
}

CustomDocument.getInitialProps = async (ctx: DocumentContext) => {
  const originalRenderPage = ctx.renderPage
  const cache = createEmotionCache()
  // const session = await getSession(ctx);
  const { extractCriticalToChunks } = createEmotionServer(cache)

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) =>
        function EnhanceApp(props) {
          return (
            <App
              // @ts-ignore
              emotionCache={cache}
              {...props}
            />
          )
        },
    })

  const initialProps = await Document.getInitialProps(ctx)
  const emotionStyles = extractCriticalToChunks(initialProps.html)
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ))

  return {
    ...initialProps,
    emotionStyleTags,
  }
}

export default CustomDocument
