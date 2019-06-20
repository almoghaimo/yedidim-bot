import * as firebase from 'firebase'
import {
  SET_USER,
  REMOVE_USER,
  SET_EVENTS,
  SET_EVENT,
  ADD_EVENT,
  SET_DISPATCHER,
  SET_DISPATCHERS,
  SET_VOLUNTEERS,
  SET_CATEGORIES,
  SET_SEARCH_EVENTS,
  SET_NOTIFICATIONS,
  SET_ERROR,
  SET_LATEST_VERSION
} from '../constants/actionTypes'
import {
  registerForPushNotifications,
  sendTestNotificationToDispatcher
} from './notificationsActions'
import { objectToArray, getInstance } from '../common/utils'
import { EventStatus, LOG_EVENTS } from '../constants/consts'
import { logger } from '../Logger'

const firebaseConfig = {
  development: {
    apiKey: 'AIzaSyAwKEsWodtnrprOhYXA5tFb9zbUnLqOBk4',
    authDomain: 'yedidim-sandbox-2.firebaseapp.com',
    databaseURL: 'https://yedidim-sandbox-2.firebaseio.com',
    projectId: 'yedidim-sandbox-2',
    functionsURL: 'https://us-central1-yedidim-sandbox-2.cloudfunctions.net',
    storageBucket: 'yedidim-sandbox-2.appspot.com',
    messagingSenderId: '1011917548573'
  },
  production: {
    apiKey: 'AIzaSyC6bf7YfKoompBlyjw382AJZOzTvLaY7P0',
    authDomain: 'yedidim-production.firebaseapp.com',
    databaseURL: 'https://yedidim-production.firebaseio.com',
    functionsURL: 'https://us-central1-yedidim-production.cloudfunctions.net',
    projectId: 'yedidim-production',
    storageBucket: 'yedidim-production.appspot.com',
    messagingSenderId: '33558411934'
  }
}

firebase.initializeApp(firebaseConfig[getInstance()])

export function getFunctionsUrl() {
  return firebaseConfig[getInstance()].functionsURL
}

export function checkUserAuth() {
  return dispatch => {
    firebase.auth().onAuthStateChanged(user => {
      if (user && user.providerData[0].providerId === 'password') {
        user.id = user.email.split('@')[0]
        dispatch(
          handleSignedInUser({ id: user.id, uid: user.uid, email: user.email })
        )
      } else {
        dispatch(handleSignedOutUser())
      }
    })
  }
}

export function signIn(id, phone, onError) {
  return () => {
    const email = id + '@yedidim.org'
    firebase
      .auth()
      .signInWithEmailAndPassword(email, phone)
      .then(() => {
        logger.setUserId(id)
        logger.logEvent(LOG_EVENTS.LOGIN_SUCCESS)
      })
      .catch(function(error) {
        logger.setUserId(id)
        logger.logEventWithProperties(LOG_EVENTS.LOGIN_FAIL, { error })
        console.log('failed to sign in', error)
        onError('פרטים שגויים. נסה שנית')
      })
  }
}

export function storeNotificationToken(token) {
  return (dispatch, getState) => {
    const user = getState().dataSource.user
    if (!user || !user.id) {
      return
    }
    firebase
      .database()
      .ref('dispatchers/' + getState().dataSource.user.id)
      .update(
        {
          token,
          notifications: true
        },
        err => {
          if (err) {
            logger.logEventWithProperties(LOG_EVENTS.TOKEN_STORE_FAIL, {
              error: err
            })
            dispatch(setError('Unable to set token. ', err))
          } else {
            logger.logEventWithProperties(LOG_EVENTS.TOKEN_STORE_SUCCESS, {
              token
            })
            dispatch(setNotifications(true))
            console.log('Token was set', token)
          }
        }
      )
  }
}

export function enableNotifications(enable) {
  return (dispatch, getState) => {
    if (enable) {
      dispatch(setNotifications(true))
      dispatch(registerForPushNotifications())
    } else {
      firebase
        .database()
        .ref('dispatchers/' + getState().dataSource.user.id)
        .update(
          {
            notifications: false
          },
          err => {
            if (err) {
              dispatch(setError('Unable to disable notifications. ', err))
            } else {
              dispatch(setNotifications(false))
            }
          }
        )
    }
  }
}

