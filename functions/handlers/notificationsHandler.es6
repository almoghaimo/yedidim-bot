import { NOTIFICATION_SEARCH_RADIUS_KM, CategoriesDisplay } from './consts'
const eventUpdatesHandlers = require('./eventUpdatesHandlers')
import { addTimelineEntry } from '../lib/timeline'
const {
  sendNotificationToUsers,
  sendNotificationByGeoFireLocation
} = require('../lib/notifications')

// exports.handleUpdateEvent = (eventId, change, admin) => {
//   let eventData = change.after.val()
//   let previousValue = change.before.val()
//   console.log('Event updated = ', eventData)

//   if (!haveToSendNotification(eventData, previousValue)) {
//     console.log('blocked', eventData.status)
//     return Promise.resolve('blocked')
//   }
//   return sendEventNotificationToCloseByVolunteers(
//     eventData,
//     'קריאה חדשה',
//     admin
//   )
// }
exports.sendNotificationBySearchRadius = async (req, res, admin) => {
  try {
    let { eventId } = req.body
    let searchRadius = req.body.searchRadius && parseInt(req.body.searchRadius)
    let snapshot = await admin
      .database()
      .ref('/events/' + eventId)
      .once('value')
    let event = snapshot.val()
    if (event) {
      await sendEventNotificationToCloseByVolunteers(
        event,
        'קריאה חדשה',
        admin,
        searchRadius
      )

      await addTimelineEntry({
        eventId,
        action: 'הוקפץ לכוננים',
        who: 'מוקדן',
        value: `רדיוס ${searchRadius + ' ק״מ' || 'ברירת מחדל'}`
      })

      res.status(200).send('')
    } else {
      res.status(404).send('Did not find event ' + eventId)
    }
  } catch (e) {
    console.error('[sendNotificationBySearchRadius] Error:', e)
    res.status(500).send(e)
  }
}
exports.sendNotificationToRecipient = async (req, res, admin) => {
  try {
    let { eventId, recipient } = req.body
    let snapshot = await admin
      .database()
      .ref('/events/' + eventId)
      .once('value')
    let event = snapshot.val()
    if (event) {
      let snapshot = await admin
        .database()
        .ref('/volunteer/' + recipient)
        .once('value')
      let user = snapshot.val()
      if (user) {
        let title =
          user.EventKey === eventId ? 'התראה על אירוע פעיל' : 'התראה על אירוע'

        let message = await formatNotification(event, admin)
        let data = {
          eventId: event.key,
          event,
          type: 'event'
        }
        await sendNotificationToUsers({
          title,
          message,
          data,
          appType: 'volunteers',
          users: [user]
        })
      } else {
        let message = 'Did not find recipient ' + recipient
        res.status(404).send(message)
        console.error(message)
      }
    } else {
      let message = 'Did not find event ' + eventId
      res.status(404).send(message)
      console.error(message)
    }
  } catch (e) {
    console.error(e)
    res.status(500).send(e)
  }
}

exports.sendDispatcherTestNotification = async (req, res, admin) => {
  try {
    let { dispatcherCode } = req.body
    let snapshot = await admin
      .database()
      .ref('/dispatchers/' + dispatcherCode)
      .once('value')
    const user = snapshot.val()
    let title = 'בדיקה'
    let message = 'בדיקה'
    let data = {
      type: 'test'
    }
    await sendNotificationToUsers({
      title,
      message,
      data,
      appType: 'dispatchers',
      users: [user]
    })
    res.status(200).send('')
  } catch (e) {
    console.error(e)
    res.status(500).send(e)
  }
}
exports.sendVolunteerTestNotification = async (req, res, admin) => {
  try {
    let { phone } = req.body
    if (phone.charAt(0) === '0') {
      phone = '+972' + phone.substr(1)
    }
    let snapshot = await admin
      .database()
      .ref('/volunteer/' + phone)
      .once('value')
    const user = snapshot.val()
    let title = 'בדיקה'
    let message = 'בדיקה'
    let data = {
      type: 'test'
    }
    await sendNotificationToUsers({
      title,
      message,
      data,
      appType: 'volunteers',
      users: [user]
    })
    res.status(200).send('')
  } catch (e) {
    res.status(500).send(e)
  }
}
const sendEventNotificationToCloseByVolunteers = async (
  eventData,
  notificationTitle,
  admin,
  radius
) => {
  let latitude = eventData.details.geo.lat
  let longitude = eventData.details.geo.lon
  radius = radius || NOTIFICATION_SEARCH_RADIUS_KM
  let title = notificationTitle

  let message = await formatNotification(eventData, admin)
  let data = {
    eventId: eventData.key,
    event: eventData,
    type: 'event'
  }
  // return sendNotificationByOneSignalLocation({
  return sendNotificationByGeoFireLocation({
    title,
    message,
    data,
    latitude,
    longitude,
    radius,
    appType: 'volunteers'
  })
}

exports.sendEventNotificationToCloseByVolunteers = sendEventNotificationToCloseByVolunteers

let formatNotification = async (eventData, admin) => {
  const categories = await CategoriesDisplay(admin)

  const category = categories.find(
    category => category.id === eventData.details.category
  ) || { displayName: 'לא ידוע' }

  return ` ${category.displayName} ב${eventData.details.address} . סוג רכב ${
    eventData.details['car type']
  } לחץ לפרטים`
}

// let haveToSendNotification = (eventData, previousValue) => {
//   return (
//     eventData.status === 'sent' &&
//     (previousValue === null || previousValue.status !== 'sent')
//   )
// }
