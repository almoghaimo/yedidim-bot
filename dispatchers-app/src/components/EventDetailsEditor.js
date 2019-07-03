import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  Platform,
  KeyboardAvoidingView,
  View,
  Text,
  Alert,
  StyleSheet,
  I18nManager
} from 'react-native'
import { union } from 'lodash'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Picker, Form, Item, Label, Input, Button } from 'native-base'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import { getTextStyle } from '../common/utils'
import { EventStatus, EventSource, ScreenType } from '../constants/consts'
import { createEvent, updateEvent } from '../actions/dataSourceActions'
import {
  geocodeAddress,
  getAddressDetailsFromGoogleResult
} from '../actions/geocodingActions'
import { sendNotification } from '../actions/notificationsActions'

import Autocomplete from './AutoComplete'
import carsTypeList from '../../cars_type_list'

class KeyboardAwareScrollViewComponent extends React.Component {
  render() {
    if (Platform.OS === 'ios') {
      return (
        <KeyboardAwareScrollView {...this.props} style={styles.scrollContainer}>
          {this.props.children}
        </KeyboardAwareScrollView>
      )
    }

    return (
      <KeyboardAvoidingView
        {...this.props}
        style={styles.scrollContainer}
        behavior="padding"
        keyboardVerticalOffset={100}
      >
        {this.props.children}
      </KeyboardAvoidingView>
    )
  }
}