export function signOutUser() {
  return (dispatch, getState) => {
    deleteNotificationToken(getState().dataSource.user).then(() => {
      firebase
        .auth()
        .signOut()
        .then(() => {
          dispatch(handleSignedOutUser())
          logger.setUserId(null)
          // logger.regenerateDeviceId()
        })
    })
  }
}

export function sendTestNotificationToSelf() {
  return (dispatch, getState) => {
    sendTestNotificationToDispatcher(getState().dataSource.user.id)
  }
}

export function createEvent(event) {
  event.key = firebase
    .database()
    .ref()
    .child('events')
    .push().key
  event.timestamp = Date.now()
  event.details.subCategory = event.details.subCategory || null
  return dispatch => {
    firebase
      .database()
      .ref('events/' + event.key)
      .set(event, err => {
        if (err) {
          dispatch(setError('Failed to create event!', err))
        } else {
          logger.logEventWithProperties(LOG_EVENTS.EVENT_CREATED, event.details)
        }
      })
  }
}

export function updateEvent(event, changes) {
  return (dispatch, getState) => {
    const dispatcher = getState().dataSource.user.id
    firebase
      .database()
      .ref('events/' + event.key)
      .transaction(currentEvent => {
        currentEvent.details = event.details
        currentEvent.dispatcher = dispatcher
        return currentEvent
      })
      .then(result => {
        if (!result.committed) {
          dispatch(setError('האירוע כבר בטיפול'))
        } else if (result.snapshot) {
          logger.logEventWithProperties(LOG_EVENTS.EVENT_EDITED, {
            event: event.key,
            changes
          })
          dispatch(setEvent(result.snapshot.val()))
        }
      })
      .catch(err => {
        dispatch(setError('Failed to update!', err))
      })
  }
}

export function takeEvent(event) {
  return (dispatch, getState) => {
    const dispatcher = getState().dataSource.user.id
    firebase
      .database()
      .ref('events/' + event.key)
      .transaction(currentEvent => {
        if (!currentEvent.dispatcher) {
          currentEvent.dispatcher = dispatcher
          return currentEvent
        } else {
          return undefined
        }
      })
      .then(result => {
        if (!result.committed) {
          dispatch(setError('האירוע כבר בטיפול'))
        } else if (result.snapshot) {
          dispatch(setEvent(result.snapshot.val()))
        }
      })
      .catch(err => {
        dispatch(setError('Failed to update!', err))
      })
  }
}

export function assignEvent(event, volunteer) {
  return dispatch => {
    firebase
      .database()
      .ref('events/' + event.key)
      .transaction(currentEvent => {
        if (!currentEvent.assignedTo) {
          currentEvent.assignedTo = volunteer
          currentEvent.status = EventStatus.Assigned
          return currentEvent
        } else {
          return undefined
        }
      })
      .then(result => {
        if (!result.committed) {
          dispatch(setError('האירוע כבר בטיפול'))
        } else if (result.snapshot) {
          dispatch(setEvent(result.snapshot.val()))
        }
      })
      .catch(err => {
        dispatch(setError('Failed to update!', err))
      })
  }
}

export function updateEventStatus(event, status) {
  return (dispatch, getState) => {
    const dispatcher = getState().dataSource.user.id
    const updatedEvent = Object.assign({}, event, { status, dispatcher })

    const updates = {}

    if (status === EventStatus.Completed) {
      // If status is completed, we need to remove assignment from user
      updatedEvent.assignedTo = null
      if (event.assignedTo && event.assignedTo.id) {
        updates[`volunteer/${event.assignedTo.id}/EventKey`] = null
      }
    }

    updates[`events/${event.key}`] = updatedEvent

    firebase
      .database()
      .ref()
      .update(updates, err => {
        if (err) {
          dispatch(setError('Failed to update!', err))
        } else {
          dispatch(setEvent(updatedEvent))
        }
      })
  }
}

