import firebase from 'firebase'
import OneSignal from 'react-native-onesignal'
import Sentry from 'sentry-expo'
import { config, firebaseFunctionsUrl, REFRESH_TIMEOUT } from 'config'

async function registerForPushNotificationsAsync(userId) {
  return new Promise(resolve => {
    // Initialise One Signal
    OneSignal.init(config().oneSignalAppId)
    // Make sure we don't display alerts while in focus
    OneSignal.inFocusDisplaying(0)
    // Add event listener to grab userId
    OneSignal.addEventListener('ids', device => {
      firebase
        .database()
        .ref(`/volunteer/${userId}`)
        .update({ NotificationToken: device.userId })
      resolve(device.userId)
    })
    // Triggers the ids event listener to grab the userId
    OneSignal.configure()
  })
}

export async function updateUser(userKey, properties) {
  return firebase
    .database()
    .ref(`/volunteer/${userKey}`)
    .update(properties)
}

const userSnapshotToJSON = snapshot => ({
  name: `${snapshot.FirstName} ${snapshot.LastName}`,
  phone: snapshot.MobilePhone,
  muted: snapshot.Muted,
  acceptedEventId: snapshot.EventKey,
  role: snapshot.Role,
  locations: snapshot.Locations,
  radius: snapshot.Radius,
  trackAnalytics: snapshot.TrackAnalytics,
  lastSeen: snapshot.LastSeen
})

// Store subscription so to be able to unsubscribe on logoff
let currentUserInfoSubscription

async function subscribeToUserInfo(
  userAuth,
  onChangeCallback,
  onErrorCallback
) {
  if (userAuth && (userAuth.phoneNumber || userAuth.email)) {
    const phoneNumber =
      userAuth.phoneNumber || userAuth.email.replace('@yedidim.org', '')

    // User authenticated, subscribe to get updated details
    const callback = snapshot => {
      if (snapshot && snapshot.val()) {
        onChangeCallback({
          id: phoneNumber,
          ...userSnapshotToJSON(snapshot.val())
        })
      } else {
        onErrorCallback('volunteer-not-registered')
      }
    }

    firebase
      .database()
      .ref(`volunteer/${phoneNumber}`)
      .on('value', callback)

    // Return callback used which the id for unsubscribing
    currentUserInfoSubscription = { callback, userKey: phoneNumber }
  } else {
    // No user authenticated yet, return undefined
    onChangeCallback()
  }
}

export function onAuthenticationChanged(onAuthentication, onError) {
  return firebase.auth().onAuthStateChanged(async userAuth => {
    subscribeToUserInfo(userAuth, onAuthentication, onError)

    if (userAuth && (userAuth.phoneNumber || userAuth.email)) {
      const phoneNumber =
        userAuth.phoneNumber || userAuth.email.replace('@yedidim.org', '')

      await registerForPushNotificationsAsync(phoneNumber)
    }
  })
}

export async function getUserIdToken() {
  // As described at https://firebase.google.com/docs/auth/admin/verify-id-tokens
  // firebase.auth().currentUser.getIdToken(true)
  if (currentUserInfoSubscription && currentUserInfoSubscription.userKey) {
    return Promise.resolve(
      currentUserInfoSubscription && currentUserInfoSubscription.userKey
    )
  }

  throw new Error('Unable to retrieve user id')
}

export async function signInWithPhone({ verificationId, code }) {
  try {
    await firebase
      .auth()
      .signInWithCredential(
        firebase.auth.PhoneAuthProvider.credential(verificationId, code)
      )

    // Should have been subscribed to currentUserInfo already (check onAuthenticationChanged)
  } catch (error) {
    throw error.code
  }
}

export async function signInWithEmailPass({ phoneNumber, id }) {
  try {
    // TODO Support other countries ?
    const userId = `+972${phoneNumber
      .trim()
      .replace(/^0/, '')
      .replace(/-/g, '')}`

    await firebase
      .auth()
      .signInWithEmailAndPassword(`${userId}@yedidim.org`, id)

    // Should have been subscribed to currentUserInfo already (check onAuthenticationChanged)
  } catch (error) {
    throw error.code
  }
}

export async function signOut() {
  const { callback, userKey } = currentUserInfoSubscription

  // Remove notification token
  await firebase
    .database()
    .ref(`/volunteer/${userKey}`)
    .update({ NotificationToken: null })

  // Remove callback for updating user details
  await firebase
    .database()
    .ref(`volunteer/${userKey}`)
    .off('value', callback)

  return firebase.auth().signOut()
}

