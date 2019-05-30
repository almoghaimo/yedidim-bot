import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { ScrollView, View, Text, StyleSheet, I18nManager } from 'react-native'
import { Button, Form, Item, Input, Label } from 'native-base'
import DatePicker from 'react-native-datepicker'
import { FileSystem, MailComposer } from 'expo'
import { getTextStyle, eventsToCSV } from '../common/utils'
import { searchEvents } from '../actions/dataSourceActions'
import EventsList, { EventsListColumn } from './EventsList'

class EventsSearch extends Component {
  constructor(props) {
    super(props)
    this.state = { phone: undefined }
    this.searchEvents = this.searchEvents.bind(this)
    this.sendSearchResults = this.sendSearchResults.bind(this)
  }

  searchEvents() {
    const now = new Date()
    const fromDate = this.state.fromDate
      ? Date.parse(this.state.fromDate) + now.getTimezoneOffset() * 60000
      : undefined
    const toDate = this.state.toDate
      ? Date.parse(this.state.toDate) +
        now.getTimezoneOffset() * 60000 +
        24 * 60 * 60 * 1000
      : undefined
    this.props.searchEvents(this.state.phone, fromDate, toDate)
  }

  async sendSearchResults() {
    if (!this.props.events) {
      return
    }
    const content = eventsToCSV(
      this.props.categories,
      this.props.dispatchers,
      this.props.volunteers,
      this.props.events
    )
    console.log(content)
    const fileUri = FileSystem.cacheDirectory + 'yedidim-events.csv'
    await FileSystem.writeAsStringAsync(fileUri, content)
    await MailComposer.composeAsync({
      subject: 'אירועים',
      body: 'אירועים מ ' + this.state.fromDate + ' עד ' + this.state.toDate,
      attachments: [fileUri]
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <Form>
          <Item
            style={{
              flex: 1,
              flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse'
            }}
          >
            <Label
              style={I18nManager.isRTL ? undefined : { textAlign: 'right' }}
            >
              טלפון
            </Label>
            <Input
              value={this.state.phone}
              keyboardType="numeric"
              onChangeText={value => {
                this.setState({ phone: value.trim() })
              }}
            />
          </Item>
          <View
            style={[
              styles.datePickersRow,
              { flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse' }
            ]}
          >
            <DatePicker
              style={styles.datePicker}
              date={this.state.fromDate}
              mode="date"
              placeholder="מתאריך"
              format="YYYY-MM-DD"
              confirmBtnText="בחר"
              cancelBtnText="בטל"
              onDateChange={date => {
                this.setState({ fromDate: date })
              }}
            />
            <DatePicker
              style={styles.datePicker}
              date={this.state.toDate}
              mode="date"
              placeholder="עד תאריך"
              format="YYYY-MM-DD"
              confirmBtnText="בחר"
              cancelBtnText="בטל"
              onDateChange={date => {
                this.setState({ toDate: date })
              }}
            />
          </View>
          <View
            style={[
              styles.buttonsRow,
              I18nManager.isRTL
                ? { flex: 1, flexDirection: 'row-reverse' }
                : undefined
            ]}
          >
            <Button style={styles.button} onPress={this.searchEvents}>
              <Text style={styles.buttonText}>חפש</Text>
            </Button>
            <Button
              style={styles.button}
              onPress={this.sendSearchResults}
              disabled={!this.props.events}
            >
              <Text style={styles.buttonText}>שלח</Text>
            </Button>
          </View>
        </Form>
        {this.props.events ? (
          <ScrollView style={styles.scrollContainer}>
            <Text
              style={getTextStyle(styles.headerTitle)}
              allowFontScaling={false}
            >
              {this.props.events.length === 0 ? 'לא נמצאו אירועים' : 'אירועים'}
            </Text>
            {this.props.events.length > 0 && (
              <EventsList
                events={this.props.events}
                columns={[
                  EventsListColumn.Time,
                  EventsListColumn.Name,
                  EventsListColumn.Phone,
                  EventsListColumn.Case,
                  EventsListColumn.City
                ]}
                categories={this.props.categories}
                navigate={this.props.navigate}
              />
            )}
          </ScrollView>
        ) : (
          undefined
        )}
      </View>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    searchEvents: (phone, fromDate, toDate) => {
      dispatch(searchEvents(phone, fromDate, toDate))
    }
  }
}

const mapStateToProps = state => {
  const events = state.dataSource.searchEvents
  const categories = state.dataSource.categories || []
  const dispatchers = state.dataSource.dispatchers || []
  const volunteers = state.dataSource.volunteers || []
  return {
    events,
    categories,
    dispatchers,
    volunteers
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EventsSearch)

EventsList.propTypes = {
  events: PropTypes.array,
  navigate: PropTypes.func.isRequired,
  searchEvents: PropTypes.func,
  categories: PropTypes.array,
  dispatchers: PropTypes.array,
  volunteers: PropTypes.array
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
  datePickersRow: {
    flex: 1,
    padding: 10
  },
  datePicker: {
    width: 160
  },
  button: {
    width: 150,
    alignSelf: 'center',
    justifyContent: 'center'
  },
  buttonsRow: {
    marginLeft: 10,
    marginRight: 10,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between'
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