class EventDetailsEditor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      details: {
        address: undefined,
        geo: undefined,
        category: undefined
      },
      listViewDisplayed: 'auto',
      changes: []
    }
    this.updateEventData = this.updateEventData.bind(this)
    this.validatePlusCode = this.validatePlusCode.bind(this)
    this.createNewEvent = this.createNewEvent.bind(this)
    this.updateExistingEvent = this.updateExistingEvent.bind(this)
    this.hideGooglePlacesSuggestions = this.hideGooglePlacesSuggestions.bind(
      this
    )
  }

  componentWillMount() {
    const { event } = this.props
    if (event) {
      this.setState({ details: event.details })
    }
  }

  componentWillReceiveProps({ event: nextEvent }) {
    const { changes } = this.state
    const { event } = this.props
    if (nextEvent && nextEvent.details !== event.details) {
      if (changes.length) {
        this.setState({
          error: { message: 'אירוע שונה ע״י מוקדן אחר' },
          changes: []
        })
      }
      this.setState({ details: nextEvent.details })
    }
  }

  updateEventData(data) {
    const { changes, details } = this.state
    let newDetails = {...details}
    let newChanges = changes.slice()
    for (const [field, value] of Object.entries(data)) {
      newChanges = union(newChanges, [field])
      newDetails[field] = value
    }
    this.setState({
      details: newDetails,
      changes: newChanges
    })
  }

  async createNewEvent() {
    const { details } = this.state
    const { createEvent, navigate } = this.props
    if (!(await this.validateEventData())) {
      return
    }
    this.setState({ changes: [] })
    const event = {
      status: EventStatus.Sent,
      source: EventSource.App,
      dispatcher: this.props.user.id,
      details
    }
    createEvent(event)
    navigate(ScreenType.EventsList)
  }

  updateExistingEvent() {
    const { event, updateEvent, sendNotification, navigate } = this.props
    const { details, changes } = this.state
    if (!this.validateEventData()) {
      return
    }
    updateEvent({ ...event, details }, changes)
    sendNotification(event.key, event.assignedTo)
    navigate(ScreenType.EventsList)
  }

  async validatePlusCode() {
    const { details } = this.state
    const plusCode = details.plus_code
    if (
      plusCode.length < 11 ||
      !plusCode.includes(' ') ||
      !plusCode.includes('+')
    ) {
      this.setState({
        error: { message: 'צריך להזין plus code וכתובת', field: 'plus_code' }
      })
      return false
    }
    let location = await geocodeAddress(plusCode, true)
    if (!location) {
      this.setState({
        error: { message: 'Plus Code לא חוקי', field: 'plus_code' }
      })
      return false
    }
    location.address = plusCode.slice(8)

    this.updateEventData({ ...location })
    return true
  }

  async validateEventData() {
    const { details } = this.state
    if (!details.address && !details.plus_code) {
      this.setState({ error: { message: 'לא הוזנה כתובת', field: 'address' } })
      return false
    }

    if (details.plus_code) {
      if (!(await this.validatePlusCode())) {
        return false
      }
    }
    if (!details.geo) {
      this.setState({ error: { message: 'כתובת לא נבדקה', field: 'address' } })
      return false
    }
    if (typeof details.category === 'undefined') {
      this.setState({
        error: { message: 'לא נבחר סוג בעיה', field: 'category' }
      })
      return false
    }
    if (!details['car type'] && details.subCategory !== 'SlammedDoor') {
      this.setState({
        error: { message: 'לא הוזן סוג הרכב', field: 'car type' }
      })
      return false
    }
    if (!details['phone number']) {
      this.setState({
        error: { message: 'לא הוזן מספר טלפון', field: 'phone number' }
      })
      return false
    }
    if (
      !/^(?:0(?!([57]))(?:[23489]))(?:-?\d){7}$|^(0(?=[57])(?:-?\d){9})$/g.test(
        details['phone number']
      )
    ) {
      this.setState({
        error: { message: 'מספר טלפון לא חוקי', field: 'phone number' }
      })
      return false
    }
    if (!details['caller name']) {
      this.setState({ error: { message: 'לא הוזן שם', field: 'caller name' } })
      return false
    }
    return true
  }

  showValidationError() {
    if (!this.state.error) {
      return
    }
    Alert.alert('שגיאה', this.state.error.message, [
      {
        text: 'אישור',
        onPress: () => {
          this.setState({ error: undefined })
        }
      }
    ])
  }

  setCategory(categoryId) {
    const category = this.props.categories.find(
      category => category.id === categoryId
    )
    const subCategory =
      category && category.subCategories ? category.subCategories[0].id : null
    this.updateEventData({ category: categoryId, subCategory })
  }

  renderCategoryPicker() {
    const { details } = this.state
    const categories = [...this.props.categories]
    if (!details.category) {
      categories.unshift({
        displayName: 'בחר בעיה',
        id: -1
      })
    }

    return (
      <Picker
        iosHeader="בחר סוג בעיה"
        headerBackButtonText="חזור"
        mode="dropdown"
        placeholder="בחר סוג בעיה"
        itemTextStyle={getTextStyle(styles.pickerItem)}
        textStyle={getTextStyle(styles.pickerItem)}
        selectedValue={details.category}
        onValueChange={value => this.setCategory(value)}
      >
        {categories.map(category => (
          <Picker.Item
            label={category.displayName}
            value={category.id}
            key={category.id}
          />
        ))}
      </Picker>
    )
  }

  renderSubCategoryPicker() {
    const { details } = this.state
    const { categories } = this.props
    const category = categories.find(
      category => category.id === details.category
    )
    if (!category || !category.subCategories) {
      return
    }
    return (
      <Picker
        iosHeader="בחר תת קטגוריה"
        headerBackButtonText="חזור"
        mode="dropdown"
        placeholder="תת קטגוריה"
        itemTextStyle={getTextStyle(styles.pickerItem)}
        textStyle={getTextStyle(styles.pickerItem)}
        selectedValue={details.subCategory}
        onValueChange={value => this.updateEventData({ subCategory: value })}
      >
        {category.subCategories.map(subCategory => {
          return (
            <Picker.Item
              label={subCategory.displayName}
              value={subCategory.id}
              key={subCategory.id}
            />
          )
        })}
      </Picker>
    )
  }

  renderInput(label, field, type = 'default') {
    const { details } = this.state
    return (
      <Item floatingLabel style={styles.item}>
        <Label style={I18nManager.isRTL ? undefined : { textAlign: 'right' }}>
          {label}
        </Label>
        <Input
          value={details[field]}
          keyboardType={type}
          onChangeText={value => {
            this.updateEventData({
              [field]: type === 'numeric' ? value.trim() : value
            })
          }}
        />
      </Item>
    )
  }

  renderCarType(label, field, type = 'default') {
    const suggestions = carsTypeList.map(item => item.label)

    // return <Autocomplete suggestions={suggestions} />

    return(
      <View floatingLabel style={styles.item}>
        <Autocomplete suggestions={suggestions} />
      </View>
    )

    //     <Input
    //       value={details[field]}
    //       keyboardType={type}
    //       onChangeText={value => {
    //         // value += 'yo'
    //
    //         const filteredSuggestions = carsTypeList.filter(
    //           suggestion =>
    //             suggestion.label.toLowerCase().indexOf(value.toLowerCase()) > -1
    //         );
    //
    //         this.updateEventData({
    //           [field]: type === 'numeric' ? value.trim() : value
    //         })
    //       }}
    //     />
    //   </Item>
    // )
  }

  hideGooglePlacesSuggestions() {
    this.setState({ listViewDisplayed: false })
  }

  GooglePlacesInput() {
    const { details, listViewDisplayed } = this.state
    // Fixed issues with list not closing on selection by applying
    // https://github.com/FaridSafi/react-native-google-places-autocomplete/issues/329#issuecomment-434664874
    return (
      <GooglePlacesAutocomplete
        placeholder="חיפוש בכתובת"
        placeholderTextColor="#575757"
        minLength={2} // minimum length of text to search
        autoFocus={false}
        returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
        listViewDisplayed={listViewDisplayed} // true/false/undefined
        fetchDetails
        renderDescription={row => row.description} // custom description render
        onFocus={() => {
          this.setState({ listViewDisplayed: 'auto' })
        }}
        onPress={(data, _details = null) => {
          // 'details' is provided when fetchDetails = true
          const { address, geo } = getAddressDetailsFromGoogleResult(_details)
          this.updateEventData({ address, geo })
          this.hideGooglePlacesSuggestions()
        }}
        getDefaultValue={() => ''}
        query={{
          // available options: https://developers.google.com/places/web-service/autocomplete
          key: 'AIzaSyCcOFOs1z1nMIWrDvOuEimpwaezFX4h2TY',
          language: 'he' // language of the results
        }}
        styles={{
          container: {
            marginTop: 0,
            marginBottom: 20
          },
          textInputContainer: {
            backgroundColor: 'rgba(0,0,0,0)',
            borderTopWidth: 0
          },
          textInput: {
            marginLeft: 0,
            marginRight: 0,
            height: 38,
            color: '#575757',
            fontSize: 17,
            borderBottomColor: '#D9D5DC',
            borderBottomWidth: 1,
            textAlign: 'right'
          },
          predefinedPlacesDescription: {
            color: '#1faadb'
          },
          description: {
            fontWeight: 'bold'
          }
        }}
        nearbyPlacesAPI="GooglePlacesSearch" // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
        debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
      />
    )
  }

  render() {
    const { event } = this.props
    const { details, changes } = this.state

    return (
      <KeyboardAwareScrollViewComponent>
        <View style={styles.container}>
          {this.showValidationError()}
          <Form>
            <Label style={getTextStyle(styles.addressLabel)}>כתובת</Label>
            {this.GooglePlacesInput()}
            <Label style={getTextStyle(styles.pickerLabel)}>סוג אירוע</Label>
            {this.renderCategoryPicker()}
            {this.renderSubCategoryPicker()}
            {details.subCategory !== 'SlammedDoor' &&
            this.renderCarType('סוג רכב', 'car type')}
            {this.renderInput('Plus Code מיקום דרך', 'plus_code')}
            {this.renderInput('פרטים', 'more')}
            {this.renderInput('מידע פרטי', 'private_info')}
            {this.renderInput('טלפון', 'phone number', 'phone-pad')}
            {this.renderInput('שם', 'caller name')}
          </Form>
          <Button
            full
            style={styles.createButton}
            disabled={event.key && !changes.length}
            onPress={event.key ? this.updateExistingEvent : this.createNewEvent}
          >
            <Text style={styles.buttonText}>
              {event.key ? 'עדכן' : 'פתח'} אירוע{' '}
            </Text>
          </Button>
        </View>
      </KeyboardAwareScrollViewComponent>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    createEvent: event => {
      dispatch(createEvent(event))
    },
    updateEvent: (event, changes) => {
      dispatch(updateEvent(event, changes))
    },
    sendNotification: (eventKey, volunteer) => {
      dispatch(sendNotification(eventKey, undefined, volunteer))
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  let event =
    state.dataSource.events && ownProps.params
      ? state.dataSource.events.find(event => event.key === ownProps.params.key)
      : undefined
  const categories = state.dataSource.categories || []
  return {
    event,
    user: state.dataSource.user,
    categories
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EventDetailsEditor)

EventDetailsEditor.defaultProps = {
  event: { status: EventStatus.Draft, details: {} }
}

EventDetailsEditor.propTypes = {
  createEvent: PropTypes.func,
  updateEvent: PropTypes.func,
  sendNotification: PropTypes.func,
  user: PropTypes.object,
  categories: PropTypes.array
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
    paddingRight: 8,
    paddingBottom: 10,
    paddingLeft: 8,
    backgroundColor: 'white'
  },
  item: {
    flex: 1,
    flexDirection: 'row-reverse'
  },
  fieldName: {
    flex: 1
  },
  pickerLabel: {
    paddingRight: 20
  },
  addressLabel: {
    paddingRight: 20,
    marginTop: 10
  },
  pickerItem: {
    flex: 1
  },
  button: {
    marginTop: 10,
    width: 120,
    justifyContent: 'center'
  },
  createButton: {
    marginTop: 10
  },
  buttonText: {
    color: 'white',
    alignSelf: 'center'
  }
})
