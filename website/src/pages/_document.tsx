// ** React Import
import {Children} from 'react'

// ** Next Import
import Document, {Head, Html, Main, NextScript} from 'next/document'

// ** Emotion Imports
import createEmotionServer from '@emotion/server/create-instance'

// ** Utils Imports
import {createEmotionCache} from 'src/@core/utils/create-emotion-cache'

class CustomDocument extends Document {
  render() {
    return (
      <Html lang='en'>
        <Head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-59Z6ZLZ');
            `,
            }}
          />
          <link rel='preconnect' href='https://fonts.googleapis.com'/>
          <link rel='preconnect' href='https://fonts.gstatic.com'/>
          {/*<link*/}
          {/*  rel='stylesheet'*/}
          {/*  href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'*/}
          {/*/>*/}
          <link
            href="https://fonts.googleapis.com/css2?family=Oxanium:wght@200;300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
          {/*<link rel='apple-touch-icon' sizes='180x180' href='/images/apple-touch-icon.png' />*/}
          <link rel='shortcut icon' href='/images/favicon.svg'/>
        </Head>
        <body>
        <Main/>
        <NextScript/>
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-59Z6ZLZ" height="0" width="0" style="display: none; visibility: hidden;" />`,
          }}
        />
        </body>
      </Html>
    )
  }
}

CustomDocument.getInitialProps = async ctx => {
  const originalRenderPage = ctx.renderPage
  const cache = createEmotionCache()
  const {extractCriticalToChunks} = createEmotionServer(cache)

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: App => props =>
        (
          <App
            {...props} // @ts-ignore
            emotionCache={cache}
          />
        )
    })

  const initialProps = await Document.getInitialProps(ctx)
  const emotionStyles = extractCriticalToChunks(initialProps.html)
  const emotionStyleTags = emotionStyles.styles.map(style => {
    return (
      <style
        key={style.key}
        dangerouslySetInnerHTML={{__html: style.css}}
        data-emotion={`${style.key} ${style.ids.join(' ')}`}
      />
    )
  })

  return {
    ...initialProps,
    styles: [...Children.toArray(initialProps.styles), ...emotionStyleTags]
  }
}

export default CustomDocument