export const eventSnapshotToJSON = snapshot => {
  if (!snapshot || !snapshot.details) {
    return null
  }

  return {
    id: snapshot.key,
    status: snapshot.status,
    assignedTo:
      typeof snapshot.assignedTo === 'string'
        ? { id: snapshot.assignedTo, name: '', phone: snapshot.assignedTo }
        : snapshot.assignedTo,
    timestamp: snapshot.timestamp || new Date().getTime(),
    address: snapshot.details.address,
    caller: snapshot.details['caller name'],
    carType: snapshot.details['car type'],
    category: snapshot.details.category,
    subCategory: snapshot.details.subCategory,
    city: snapshot.details.city,
    lat: snapshot.details.geo.lat,
    lon: snapshot.details.geo.lon,
    more: snapshot.details.more,
    phone: snapshot.details['phone number'],
    privateInfo: snapshot.details.private_info,
    distance: snapshot.distance,
    dispatcherId: snapshot.dispatcher,
    sentNotification:
      snapshot.notifications &&
      snapshot.notifications.volunteers &&
      snapshot.notifications.volunteers.sent
        ? Object.keys(snapshot.notifications.volunteers.sent).filter(
            userId => !snapshot.notifications.volunteers.sent[userId]
          )
        : [],
    receivedNotification:
      snapshot.notifications &&
      snapshot.notifications.volunteers &&
      snapshot.notifications.volunteers.sent
        ? Object.keys(snapshot.notifications.volunteers.sent).filter(
            userId => snapshot.notifications.volunteers.sent[userId]
          )
        : [],
    errorNotification:
      snapshot.notifications &&
      snapshot.notifications.volunteers &&
      snapshot.notifications.volunteers.error
        ? Object.keys(snapshot.notifications.volunteers.error)
        : []
  }
}

const trackAnalytics = ({ userId, type, value }) => {
  setTimeout(() => {
    try {
      firebase
        .database()
        .ref(`analytics/${userId}/${type}`)
        .push({
          value,
          timestamp: new Date().toString()
        })
    } catch (error) {
      Sentry.captureException(error)
    }
  }, 500)
}

const timeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Timed out function in ${ms}`))
    }, ms)
    promise.then(resolve, reject)
  })

const latestEvents = async shouldTrackAnalytics => {
  let startTime, fetchTime

  // TrackAnalytics
  if (shouldTrackAnalytics) {
    startTime = Date.now()
  }

  const authToken = await firebase.auth().currentUser.getIdToken()

  // Sending location
  // Adding user id
  const url = `${firebaseFunctionsUrl()}/loadLatestOpenEvents?authToken=${authToken}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0
    }
  })

  // TODO Better error handling
  if (response.status !== 200) {
    throw new Error(await response.text())
  }

  const events = await response.json()

  // TrackAnalytics
  if (shouldTrackAnalytics) {
    fetchTime = Date.now()

    trackAnalytics({
      userId: firebase.auth().currentUser.uid,
      type: 'loadEvents',
      value: {
        fetchTime: fetchTime - startTime
      }
    })
  }

  return events.map(event => eventSnapshotToJSON(event))
}

export function loadLatestOpenEvents(shouldTrackAnalytics) {
  return timeout(latestEvents(shouldTrackAnalytics), REFRESH_TIMEOUT)
}

export function subscribeToEvent(eventKey, onChangeCallback) {
  const callback = snapshot => {
    onChangeCallback(eventSnapshotToJSON(snapshot && snapshot.val()))
  }

  firebase
    .database()
    .ref(`events/${eventKey}`)
    .on('value', callback)

  // Return callback used which the id for unsubscribing
  return callback
}

export function unsubscribeToEvent(eventKey, callback) {
  firebase
    .database()
    .ref(`events/${eventKey}`)
    .off('value', callback)
}

export async function acceptEvent(eventKey, user) {
  const { committed } = await firebase
    .database()
    .ref(`events/${eventKey}`)
    .transaction(eventData => {
      const { status } = eventData || {}
      if (status === 'submitted' || status === 'sent') {
        // Assign event to user
        return {
          ...eventData,
          status: 'assigned',
          assignedTo: user
        }
      }
      // Event is taken, return undefined
      return undefined
    })

  if (!committed) {
    throw { code: 'event-taken' } // eslint-disable-line
  }

  // Event was took successful, update volunteer side, don't need transactions
  return firebase
    .database()
    .ref(`volunteer/${user.id}`)
    .update({
      EventKey: eventKey
    })
}

export const acknowledgeReceivedEvent = async (eventId, userId) =>
  firebase
    .database()
    .ref(`events/${eventId}/notifications/volunteers/sent`)
    .update({
      [userId]: true
    })

export async function finaliseEvent(eventKey, user) {
  // Update event to completed and make user free again
  const updates = {
    [`events/${eventKey}/status`]: 'completed',
    [`volunteer/${user.id}/EventKey`]: null
  }

  return firebase
    .database()
    .ref()
    .update(updates)
}

export async function unacceptEvent(eventKey, user) {
  // Update event to sent (for including again in the user list), feedback and make user free again
  const updates = {
    [`events/${eventKey}/status`]: 'sent',
    [`events/${eventKey}/assignedTo`]: null,
    [`volunteer/${user.id}/EventKey`]: null
  }

  return firebase
    .database()
    .ref()
    .update(updates)
}

export async function fetchDispatcher(dispatcherId) {
  const snapshot = await firebase
    .database()
    .ref(`dispatchers/${dispatcherId}`)
    .once('value')
  const { name, phone } = snapshot.val() || {}
  return { id: snapshot.key, name, phone }
}
