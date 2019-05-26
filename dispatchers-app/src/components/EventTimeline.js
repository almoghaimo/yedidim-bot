import React, { Component } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, ScrollView, View } from 'react-native'
import TimelineItem from './Timelineitem'
class EventTimeline extends Component {
  render() {
    const {
      event: { timeline }
    } = this.props

    const timelineArray = Object.values(timeline || {})

    return (
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          {timelineArray
            .sort((c1, c2) => (c1.createdAt > c2.createdAt ? 1 : -1))
            .map((item, idx) => (
              <TimelineItem
                key={`${idx}-${item.createdAt}`}
                {...item}
                last={timelineArray.length - 1 === idx}
              />
            ))}
        </View>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingRight: 8,
    paddingBottom: 10,
    paddingLeft: 8,
    backgroundColor: 'white'
  }
})

const mapStateToProps = (state, ownProps) => {
  let event = state.dataSource.events
    ? state.dataSource.events.find(event => event.key === ownProps.params.key)
    : {}
  if (!event) {
    event = state.dataSource.searchEvents.find(
      event => event.key === ownProps.params.key
    )
  }

  return {
    event
  }
}

export default connect(mapStateToProps)(EventTimeline)
