export const InstanceTypes = {
  Sandbox: 'sandbox',
  Sandbox2: 'sandbox2',
  Production: 'production'
}
export const EventStatus = {
  Draft: 'draft',
  Submitted: 'submitted',
  Sent: 'sent',
  Assigned: 'assigned',
  Completed: 'completed',
  Archived: 'archived'
}
export const EventSource = { FB_BOT: 'fb-bot', App: 'app' }

export const ScreenType = {
  EventsList: 'EventsList',
  EventDetails: 'EventDetails',
  EventDetailsEditor: 'EventDetailsEditor',
  EventsSearch: 'EventsSearch',
  EventTimeline:'EventTimeline',
  EventCreate:'EventCreate',
  ProfileScreen: 'ProfileScreen'
}

export const LOG_EVENTS = {
  EVENT_CREATED: 'event created',
  EVENT_EDITED: 'event edited',
  NOTIFICATION_RECEIVED: 'notification received',
  LOGIN_SUCCESS: 'logged in',
  LOGIN_FAIL: 'login failed',
  TOKEN_STORE_SUCCESS: 'token stored in db',
  TOKEN_STORE_FAIL: 'token failed to store in db',
  EVENT_CHANGED: 'event changed',
  LOCATION_UPDATED: 'location updated'
}
