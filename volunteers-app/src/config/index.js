import { Constants } from 'expo'

const configByEnvironment = {
  test: {
    authCredentials: {
      // sandbox
      apiKey: 'AIzaSyDp5-02CpUQ5gyquZt2ZHSfnRjCKY5lZis',
      authDomain: 'yedidim-sandbox.firebaseapp.com',
      databaseURL: 'https://yedidim-sandbox.firebaseio.com',
      projectId: 'yedidim-sandbox',
      storageBucket: 'yedidim-sandbox.appspot.com',
      messagingSenderId: '918819260524'
    }
  },
  development: {
    // sandbox2
    authCredentials: {
      apiKey: 'AIzaSyAwKEsWodtnrprOhYXA5tFb9zbUnLqOBk4',
      authDomain: 'yedidim-sandbox-2.firebaseapp.com',
      databaseURL: 'https://yedidim-sandbox-2.firebaseio.com',
      projectId: 'yedidim-sandbox-2',
      storageBucket: 'yedidim-sandbox-2.appspot.com',
      messagingSenderId: '1011917548573'
    },
    functionsUrl: 'https://us-central1-yedidim-sandbox-2.cloudfunctions.net',
    oneSignalAppId: 'e5ef1cdc-a50b-430f-8fac-b7702740c59a'
  },
  production: {
    // production
    authCredentials: {
      apiKey: 'AIzaSyC6bf7YfKoompBlyjw382AJZOzTvLaY7P0',
      authDomain: 'yedidim-production.firebaseapp.com',
      databaseURL: 'https://yedidim-production.firebaseio.com',
      projectId: 'yedidim-production',
      storageBucket: 'yedidim-production.appspot.com',
      messagingSenderId: '33558411934'
    },
    functionsUrl: 'https://us-central1-yedidim-production.cloudfunctions.net',
    oneSignalAppId: '3d5d3aa3-eeda-473f-90dd-62691388f475'
  }
}

// If releaseChannel is not set, then application is not published, then use development
// If releaseChannel is set, application is published, use it if it is a valid channel (default means no releaseChannel defined which is production)
export const environment = () => {
  // const channel = Constants.manifest.releaseChannel || 'development'

  return 'production' //!/(test|development|production)/.test(channel) ? 'production' : channel
}

export const defaultLanguage = () => 'he'

export const firebaseCredentials = () =>
  configByEnvironment[environment()].authCredentials
export const firebaseFunctionsUrl = () =>
  configByEnvironment[environment()].functionsUrl
export const config = () => configByEnvironment[environment()]
export const hostingDomain = () =>
  environment() === 'production' ? 'yedidim-production' : 'yedidim-sandbox-2'

export const REFRESH_TIMEOUT = 15000
export const REFRESH_AFTER_BACKGROUND = 5 * 60 * 1000 // 5 mins

export default {
  firebaseCredentials,
  environment,
  firebaseFunctionsUrl,
  config
}
