import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Text, StyleSheet, Image, I18nManager } from 'react-native'
import { Grid, Row, Col, Button } from 'native-base'
import {
  formatEventCategory,
  formatEventTime,
  getTextStyle
} from '../common/utils'
import { EventSource, ScreenType } from '../constants/consts'

export const EventsListColumn = {
  Time: { id: 0, label: 'זמן' },
  Name: { id: 1, label: 'שם' },
  Phone: { id: 2, label: 'טלפון' },
  Case: { id: 3, label: 'בעיה' },
  City: { id: 4, label: 'כתובת' },
  CarType: { id: 5, label: 'סוג רכב' },
  Source: { id: 6, label: '' }
}

const CellEventDetail = () => (
  <Text
    style={getTextStyle(styles.cellText)}
    allowFontScaling={false}
    numberOfLines={2}
    ellipsizeMode={'tail'}
  >
    {this.props.children}
  </Text>
)

class EventsList extends Component {
  openEventDetails(event) {
    this.props.navigate(ScreenType.EventDetails, { key: event.key })
  }

  renderRow(event, col) {
    return event.details ? (
      <Row
        style={[
          styles.row,
          I18nManager.isRTL ? undefined : { flexDirection: 'row-reverse' }
        ]}
        onPress={this.openEventDetails.bind(this, event)}
        key={event.key + '_' + col.id}
      >
        {col === EventsListColumn.Time ? (
          <CellEventDetail>{formatEventTime(event)}</CellEventDetail>
        ) : col === EventsListColumn.Case ? (
          <CellEventDetail>
            {formatEventCategory(this.props.categories, event, false)}
          </CellEventDetail>
        ) : col === EventsListColumn.City ? (
          <CellEventDetail>{event.details.address}</CellEventDetail>
        ) : col === EventsListColumn.Name ? (
          <CellEventDetail>{event.details['caller name']}</CellEventDetail>
        ) : col === EventsListColumn.Phone ? (
          <CellEventDetail>{event.details['phone number']}</CellEventDetail>
        ) : col === EventsListColumn.Source ? (
          event.source === EventSource.FB_BOT ? (
            <Image
              style={styles.fbImage}
              source={require('../../assets/images/bot-icon.png')}
            />
          ) : (
            <Text style={getTextStyle(styles.cellText)} />
          )
        ) : col === EventsListColumn.CarType ? (
          <CellEventDetail data={event.details['car type']} />
        ) : (
          undefined
        )}
      </Row>
    ) : (
      <Row />
    )
  }

  render() {
    const events = this.props.events
    let cols = this.props.columns.map(col => {
      return (
        <Col
          style={
            col === EventsListColumn.Source
              ? { width: 30 }
              : [EventsListColumn.Phone, EventsListColumn.CarType].includes(col)
              ? { width: 90 }
              : undefined
          }
          key={col.id}
        >
          <Text
            style={getTextStyle(styles.headerText)}
            allowFontScaling={false}
          >
            {col.label}
          </Text>
          {events.map(event => this.renderRow(event, col))}
        </Col>
      )
    })
    if (!I18nManager.isRTL) {
      cols.reverse()
    }
    return <Grid>{cols.map(col => col)}</Grid>
  }
}

export default EventsList

EventsList.propTypes = {
  events: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  navigate: PropTypes.func.isRequired,
  categories: PropTypes.array
}

const styles = StyleSheet.create({
  headerText: {
    height: 30,
    fontSize: 18,
    fontWeight: '500'
  },
  cellText: {
    height: 35,
    fontSize: 14
  },
  row: {
    height: 35
  },
  rowLine: {
    height: 2,
    backgroundColor: 'black',
    marginTop: 10
  },
  colImage: {
    width: 30
  },
  fbImage: {
    width: 20,
    height: 20
  }
})
