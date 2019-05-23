const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

const webhook = require('./handlers/webHookHandler')
const manage = require('./handlers/manageHandler')
const manageDB = require('./handlers/manageDBHandler')
const sendExpoFollowerNotification = require('./handlers/notificationsHandler')
const locationHandler = require('./handlers/locationHandler')
const testNotificationHandler = require('./handlers/testNotificationHandler')
const eventUpdatesHandlers = require('./handlers/eventUpdatesHandlers')
const events = require('./handlers/events')
const { tokens } = require('./config')

//Main http function to handle all webhook calls
exports.webhook = functions.https.onRequest((req, res) => {
  return webhook.handleHttp(req, res, admin, tokens)
})

//function for managing the bot
exports.manage = functions.https.onRequest((req, res) => {
  return manage.handleHttp(req, res, tokens)
})

exports.onEventCreated = functions.database
  .ref('/events/{eventId}')
  .onCreate((snapshot, context) => {
    return eventUpdatesHandlers.onEventCreated(snapshot, context, admin)
  })

exports.onStatusUpdated = functions.database
  .ref('/events/{eventId}/status')
  .onWrite((event, context) => {
    return eventUpdatesHandlers.onEventStatusUpdate(event, context, admin)
  })

exports.onVolunteersLocationsUpdated = functions.database
  .ref('/volunteer/{volunteerId}/Locations')
  .onWrite((event, context) => {
    return eventUpdatesHandlers.onVolunteersLocationsUpdated(
      event,
      context,
      admin
    )
  })

exports.onIsOpenUpdated = functions.database
  .ref('/events/{eventId}/isOpen')
  .onWrite((event, context) => {
    return eventUpdatesHandlers.onEventIsOpenUpdate(event, context, admin)
  })

exports.onEventDeleted = functions.database
  .ref('/events/{eventId}')
  .onDelete((snapshot, context) => {
    return eventUpdatesHandlers.onEventDeleted(snapshot, context, admin)
  })

// cURL example:
// curl -X POST -d "eventId=-Lb2oSM3yown-mjgbAzN&searchRadius=5" "http://localhost:5001/yedidim-sandbox-2/us-central1/sendNotificationBySearchRadius"
exports.sendNotificationBySearchRadius = functions.https.onRequest(
  (req, res) => {
    return sendExpoFollowerNotification.sendNotificationBySearchRadius(
      req,
      res,
      admin
    )
  }
)

exports.sendNotificationToRecipient = functions.https.onRequest((req, res) => {
  return sendExpoFollowerNotification.sendNotificationToRecipient(
    req,
    res,
    admin
  )
})

exports.sendDispatcherTestNotification = functions.https.onRequest(
  (req, res) => {
    return sendExpoFollowerNotification.sendDispatcherTestNotification(
      req,
      res,
      admin
    )
  }
)

exports.sendVolunteerTestNotification = functions.https.onRequest(
  (req, res) => {
    return sendExpoFollowerNotification.sendVolunteerTestNotification(
      req,
      res,
      admin
    )
  }
)

exports.sendTestNotification = functions.https.onRequest((req, res) => {
  return testNotificationHandler.sendTestNotification(req, res, admin)
})

exports.saveUserLocation = functions.https.onRequest((req, res) => {
  return locationHandler.saveUserLocation(req, res, admin)
})

exports.manageDB = functions.https.onRequest((req, res) => {
  return manageDB.handleHttp(req, res, admin)
})

exports.loadLatestOpenEvents = functions.https.onRequest((req, res) => {
  return events.loadLatestOpenEvents(req, res, admin)
})
