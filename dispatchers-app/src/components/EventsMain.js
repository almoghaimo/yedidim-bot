import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { Button } from 'native-base'
import { getEventStatus, getTextStyle } from '../common/utils'
import { EventStatus, ScreenType } from '../constants/consts'
import EventsList, { EventsListColumn } from './EventsList'
import { loadEvents } from '../actions/dataSourceActions'

class EventsMain extends Component {
  componentWillMount() {
    this.props.registerForRefresh(this.props.handleRefresh)
  }

  addNewEvent() {
    this.props.navigate(ScreenType.EventCreate)
  }

  render() {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.buttonRow}>
          <Button style={styles.button} onPress={this.addNewEvent.bind(this)}>
            <Text style={styles.buttonText}>פתיחת אירוע חדש</Text>
          </Button>
        </View>
        <ScrollView style={styles.scrollContainer}>
          <Text
            style={getTextStyle(styles.headerTitle)}
            allowFontScaling={false}
          >
            אירועים חדשים
          </Text>
          <EventsList
            events={this.props.newEvents}
            columns={[
              EventsListColumn.Time,
              EventsListColumn.Case,
              EventsListColumn.City,
              EventsListColumn.Source
            ]}
            categories={this.props.categories}
            navigate={this.props.navigate}
          />
          <View style={styles.rowLine} />
          <Text
            style={getTextStyle(styles.headerTitle)}
            allowFontScaling={false}
          >
            אירועים פעילים
          </Text>
          <EventsList
            events={this.props.activeEvents}
            columns={[
              EventsListColumn.Time,
              EventsListColumn.Case,
              EventsListColumn.City,
              EventsListColumn.Source
            ]}
            categories={this.props.categories}
            navigate={this.props.navigate}
          />
        </ScrollView>
      </ScrollView>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleRefresh: onLoad => {
      dispatch(loadEvents(onLoad))
    }
  }
}

const mapStateToProps = state => {
  const events = state.dataSource.events
  const categories = state.dataSource.categories || []
  return {
    newEvents: events
      ? events.filter(
          event =>
            getEventStatus(event) === EventStatus.Submitted ||
            getEventStatus(event) === EventStatus.Sent
        )
      : [],
    activeEvents: events
      ? events.filter(event => getEventStatus(event) === EventStatus.Assigned)
      : [],
    categories
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EventsMain)

EventsList.propTypes = {
  newEvents: PropTypes.array,
  activeEvents: PropTypes.array,
  navigate: PropTypes.func.isRequired,
  registerForRefresh: PropTypes.func,
  handleRefresh: PropTypes.func,
  categories: PropTypes.array
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  scrollContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingRight: 8,
    paddingLeft: 8,
    paddingBottom: 20,
    backgroundColor: 'white'
  },
  buttonRow: {
    justifyContent: 'center',
    paddingTop: 20,
    paddingRight: 40,
    paddingLeft: 40
  },
  button: {
    width: 150,
    alignSelf: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: 'white',
    alignSelf: 'center'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '500',
    paddingBottom: 10,
    paddingTop: 10
  }
})
