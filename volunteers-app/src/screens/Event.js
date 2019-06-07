import React, { Component } from 'react'
import { inject, observer } from 'mobx-react/native'
import { FormattedMessage, defineMessages } from 'react-intl'
import { I18nManager, Alert, View, ActivityIndicator } from 'react-native'
import { trackEvent } from 'io/analytics'
import { NavigationActions } from 'react-navigation'

import {
  Button,
  Body,
  Header,
  Title,
  Left,
  Icon,
  Right,
  Text,
  Toast
} from 'native-base'
import EventDetails from 'components/EventDetails'
import ButtonsConfirmationBar from 'components/ButtonsConfirmationBar'
import TakenEventButtons from 'components/TakenEventButtons'
import appStyles from '../global-styles'

const toastMsgs = {
  finalise: defineMessages({
    text: {
      id: 'Feedback.toast.finalise.text',
      defaultMessage: 'Event was finalised'
    },
    buttonText: {
      id: 'Feedback.toast.finalise.buttonText',
      defaultMessage: 'OK'
    }
  }),
  unaccept: defineMessages({
    text: {
      id: 'Feedback.toast.unaccept.text',
      defaultMessage: 'Event was cancelled'
    },
    buttonText: {
      id: 'Feedback.toast.unaccept.buttonText',
      defaultMessage: 'OK'
    }
  })
}

const ignore = {
  modalMsgs: defineMessages({
    title: {
      id: 'Event.alert.ignore.title',
      defaultMessage: 'Ignore Event'
    },
    text: {
      id: 'Event.alert.ignore.text',
      defaultMessage: "I'm not interested in accepting the event"
    },
    confirm: {
      id: 'Event.alert.ignore.confirm',
      defaultMessage: 'Confirm'
    },
    cancel: {
      id: 'Event.alert.ignore.cancel',
      defaultMessage: 'Cancel'
    },
    buttonMsgs: {
      id: 'Event.button.ignore',
      defaultMessage: 'Ignore'
    }
  })
}

const cancel = {
  modalMsgs: defineMessages({
    title: {
      id: 'Event.alert.cancel.title',
      defaultMessage: 'Cancel Event'
    },
    text: {
      id: 'Event.alert.cancel.text',
      defaultMessage: "I don't want to take care of the event anymore"
    },
    confirm: {
      id: 'Event.alert.cancel.confirm',
      defaultMessage: 'Confirm'
    },
    cancel: {
      id: 'Event.alert.cancel.cancel',
      defaultMessage: 'Cancel'
    },
    buttonMsgs: {
      id: 'Event.button.cancel',
      defaultMessage: 'Cancel'
    }
  })
}

const accept = {
  modalMsgs: defineMessages({
    title: {
      id: 'Event.alert.accept.title',
      defaultMessage: 'Accept Event'
    },
    text: {
      id: 'Event.alert.accept.text',
      defaultMessage: 'I want to take care of the event'
    },
    confirm: {
      id: 'Event.alert.accept.confirm',
      defaultMessage: 'Confirm'
    },
    cancel: {
      id: 'Event.alert.accept.cancel',
      defaultMessage: 'Cancel'
    },
    buttonMsgs: {
      id: 'Event.button.accept',
      defaultMessage: 'Accept'
    }
  })
}

const finalise = {
  modalMsgs: defineMessages({
    title: {
      id: 'Event.alert.finalise.title',
      defaultMessage: 'Finalise Event'
    },
    text: {
      id: 'Event.alert.finalise.text',
      defaultMessage: 'I have finished taking care of the event'
    },
    confirm: {
      id: 'Event.alert.finalise.confirm',
      defaultMessage: 'Confirm'
    },
    cancel: {
      id: 'Event.alert.finalise.cancel',
      defaultMessage: 'Cancel'
    },
    buttonMsgs: {
      id: 'Event.button.finalise',
      defaultMessage: 'Finalise'
    }
  })
}

const eventTakenMsgs = defineMessages({
  title: {
    id: 'Event.alert.taken.title',
    defaultMessage: 'Event taken already'
  },
  text: {
    id: 'Event.alert.taken.text',
    defaultMessage:
      'Sorry, this event was already accepted by another volunteer. Thank you for your time!'
  },
  confirm: {
    id: 'Event.alert.taken.confirm',
    defaultMessage: 'Ok'
  }
})

const eventTakeErrorMsgs = defineMessages({
  title: {
    id: 'Event.alert.takeError.title',
    defaultMessage: 'Error Accepting Event'
  },
  text: {
    id: 'Event.alert.takeError.text',
    defaultMessage:
      'Sorry, unable to accept this event. Please try again, if error persists please contact administrator'
  },
  confirm: {
    id: 'Event.alert.takeError.confirm',
    defaultMessage: 'Ok'
  }
})

// TODO Move saveNotificationToken to be executed after signin, if error exists then show button on home asking user to notification access (trigger again)
// TODO Remove token after user logout

