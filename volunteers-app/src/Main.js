import React, { Component } from 'react'
import EmailPassAuthenticationScreen from 'screens/Authentication/EmailPass'
import { inject, observer } from 'mobx-react/native'
import { Root, Toast } from 'native-base'
import { Alert } from 'react-native'
import { injectIntl, defineMessages } from 'react-intl'
import AuthenticatedDrawer from 'layouts/AuthenticatedDrawer'
import LoadingMask from 'components/LoadingMask'

const offline = defineMessages({
  title: {
    id: 'Offline.alert.title',
    defaultMessage: 'No Connection'
  },
  description: {
    id: 'Offline.alert.description',
    defaultMessage:
      'Your device is currently disconnected and we are unable to authenticate the logged in user. Please make sure you have a working internet connection to use this application.'
  }
})

const mute = {
  [true]: defineMessages({
    text: {
      id: 'Home.alert.mute.text',
      defaultMessage: 'Notifications are muted for 24h'
    },
    buttonText: {
      id: 'Home.alert.mute.buttonText',
      defaultMessage: 'OK'
    }
  }),
  [false]: defineMessages({
    text: {
      id: 'Home.alert.unmute.text',
      defaultMessage: 'Notifications are now active'
    },
    buttonText: {
      id: 'Home.alert.mute.buttonText',
      defaultMessage: 'OK'
    }
  })
}

@observer
class Main extends Component {
  async componentWillMount() {
    const { intl, isAuthenticated, initAfterAuth } = this.props

    if (this.props.isOffline) {
      Alert.alert(
        intl.formatMessage(offline.title),
        intl.formatMessage(offline.description)
      )
    }

    if (isAuthenticated) {
      // If going authenticated, initalise Events store
      await initAfterAuth()
    }
  }

  async componentDidUpdate(prevProps) {
    const { isMuted, intl, isAuthenticated, initAfterAuth } = this.props
    if (
      typeof isMuted === 'boolean' &&
      typeof prevProps.isMuted === 'boolean' &&
      isMuted !== prevProps.isMuted
    ) {
      // Muted value was changed, show toast
      Toast.show({
        text: intl.formatMessage(mute[isMuted].text),
        position: 'bottom',
        buttonText: intl.formatMessage(mute[isMuted].buttonText),
        duration: 10000,
        type: isMuted ? 'danger' : 'success'
      })
    }

    if (isAuthenticated && !prevProps.isAuthenticated) {
      // If going authenticated, initalise Events store
      await initAfterAuth()
    }
  }

  render() {
    const { isAuthenticated, isLoading, ...screenProps } = this.props

    return (
      <Root>
        {isAuthenticated ? (
          <AuthenticatedDrawer screenProps={screenProps} />
        ) : (
          <EmailPassAuthenticationScreen />
        )}
        {isLoading && <LoadingMask />}
      </Root>
    )
  }
}

export default inject(({ stores }) => ({
  isAuthenticated: stores.authStore.isAuthenticated,
  toggleMute:
    stores.authStore.currentUser && stores.authStore.currentUser.toggleMute,
  isMuted: stores.authStore.currentUser && stores.authStore.currentUser.isMuted,
  isLoading: stores.isLoading,
  initAfterAuth: stores.eventStore.initAfterAuth,
  loadLatestOpenEvents: stores.eventStore.loadLatestOpenEvents,
  isLoadingEvents: stores.eventStore.isLoadingEvents,
  isOffline: stores.authStore.isOffline,
  drawerLockMode:
    stores.authStore.currentUser &&
    stores.authStore.currentUser.hasEventAssigned
      ? 'locked-closed'
      : 'unlocked'
}))(injectIntl(Main))
