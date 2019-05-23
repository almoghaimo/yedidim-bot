import { sendEventNotificationToCloseByVolunteers } from './notificationsHandler'
import * as geoHelper from './geoHelper'
const EVENT_TIMELINE_ACTIONS = require('../lib/consts').EVENT_TIMELINE_ACTIONS
import { addTimelineEntry, addTimelineEntryFromStatus } from '../lib/timeline'

exports.onVolunteersLocationsUpdated = (event, context, admin) => {
  const volunteerId = context.params.volunteerId
  const currentLocations = event.after.val() || [] // 2
  const previousLocations = event.before.val() || [] // 3

  console.log(
    'Locations changed:',
    previousLocations,
    currentLocations,
    volunteerId
  )

  const addedLocations = currentLocations.filter(
    x => !previousLocations.map(x => x.id).includes(x.id)
  )

  const removedLocations = previousLocations.filter(
    x => !currentLocations.map(x => x.id).includes(x.id)
  )

  console.log('Added Location', addedLocations, volunteerId)
  console.log('Removed Location', removedLocations, volunteerId)

  // Remove or Add Locations
  return Promise.all([
    ...addedLocations.map(({ id, lat, lon }) =>
      geoHelper.saveLocation('user_location', admin, `${volunteerId}-${id}`, [
        lat,
        lon
      ])
    ),
    ...removedLocations.map(({ id }) =>
      geoHelper.removeLocation('user_location', admin, `${volunteerId}-${id}`)
    )
  ])
}

exports.onEventStatusUpdate = (event, context, admin) => {
  let eventId = context.params.eventId
  let currentStatus = event.after.val()
  let previousStatus = event.before.val()

  console.log(
    'Event Status changed from ' +
      previousStatus +
      ' to ' +
      currentStatus +
      ' for eventId' +
      eventId
  )

  let promises = [Promise.resolve()]
  let currentIsOpen = calculateIsOpen(currentStatus)
  let previousIsOpen = calculateIsOpen(previousStatus)

  if (currentIsOpen !== previousIsOpen) {
    console.log('Setting isOpen ' + currentIsOpen + ' for event ' + eventId)
    promises.push(event.after.ref.parent.child('isOpen').set(currentIsOpen))
  }

  // Log new event state for bug detection
  promises.push(
    new Promise((resolve, reject) => {
      event.after.ref.parent
        .once('value')
        .then(eventSnapshot => {
          const eventData = eventSnapshot.val()
          console.log(
            'Event Status changed from ' +
              previousStatus +
              ' to ' +
              currentStatus +
              ' for event data',
            eventId,
            eventData
          )
          return eventData
        })
        .then(eventData => {
          return addTimelineEntryFromStatus(
            currentStatus,
            previousStatus,
            eventData
          )
        })
        .then(() => resolve())
        .catch(e => reject(e))
    })
  )

  if (shouldNotifyVolunteers(previousStatus, currentStatus)) {
    console.log('Will notify volunteers of event ', eventId)
    promises.push(
      new Promise((resolve, reject) => {
        return event.after.ref.parent
          .once('value')
          .then(eventSnapshot => {
            let eventData = eventSnapshot.val()
            return Promise.all([
              sendEventNotificationToCloseByVolunteers(
                eventData,
                previousStatus === 'assigned' ? 'קריאה חוזרת' : 'קריאה חדשה',
                admin
              ),
              addTimelineEntry({
                eventId,
                action: 'הוקפץ לכוננים',
                who: 'אוטומאטי'
              })
            ])
          })
          .then(() => resolve())
          .catch(e => reject(e))
      })
    )
  }

  return Promise.all(promises)
}

exports.onEventCreated = (snapshot, context, admin) => {
  let eventId = context.params.eventId
  console.log('Created event ' + eventId)
  let eventData = snapshot.val()
  let isOpen = calculateIsOpen(eventData.status)
  console.log('Setting isOpen ' + isOpen + ' for event ' + eventId)

  return snapshot.ref.child('isOpen').set(isOpen)
}

exports.onEventIsOpenUpdate = (event, context, admin) => {
  let eventId = context.params.eventId
  if (!event.after.exists()) {
    console.log('Ignoring delete isOpen for ' + eventId)
    return -1
  }
  let isOpen = event.after.val()
  console.log('event ' + eventId + ' isOpen = ' + isOpen)
  return event.after.ref.parent.once('value').then(eventSnapshot => {
    let eventData = eventSnapshot.val()
    if (isOpen) {
      return Promise.all([addEventGeoIndex(eventId, eventData, admin)])
    } else {
      try {
        if (eventData.status === 'completed') {
          console.log('Archiving event ' + eventId)
          let eventRef = admin.database().ref(`events/${eventId}`)
          let archiveRef = admin.database().ref(`events_archive/${eventId}`)
          if (eventData) {
            return Promise.all([archiveRef.set(eventData), eventRef.remove()])
          }
        }
      } catch (e) {
        console.error('Error archiving event ' + eventId)
      }
    }
  })
}

exports.onEventDeleted = (snapshot, context, admin) => {
  let eventId = context.params.eventId
  return removeEventGeoIndex(eventId, admin)
}

let addEventGeoIndex = (eventId, eventData, admin) => {
  return geoHelper.saveLocation('event_location', admin, eventId, [
    parseFloat(eventData.details.geo.lat),
    parseFloat(eventData.details.geo.lon)
  ])
}

let removeEventGeoIndex = (eventId, admin) => {
  return geoHelper.removeLocation('event_location', admin, eventId)
}

let calculateIsOpen = status => {
  return ['submitted', 'sent', 'assigned', 'taken'].indexOf(status) !== -1
}

let shouldNotifyVolunteers = (previousStatus, currentStatus) => {
  return (
    currentStatus === 'sent' &&
    (previousStatus !== 'sent' || previousStatus !== 'submitted')
  )
}
