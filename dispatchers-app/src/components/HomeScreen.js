import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Alert } from 'react-native'
import { connect } from 'react-redux'
import { Notifications } from 'expo'
import LoginScreen from './LoginScreen'
import MainScreen from './MainScreen'
import {
  checkUserAuth,
  clearMessage,
  acknowledgeTestNotification,
  acknowledgeEventNotification
} from '../actions/dataSourceActions'

class HomeScreen extends Component {
  constructor(props) {
    super(props)
    this.state = { showNewVersionAlert: false }
  }

  componentWillMount() {
    this.props.checkUserAuth()
    Notifications.addListener(this.handleNotification)
  }

  handleNotification = ({ origin, data, remote }) => {
    if (data && data.type === 'test' && !!data.userId) {
      Alert.alert(
        'בדיקת התראות',
        'ההתראות נבדקו ונמצאו תקינות. המערכת עודכנה עם תוצאות הבדיקה.',
        [{ text: 'OK', onPress: () => {} }],
        { cancelable: false }
      )
      // Acknowledge test on firebase
      this.props.acknowledgeTestNotification(data.userId)
    }

    if (data && data.type === 'event' && !!data.userId && !!data.eventId) {
      // Acknowledge event received on firebase
      this.props.acknowledgeEventNotification(data.userId, data.eventId)
    }
  }

  reloadNewVersion() {
    this.setState({ showNewVersionAlert: true })
    Alert.alert(
      'עדכון גירסא',
      'בבקשה עדכן גירסא חדשה',
      [{ text: 'עדכן', onPress: () => Expo.Util.reload() }],
      { cancelable: false }
    )
  }

  showError() {
    Alert.alert(
      'הודעה',
      this.props.error.message,
      [{ text: 'OK', onPress: () => this.props.clearMessage() }],
      { cancelable: false }
    )
  }

  render() {
    //User authentication was not checked it
    if (!this.props.user) {
      return <Expo.AppLoading />
    }
    //There is no log in user
    if (!this.props.user.id) {
      return <LoginScreen />
    }
    //Events data was not loaded yet
    if (!this.props.events) {
      return <Expo.AppLoading />
    }
    if (this.props.error) {
      this.showError()
    }

    return <MainScreen />
  }
}
const mapDispatchToProps = dispatch => {
  return {
    checkUserAuth: () => {
      dispatch(checkUserAuth())
    },
    clearMessage: () => {
      dispatch(clearMessage())
    },
    acknowledgeTestNotification: userId => {
      dispatch(acknowledgeTestNotification(userId))
    },
    acknowledgeEventNotification: (userId, eventId) => {
      dispatch(acknowledgeEventNotification(userId, eventId))
    }
  }
}

const mapStateToProps = state => {
  return {
    user: state.dataSource.user,
    events: state.dataSource.events,
    error: state.dataSource.error
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen)

HomeScreen.propTypes = {
  user: PropTypes.object,
  error: PropTypes.object,
  clearMessage: PropTypes.func
}
