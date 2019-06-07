import React from 'react'
import { inject, observer } from 'mobx-react/native'
import { reaction } from 'mobx'
import { Alert, AppState } from 'react-native'
import { Toast } from 'native-base'
import { NavigationActions } from 'react-navigation'
import { defineMessages } from 'react-intl'
import OneSignal from 'react-native-onesignal'
import Sentry from 'sentry-expo'
import { eventSnapshotToJSON } from 'io/api'
import { REFRESH_AFTER_BACKGROUND } from 'config'

const newEventToast = defineMessages({
  button: {
    id: 'Notification.event.button',
    defaultMessage: 'Show'
  },
  text: {
    id: 'Notification.event.text',
    defaultMessage: 'New event received'
  }
})

let wentToBackground

const withNotificationManager = WrappedComponent => {
  const Component = class extends React.Component {
    state = {
      appState: AppState.currentState
    }

    componentWillMount() {
      // Handle App State
      AppState.addEventListener('change', this.handleAppStateChange)

      // Handle Notification received
      OneSignal.addEventListener('received', this.onReceived)
      OneSignal.addEventListener('opened', this.onOpened)

      // When authentication is done, check if user has
      //  event accepted, if yes navigate to event
      const { acceptedEventId } = this.props.currentUser
      this.handleAcceptedEventByUser(acceptedEventId)

      // If accepted event was changed during app usage,
      //  redirect user to accepted event page
      this.disposer = reaction(
        () => this.props.currentUser.acceptedEventId,
        this.handleAcceptedEventByUser
      )
    }

    componentWillUnmount() {
      this.disposer()
      AppState.removeEventListener('change', this.handleAppStateChange)
      OneSignal.removeEventListener('ids')
      OneSignal.removeEventListener('received', this.onReceived)
      OneSignal.removeEventListener('opened', this.onOpened)
    }

    onReceived = notification => {
      this.handleNotification(notification)
    }

    onOpened = ({ notification }) => {
      this.handleNotification({ ...notification, isOpenEvent: true })
    }

    onAppToForeground = () => {
      // Add all events back to store and reattach listeners
      //  That will included events that came in while in notification
      this.props.attachAllEvents()

      // If app stayed in foreground for more then 5 mins, refresh events
      if (
        wentToBackground &&
        Date.now() - wentToBackground > REFRESH_AFTER_BACKGROUND
      ) {
        this.props.loadLatestOpenEvents()
        wentToBackground = undefined
      }
    }

    onAppToBackground = () => {
      // Remove and store all events from store (that will also remove subscription)
      this.props.detachAllEvents()
      // Store when app went to background
      wentToBackground = Date.now()
    }

    handleAppStateChange = nextAppState => {
      if (
        this.state.appState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // console.log('App has come to the foreground!')
        this.onAppToForeground()
      }

      if (
        nextAppState.match(/inactive|background/) &&
        this.state.appState === 'active'
      ) {
        // console.log('App has come to the background!')
        this.onAppToBackground()
      }

      this.setState({ appState: nextAppState })
    }

    handleAcceptedEventByUser = eventId => {
      if (eventId) {
        // Add event
        this.props.addEventFromNotification({ eventId })
        // Navigate to it locked
        this.navigateToEvent(
          {
            eventId
          },
          true
        )
      }
    }

    navigateToEvent = (eventData, locked) => {
      let navigateAction = NavigationActions.navigate({
        routeName: 'Event',
        params: eventData
      })

      if (locked) {
        navigateAction = NavigationActions.reset({
          index: 0,
          actions: [
            NavigationActions.navigate({
              routeName: 'Event',
              params: eventData
            })
          ]
        })
      }

      this.props.navigation.dispatch(navigateAction)
    }

    handleNotification = ({
      isAppInFocus,
      payload: { additionalData },
      isOpenEvent
    }) => {
      try {
        if (!additionalData) {
          return
        }
        if (additionalData.type === 'event') {
          this.handleEventNotification(
            isAppInFocus,
            additionalData,
            isOpenEvent
          )
          return
        }

        if (additionalData.type === 'test') {
          Alert.alert(
            'בדיקת התראות',
            'ההתראות נבדקו ונמצאו תקינות. המערכת עודכנה עם תוצאות הבדיקה.',
            [{ text: 'OK', onPress: () => {} }],
            { cancelable: false }
          )
          // Acknowledge test on firebase
          this.props.currentUser.acknowledgeTestNotification()
        }
      } catch (error) {
        // If any error happens here, capture and avoid throwing out
        Sentry.captureException(error)
      }
    }

    handleEventNotification = (isAppInFocus, data, isOpenEvent) => {
      if (!data || !data.eventId) {
        throw new Error(
          `Notification is incomplete and lacking data, ignoring it : ${JSON.stringify(
            data
          )}`
        )
      }

      // Add event to store
      const { eventId, event } = data
      this.props.addEventFromNotification({
        eventId,
        initAsDetachedEvent: AppState.currentState === 'background',
        event: eventSnapshotToJSON(event)
      })

      if (isOpenEvent) {
        // If is open event, user touched notification, open it
        this.navigateToEvent({ eventId })
      } else if (AppState.currentState === 'active') {
        // The app is foregrounded and it is not an open event, show toast
        Toast.show({
          text: this.props.screenProps.intl.formatMessage(newEventToast.text),
          position: 'bottom',
          buttonText: this.props.screenProps.intl.formatMessage(
            newEventToast.button
          ),
          type: 'warning',
          duration: 10000,
          onClose: () => this.navigateToEvent({ eventId })
        })
      }
    }

    render() {
      const {
        currentUser,
        addEventFromNotification,
        detachAllEvents,
        attachAllEvents,
        loadLatestOpenEvents,
        ...other
      } = this.props

      return <WrappedComponent {...other} />
    }
  }

  // As described at https://github.com/react-community/react-navigation/issues/90
  Component.router = WrappedComponent.router

  return inject(({ stores }) => ({
    loadLatestOpenEvents: stores.eventStore.loadLatestOpenEvents,
    detachAllEvents: stores.eventStore.detachAllEvents,
    attachAllEvents: stores.eventStore.attachAllEvents,
    addEventFromNotification: stores.eventStore.addEventFromNotification,
    currentUser: stores.authStore.currentUser
  }))(observer(Component))
}

export default withNotificationManager
