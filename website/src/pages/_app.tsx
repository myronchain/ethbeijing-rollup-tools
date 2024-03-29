// ** Next Imports
import Head from 'next/head'
import {Router} from 'next/router'
import type {NextPage} from 'next'
import type {AppProps} from 'next/app'

// ** Loader Import
import NProgress from 'nprogress'

// ** Emotion Imports
import {CacheProvider} from '@emotion/react'
import type {EmotionCache} from '@emotion/cache'

// ** Config Imports
import themeConfig from 'src/configs/themeConfig'
import ThemeComponent from 'src/@core/theme/ThemeComponent'
// ** Contexts
import {SettingsConsumer, SettingsProvider} from 'src/@core/context/settingsContext'

// ** Utils Imports
import {createEmotionCache} from 'src/@core/utils/create-emotion-cache'

// ** React Perfect Scrollbar Style
import 'react-perfect-scrollbar/dist/css/styles.css'

// ** Global css styles
import '../../styles/globals.css'
import '../../styles/onboardStyles.css'
import Script from 'next/script'

// ** Extend App Props with Emotion
type ExtendedAppProps = AppProps & {
  Component: NextPage
  emotionCache: EmotionCache
}

const clientSideEmotionCache = createEmotionCache()

// ** Pace Loader
if (themeConfig.routingLoader) {
  Router.events.on('routeChangeStart', () => {
    NProgress.start()
  })
  Router.events.on('routeChangeError', () => {
    NProgress.done()
  })
  Router.events.on('routeChangeComplete', () => {
    NProgress.done()
  })
}

// ** Configure JSS & ClassName
const App = (props: ExtendedAppProps) => {
  const {Component, emotionCache = clientSideEmotionCache, pageProps} = props

  // Variables
  // @ts-ignore
  const getLayout = Component.getLayout ?? (page => <>{page}</>)

  return (
    <div suppressHydrationWarning>
      {
        typeof window === 'undefined' ? null :
          <CacheProvider value={emotionCache}>
            <Head>
              <title>{`${themeConfig.templateName}`}</title>
              <meta
                name='description'
                content={`${themeConfig.templateName}`}
              />
              <meta name='keywords' content=''/>
              <meta name='viewport' content='initial-scale=1, width=device-width'/>
              {/*<script src="https://www.google.com/recaptcha/api.js?render=6LcptqQkAAAAAF-Kg7NSMiwh2JOAOvhdVzql9yfW" defer></script>*/}
            </Head>

            <SettingsProvider>
              <SettingsConsumer>
                {({settings}) => {
                  return <ThemeComponent settings={settings}>{getLayout(<Component {...pageProps} />)}</ThemeComponent>
                }}
              </SettingsConsumer>
            </SettingsProvider>
          </CacheProvider>
      }
    </div>
  )
}

export default App