@observer
class EventScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    const {
      state: {
        params: { isAssigned }
      }
    } = navigation
    // Make sure when isAssigned is not defined we don't show arrows
    return {
      header: (
        <Header style={appStyles.navigationHeaderStyles}>
          <Left>
            {!isAssigned && (
              <Button
                transparent
                onPress={() => {
                  trackEvent('Navigation', { page: 'Home' })
                  navigation.popToTop()
                }}
              >
                <Icon
                  style={appStyles.headerTitle}
                  name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
                />
              </Button>
            )}
          </Left>
          <Body>
            {isAssigned ? (
              <FormattedMessage
                id="Event.title.active"
                defaultMessage="Active event"
              >
                {txt => (
                  <Title style={[appStyles.appFont, appStyles.headerTitle]}>
                    {txt}
                  </Title>
                )}
              </FormattedMessage>
            ) : (
              <FormattedMessage
                id="Event.title.inactive"
                defaultMessage="Event"
              >
                {txt => (
                  <Title style={[appStyles.appFont, appStyles.headerTitle]}>
                    {txt}
                  </Title>
                )}
              </FormattedMessage>
            )}
          </Body>
          <Right />
        </Header>
      )
    }
  }

  componentWillMount() {
    const { navigation, event } = this.props
    const {
      setParams,
      state: {
        params: { isAssigned }
      }
    } = navigation
    if (event && event.isAssigned !== isAssigned) {
      setParams({ isAssigned: event.isAssigned })
    }
  }

  componentWillReceiveProps(nextProps) {
    const { navigation } = this.props
    const { event } = nextProps
    const {
      setParams,
      state: {
        params: { isAssigned }
      }
    } = navigation
    if (event && event.isAssigned !== isAssigned) {
      setParams({ isAssigned: event.isAssigned })
    }
  }

  handleRemoveEvent = () => {
    const { navigation } = this.props

    // Navigate back without removing event from list
    navigation.popToTop()
  }

  // supports finalise and cancel
  handleCompleteEvent = async action => {
    const {
      event,
      navigation,
      screenProps: { intl }
    } = this.props

    // Execute action on event
    await event.execute(action)

    // Navigate to home (resetting state)
    trackEvent('Navigation', { page: 'Home' })
    navigation.dispatch(
      NavigationActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({ routeName: 'Home' })]
      })
    )
    // Show toast
    Toast.show({
      text: intl.formatMessage(toastMsgs[action].text),
      position: 'bottom',
      type: action === 'finalise' ? 'success' : 'danger',
      buttonText: intl.formatMessage(toastMsgs[action].buttonText),
      duration: 5000
    })
  }

  render() {
    const {
      event,
      screenProps: { intl },
      isAssigned,
      isTaken,
      isAdmin
    } = this.props
    if (!event || !event.id) {
      return (
        <FormattedMessage
          id="Event.error.notfound"
          defaultMessage="Sorry, unable to find event details. Probably the event was already completed."
        >
          {txt => <Text>{txt}</Text>}
        </FormattedMessage>
      )
    }

    const okBtn = {
      ...(isAssigned ? finalise : accept),
      onPress: isAssigned
        ? () => {
            trackEvent('Navigation', {
              page: 'Finalise',
              eventId: event.id
            })

            // Finalise Event
            this.handleCompleteEvent('finalise')
          }
        : () => {
            // Accept Event
            event.execute('accept').catch(error => {
              if (error && error.code === 'event-taken') {
                // Event was taken already, show alert message
                Alert.alert(
                  intl.formatMessage(eventTakenMsgs.title),
                  intl.formatMessage(eventTakenMsgs.text),
                  [
                    {
                      text: intl.formatMessage(eventTakenMsgs.confirm),
                      onPress: this.handleRemoveEvent
                    }
                  ],
                  { cancelable: false }
                )
              } else {
                // Error taking event (TODO Have a store for errors and use that in all scenarios?)
                Alert.alert(
                  intl.formatMessage(eventTakeErrorMsgs.title),
                  intl.formatMessage(eventTakeErrorMsgs.text),
                  [
                    {
                      text: intl.formatMessage(eventTakeErrorMsgs.confirm)
                    }
                  ],
                  { cancelable: false }
                )
              }
            })
          }
    }

    const cancelBtn = {
      ...(isAssigned ? cancel : ignore),
      onPress: isAssigned
        ? () => {
            trackEvent('Navigation', {
              page: 'Unaccept',
              eventId: event.id
            })

            // Unnacept event
            this.handleCompleteEvent('unaccept')
          }
        : this.handleRemoveEvent
    }

    if (event.isLackingCriticalInfo) {
      return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <ActivityIndicator
            style={{ marginTop: 20, marginBottom: 20 }}
            size="large"
          />
          <FormattedMessage
            id="Event.details.waiting"
            defaultMessage="Please wait, loading event..."
          >
            {txt => (
              <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
                {txt}
              </Text>
            )}
          </FormattedMessage>
        </View>
      )
    }
    return (
      <EventDetails event={event} isAdmin={isAdmin} cancelHandler={cancelBtn}>
        {isTaken && !isAssigned ? (
          <TakenEventButtons onPress={this.handleRemoveEvent} />
        ) : (
          <ButtonsConfirmationBar ok={okBtn} />
        )}
      </EventDetails>
    )
  }
}

export default inject(
  (
    { stores },
    {
      navigation: {
        state: {
          params: { eventId }
        }
      }
    }
  ) => {
    const event = stores.eventStore.findById(eventId)
    return {
      // Return isAssigned because we need mobx to refresh the view
      //  if it changes
      isAssigned: event && event.isAssigned,
      isTaken: event && event.isTaken,
      isAdmin: stores.authStore.currentUser.isAdmin,
      event
    }
  }
)(EventScreen)
