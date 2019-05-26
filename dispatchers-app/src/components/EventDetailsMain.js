import React, { Component } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, Text } from 'native-base'
import EventTimeline from './EventTimeline'
import EventDetails from './EventDetails'

export default class EventDetailsMain extends Component {
  constructor(props) {
    super(props)
    this.state = { isShowTimeline: false }
    this.onPress = this.onPress.bind(this)
  }
  onPress() {
    this.setState({ isShowTimeline: !this.state.isShowTimeline })
  }
  getButtonStyle(isShown) {
    return isShown
      ? [styles.buttonTextShow, styles.buttonTextShow]
      : [styles.hideButton, styles.buttonTextHide]
  }
  render() {
    const { isShowTimeline } = this.state
    const statusButtonStyle = this.getButtonStyle(isShowTimeline)
    const detailsButtonStyle = this.getButtonStyle(!isShowTimeline)
    return (
      <View>
        <View style={styles.buttonRow}>
          <Button
            style={[statusButtonStyle[0], styles.statusButton]}
            onPress={this.onPress}
          >
            <Text style={statusButtonStyle[1]}>סטטוס</Text>
          </Button>
          <Button
            style={[detailsButtonStyle[0], styles.detailsButton]}
            onPress={this.onPress}
          >
            <Text style={detailsButtonStyle[1]}>פרטים</Text>
          </Button>
        </View>

        {isShowTimeline ? (
          <EventTimeline {...this.props} />
        ) : (
          <EventDetails {...this.props} />
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  buttonRow: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 20,
    backgroundColor: '#F5F6FA',
    width: '100%'
  },
  hideButton: {
    borderColor: '#4451B9',
    backgroundColor: 'white',
    alignSelf: 'center',
    justifyContent: 'center'
  },
  showButton: {
    borderColor: '#4451B9',
    backgroundColor: '#4451B9'
  },
  buttonTextShow: {
    alignSelf: 'center',
    color: 'white'
  },
  buttonTextHide: {
    alignSelf: 'center',
    color: '#4451B9'
  },
  statusButton: {
    borderWidth: 1,
    borderStyle: 'solid',
    minWidth: 150,
    alignSelf: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25
  },
  detailsButton: {
    borderWidth: 1,
    borderStyle: 'solid',
    minWidth: 150,
    alignSelf: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25
  }
})
