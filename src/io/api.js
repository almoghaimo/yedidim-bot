import firebase from 'firebase';
import GeoFire from 'geofire';
import { Notifications, Location } from 'expo';
import * as phonePermissionsHandler from 'phoneInterface/phonePermissionsHandler';

const EVENTS_SEARCH_RADIUS_KM = 20;

async function registerForPushNotificationsAsync() {
    let hasPermission = await phonePermissionsHandler.getNotificationsPermission();
    if (!hasPermission) {
        throw {
            code: 'Notification not granted',
            message: 'User did not granted notification permissions'
        }
    }

    // Get the token that uniquely identifies this device
    return Notifications.getExpoPushTokenAsync();
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
    acceptedEventId: snapshot.EventKey
})

// Store subscription so to be able to unsubscribe on logoff
let currentUserInfoSubscription;

async function subscribeToUserInfo(userAuth,
                                   onChangeCallback,
                                   onErrorCallback) {
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
        currentUserInfoSubscription = {callback, userKey: phoneNumber}
    } else {
        // No user authenticated yet, return undefined
        onChangeCallback()
    }
}

async function updateUserNotificationToken(userId) {
    const NotificationToken = await registerForPushNotificationsAsync()

    return firebase
        .database()
        .ref(`/volunteer/${userId}`)
        .update({NotificationToken})
}

export function onAuthenticationChanged(onAuthentication, onError) {
    return firebase.auth().onAuthStateChanged(async userAuth => {
        subscribeToUserInfo(userAuth, onAuthentication, onError)
    })
}

export async function signInWithPhone({verificationId, code}) {
    try {
        const userAuth = await firebase
            .auth()
            .signInWithCredential(
                firebase.auth.PhoneAuthProvider.credential(verificationId, code)
            )

        // Update notification token after sign in
        await updateUserNotificationToken(userAuth.phoneNumber)

        // Should have been subscribed to currentUserInfo already (check onAuthenticationChanged)
    } catch (error) {
        throw error.code
    }
}

export async function signInWithEmailPass({phoneNumber, id}) {
    try {
        // TODO Support other countries ?
        const userId = `+972${phoneNumber
            .trim()
            .replace(/^0/, '')
            .replace(/-/g, '')}`

        await firebase
            .auth()
            .signInWithEmailAndPassword(`${userId}@yedidim.org`, id)

        // Update notification token after sign in
        await updateUserNotificationToken(userId)

        // Should have been subscribed to currentUserInfo already (check onAuthenticationChanged)
    } catch (error) {
        throw error.code
    }
}

export async function signOut() {
    const {callback, userKey} = currentUserInfoSubscription

    // Remove notification token
    await firebase
        .database()
        .ref(`/volunteer/${userKey}`)
        .update({NotificationToken: null})

    // Remove callback for updating user details
    await firebase
        .database()
        .ref(`volunteer/${userKey}`)
        .off('value', callback)

    return firebase.auth().signOut()
}

const eventSnapshotToJSON = snapshot => ({
    id: snapshot.key,
    status: snapshot.status,
    assignedTo: snapshot.assignedTo,
    timestamp: snapshot.timestamp,
    address: snapshot.details.address,
    caller: snapshot.details['caller name'],
    carType: snapshot.details['car type'],
    type: snapshot.details.case,
    city: snapshot.details.city,
    lat: snapshot.details.geo.lat,
    lon: snapshot.details.geo.lon,
    more: snapshot.details.more,
    phone: snapshot.details['phone number'],
    distance: snapshot.distance
});

export async function loadLatestOpenEvents() {
    return new Promise(async (resolve, reject) => {
        try {
            let fetchedEvents;
            let hasLocationPermission = await phonePermissionsHandler.getLocationPermission();
            if (hasLocationPermission) {
                fetchedEvents = await fetchLatestOpenEventsLocationBased();
            } else {
                fetchedEvents = await fetchLatestOpenedEvents();
            }
            let events = fetchedEvents
                .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
                .slice(0, 25)
                .map(childSnapshot => {
                    return eventSnapshotToJSON(childSnapshot);
                });
            resolve(events);
        } catch (error) {
            reject(error);
        }
    });
}

async function fetchLatestOpenEventsLocationBased() {
    return new Promise(async (resolve, reject) => {
        try {
            let currentLocation = await Location.getCurrentPositionAsync({});
            let {latitude, longitude} = currentLocation.coords;
            const nearEventIdToDistance = {};
            let geoFire = new GeoFire(firebase.database().ref().child('events-locations'));
            let geoQuery = geoFire.query({
                center: [latitude, longitude],
                radius: EVENTS_SEARCH_RADIUS_KM
            });

            let onKeyEnteredRegistration = geoQuery.on("key_entered", function (eventId, location, distance) {
                nearEventIdToDistance[eventId] = distance;
            });

            let onReadyRegistration = geoQuery.on("ready", function () {
                geoQuery.cancel();
                firebase.database()
                    .ref('events')
                    .orderByChild('status')
                    .equalTo('sent')
                    .once('value', snapshot => {
                        let eventsById = snapshot.val() || {};
                        let nearSentEvents = Object.keys(eventsById).filter(eventId => nearEventIdToDistance.hasOwnProperty(eventId))
                            .map(eventId => {
                                let event = eventsById[eventId];
                                event.distance = nearEventIdToDistance[eventId];
                                return event;
                            });
                        resolve(nearSentEvents);
                    });
            });
        } catch (error) {
            reject(error);
        }
    })
}

async function fetchLatestOpenedEvents() {
    return new Promise(async (resolve, reject) => {
        try {
            firebase.database()
                .ref('events')
                .orderByChild('status')
                .equalTo('sent')
                .once('value', snapshot => {
                    resolve(Object.values(snapshot.val() || {}));
                });
        } catch (error) {
            reject(error);
        }
    })
}

export function subscribeToEvent(eventKey, onChangeCallback) {
    const callback = snapshot => {
        if (snapshot && snapshot.val()) {
            onChangeCallback(eventSnapshotToJSON(snapshot.val()))
        }
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

export async function acceptEvent(eventKey, userKey) {
    const {committed} = await firebase
        .database()
        .ref(`events/${eventKey}`)
        .transaction(eventData => {
            const {status} = eventData
            if (status === 'submitted' || status === 'sent') {
                // Assign event to user
                return {
                    ...eventData,
                    status: 'assigned',
                    assignedTo: userKey
                }
            }
            // Event is taken, return undefined
            return undefined
        })

    if (!committed) {
        throw {code: 'event-taken'}
    }

    // Event was took successful, update volunteer side, don't need transactions
    return firebase
        .database()
        .ref(`volunteer/${userKey}`)
        .update({
            EventKey: eventKey
        })
}

export async function finaliseEvent(eventKey, userKey, feedback) {
    // Update event to completed and make user free again
    const updates = {
        [`events/${eventKey}/status`]: 'completed',
        [`events/${eventKey}/feedback`]: feedback,
        [`volunteer/${userKey}/EventKey`]: null
    }

    return firebase
        .database()
        .ref()
        .update(updates)
}

export async function unacceptEvent(eventKey, userKey, feedback) {
    // Update event to submitted, feedback and make user free again
    const updates = {
        [`events/${eventKey}/status`]: 'submitted',
        [`events/${eventKey}/assignedTo`]: null,
        [`events/${eventKey}/unaccepted`]: {
            feedback,
            userKey
        },
        [`volunteer/${userKey}/EventKey`]: null
    }

    return firebase
        .database()
        .ref()
        .update(updates)
}
