import * as geoHelper from './geoHelper'
import logger from '../lib/logger'
const values = require('object.values')
import GeoFire from 'geofire'

const EVENTS_SEARCH_RADIUS_KM = 20

const filteredEvents = (admin, status) =>
  new Promise((resolve, reject) => {
    admin
      .database()
      .ref('events')
      .orderByChild('status')
      .equalTo(status)
      .once(
        'value',
        snapshot => {
          resolve(snapshot.val() || {})
        },
        error => reject(error)
      )
  })

const relevantEvents = admin =>
  Promise.all(['assigned', 'sent'].map(filteredEvents.bind(this, admin))).then(
    results => Object.assign({}, ...results)
  )

exports.loadLatestOpenEvents = async (req, res, admin) => {
  console.log('[LatestOpenEvents]', req.query)

  try {
    const user = await admin.auth().verifyIdToken(req.query.authToken)
    const authToken =
      user.phone_number || user.email.replace('@yedidim.org', '')

    // Retrieve last location for user
    const coords =
      (await geoHelper.getLastLocation('user_location', admin, authToken)) || []

    console.log('[LatestOpenEvents]', user, authToken, coords)

    if (coords[0] && coords[1]) {
      const nearEventIdToDistance = {}
      const geoFire = new GeoFire(
        admin
          .database()
          .ref()
          .child('event-location')
      )
      const geoQuery = geoFire.query({
        center: coords,
        radius: EVENTS_SEARCH_RADIUS_KM
      })

      geoQuery.on('key_entered', (eventId, location, distance) => {
        nearEventIdToDistance[eventId] = distance
      })

      geoQuery.on('ready', () => {
        geoQuery.cancel()
        relevantEvents(admin)
          .then(eventsById => {
            // The query above also retrieves draft events, we need to filter
            // it out
            const eventsToReturn = Object.keys(eventsById)
              .filter(
                eventId =>
                  !!eventsById[eventId].isOpen && !!eventsById[eventId].details
              )
              .filter(eventId => !!nearEventIdToDistance[eventId])
              .filter(
                eventId =>
                  eventsById[eventId].status === 'assigned' ||
                  eventsById[eventId].status === 'sent'
              )
              .map(eventId => {
                const event = eventsById[eventId]
                event.distance = nearEventIdToDistance[eventId]
                return event
              })
              .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
              .slice(0, 25)
            if (eventsToReturn.length < 25) {
              const oldestEventsFirst = values(eventsById)
                .filter(event => !!event.isOpen && !!event.details)
                .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
              let i = 0
              while (
                eventsToReturn.length < 25 &&
                i < oldestEventsFirst.length
              ) {
                const currentEvent = oldestEventsFirst[i]
                if (!nearEventIdToDistance[currentEvent.uid]) {
                  const eventLocation = [
                    currentEvent.details.geo.lat,
                    currentEvent.details.geo.lon
                  ]
                  currentEvent.distance = GeoFire.distance(
                    coords,
                    eventLocation
                  )
                  eventsToReturn.push(currentEvent)
                }
                i += 1
              }
            }

            logger.track({
              eventType: 'retrieve latest events', // required
              userId: authToken,
              eventProperties: {
                origin: 'server',
                latitude: coords[0],
                longitude: coords[1]
              }
            })

            console.log(
              '[LatestOpenEvents] Return with location',
              authToken,
              coords,
              eventsToReturn
            )

            res.status(200).send(eventsToReturn)
          })
          .catch(error => {
            throw error
          })
      })
    } else {
      const snapshot = await admin
        .database()
        .ref('events')
        .orderByChild('isOpen')
        .equalTo(true)
        .once('value')

      // Shim for Object.values (not in node6)
      const events = values(snapshot.val() || {})
        .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
        .filter(event => event.status === 'assigned' || event.status === 'sent')
        .slice(0, 25)

      logger.track({
        eventType: 'retrieve latest events (no location)', // required
        userId: authToken,
        eventProperties: {
          origin: 'server'
        }
      })

      console.log(
        '[LatestOpenEvents] Return without location',
        authToken,
        events
      )

      res.status(200).send(events)
    }
  } catch (error) {
    console.error('[LatestOpenEvents] Error', error)
    res.status(500).send(error.message)
  }
}