function handleSignedInUser(user) {
  return dispatch => {
    dispatch(loadUserData(user))
    dispatch(loadEvents())
    // dispatch(loadVolunteers());
    // dispatch(loadDispatchers());
    dispatch(loadCategories())
  }
}

function handleSignedOutUser() {
  return dispatch => {
    dispatch(removeUser())
  }
}

function deleteNotificationToken(user) {
  return new Promise(resolve => {
    firebase
      .database()
      .ref('dispatchers/' + user.id)
      .update(
        {
          notifications: false
        },
        err => {
          if (err) {
            console.error('Unable to remove token. ', err)
          } else {
            console.log('Token was removed')
          }
          resolve()
        }
      )
  })
}

function checkVersion() {
  return dispatch => {
    firebase
      .database()
      .ref('/settings/dispatcherApp/version')
      .on('value', snapshot => {
        const version = snapshot.val()
        dispatch(setLatestVersion(version))
      })
  }
}

function loadUserData(user) {
  return dispatch => {
    firebase
      .database()
      .ref('/dispatchers')
      .child(user.id)
      .once('value')
      .then(snapshot => {
        const data = snapshot.val()
        user.name = data.name
        user.notifications = data.notifications
        user.handleBot = data.handleBot
        logger.setUserProperties({ Name: data.name })
        dispatch(setUser(user))
        dispatch(registerForPushNotifications())
      })
      .catch(err => {
        dispatch(setError('Failed to load user', err))
      })
  }
}

export function updateUserVersion(user) {
  return (dispatch, getState) => {
    firebase
      .database()
      .ref('dispatchers/' + user.id)
      .update({
        time: new Date(),
        version: getState().dataSource.version
      })
  }
}

const relevantEvent = event =>
  event.status === EventStatus.Sent ||
  event.status === EventStatus.Submitted ||
  event.status === EventStatus.Assigned

export function loadEvents(onLoad) {
  return (dispatch, getState) => {
    firebase
      .database()
      .ref('/events')
      .orderByChild('isOpen')
      .equalTo(true)
      .once('value')
      .then(snapshot => {
        let events = objectToArray(snapshot.val()).filter(relevantEvent)
        sortEventsDescending(events)
        dispatch(setEvents(events))
        if (onLoad) {
          onLoad()
        }
        const timestamp =
          events.length > 0 ? events[0].timestamp + 1 : new Date().getTime()

        // Detach previous callback (we are reattaching it further)
        firebase
          .database()
          .ref('/events')
          .off()

        firebase
          .database()
          .ref('/events')
          .orderByChild('timestamp')
          .startAt(timestamp)
          .on('child_added', data => {
            //In case the event already exists ignore it
            if (
              !getState().dataSource.events.find(
                event => event.key === data.key
              )
            ) {
              let event = data.val()
              event.key = data.key
              dispatch(addEvent(event))
            }
          })
        firebase
          .database()
          .ref('/events')
          .orderByChild('isOpen')
          .equalTo(true)
          .on('child_changed', data => {
            let event = data.val()
            if (!relevantEvent(event)) {
              return
            }
            event.key = data.key
            dispatch(setEvent(event))
          })
      })
      .catch(err => {
        if (err) {
          dispatch(setError('Failed to load data!', err))
        }
      })
  }
}

function sortEventsDescending(events) {
  events.sort((c1, c2) => {
    if (c1.timestamp > c2.timestamp) return -1
    if (c1.timestamp < c2.timestamp) return 1
    return 0
  })
}

function getEventsQuery(collection, fromDate, toDate, phone) {
  let query = firebase.database().ref(collection)
  if (fromDate) {
    query = query.orderByChild('timestamp').startAt(fromDate)
  }
  if (toDate) {
    if (!fromDate) {
      query = query.orderByChild('timestamp')
    }
    query = query.endAt(toDate)
  }
  if (!fromDate && !toDate && phone) {
    query = query.orderByChild('details/phone number').equalTo(phone)
  }
  return query
}

export function searchEvents(phone, fromDate, toDate) {
  return (dispatch, getState) => {
    const dispatchers = getState().dataSource.dispatchers || {}
    let queryEvents = getEventsQuery('events', fromDate, toDate, phone)
    let queryEventsArchive = getEventsQuery(
      'events_archive',
      fromDate,
      toDate,
      phone
    )
    Promise.all([queryEvents.once('value'), queryEventsArchive.once('value')])
      .then(([eventsSnapshot, archivedSnapshot]) => {
        let events = objectToArray(eventsSnapshot.val())
        events = events.concat(objectToArray(archivedSnapshot.val()))
        sortEventsDescending(events)
        events = events.filter(event => event.status !== EventStatus.Draft)
        if (phone) {
          events = events.filter(
            event => event.details['phone number'] === phone
          )
        }
        loadDispatchersOfEvents(events, dispatchers, dispatch)
        dispatch(setSearchEvents(events))
      })
      .catch(err => {
        if (err) {
          dispatch(setError('Failed to load data!', err))
        }
      })
  }
}

function loadDispatchersOfEvents(events, existingDispatchers, dispatch) {
  const loadedDispatchersIds = []
  events.forEach(event => {
    const dispatcherId = event.dispatcher
    if (
      !existingDispatchers[dispatcherId] &&
      !loadedDispatchersIds.includes(dispatcherId)
    ) {
      dispatch(loadDispatcher(event.dispatcher))
      loadedDispatchersIds.push(dispatcherId)
    }
  })
}

function loadVolunteers() {
  return dispatch => {
    firebase
      .database()
      .ref('/volunteer')
      .once('value')
      .then(snapshot => {
        const volunteers = objectToArray(snapshot.val()).map(volunteer => {
          return {
            key: volunteer.key,
            firstName: volunteer.FirstName,
            lastName: volunteer.LastName,
            phone: volunteer.MobilePhone,
            code: volunteer.DriveCode
          }
        })

        dispatch(setVolunteers(volunteers))
      })
      .catch(err => {
        if (err) {
          dispatch(setError('Failed to load data!', err))
        }
      })
  }
}

export function loadDispatcher(dispatcherId) {
  return dispatch => {
    firebase
      .database()
      .ref(`/dispatchers/${dispatcherId}`)
      .once('value')
      .then(snapshot => {
        const dispatcher = snapshot.val()
        dispatch(
          setDispatcher({
            id: dispatcherId,
            name: dispatcher ? dispatcher.name : ''
          })
        )
      })
      .catch(err => {
        if (err) {
          dispatch(setError('Failed to load dispatcher data!', err))
        }
      })
  }
}

function loadCategories() {
  return dispatch => {
    firebase
      .database()
      .ref('/eventCategories')
      .once('value')
      .then(snapshot => {
        const categories = snapshot.val()
        dispatch(setCategories(categories))
      })
      .catch(err => {
        if (err) {
          dispatch(setError('Failed to load data!', err))
        }
      })
  }
}

export function setError(message, err) {
  console.log('Error: ' + message, err)
  return {
    type: SET_ERROR,
    message,
    err
  }
}

export function clearMessage() {
  return {
    type: SET_ERROR
  }
}

function setUser(user) {
  return {
    type: SET_USER,
    user
  }
}

function removeUser() {
  return {
    type: REMOVE_USER
  }
}

function setEvents(events) {
  return {
    type: SET_EVENTS,
    events
  }
}

function setEvent(event) {
  return {
    type: SET_EVENT,
    event
  }
}

function addEvent(event) {
  return {
    type: ADD_EVENT,
    event
  }
}

function setDispatchers(dispatchers) {
  return {
    type: SET_DISPATCHERS,
    dispatchers
  }
}

function setDispatcher(dispatcher) {
  return {
    type: SET_DISPATCHER,
    dispatcher
  }
}

function setVolunteers(volunteers) {
  return {
    type: SET_VOLUNTEERS,
    volunteers
  }
}

function setCategories(categories) {
  return {
    type: SET_CATEGORIES,
    categories
  }
}

function setSearchEvents(events) {
  return {
    type: SET_SEARCH_EVENTS,
    events
  }
}

function setNotifications(notifications) {
  return {
    type: SET_NOTIFICATIONS,
    notifications
  }
}

function setLatestVersion(version) {
  return {
    type: SET_LATEST_VERSION,
    version
  }
}
