import { types, destroy, flow, getRoot } from 'mobx-state-tree'
import * as api from 'io/api'
import loadCategories from 'io/category'
import { trackEvent } from 'io/analytics'
import Event from './Event'
import Category from './Category'

export default types
  .model('EventStore', {
    events: types.map(Event),
    categories: types.array(Category),
    isLoading: false,
    lastUpdatedDate: new Date().getTime()
  })
  .views(self => ({
    findById(eventId) {
      return self.events.get(eventId)
    },
    get allEvents() {
      return self.events.values()
    },
    get hasEvents() {
      return self.events.size > 0
    },
    get sortedEventsByStatusAndTimestamp() {
      return (
        self.allEvents
          .slice()
          // .filter(event => !event.isLackingCriticalInfo)
          .sort((a, b) => {
            if (a.isTaken === b.isTaken) {
              return a.timestamp - b.timestamp
            }
            // display taken events last
            return a.isTaken ? 1 : -1
          })
      )
    }
  }))
  .actions(self => {
    function addEvent(eventJSON) {
      if (!self.events.get(eventJSON.id)) {
        self.events.put(eventJSON)
      }
      self.lastUpdatedDate = new Date().getTime()
    }

    return {
      loadLatestOpenEvents: flow(function* loadLatestOpenEvents() {
        try {
          const events = yield api.loadLatestOpenEvents(
            getRoot(self).authStore.currentUser.trackAnalytics
          )
          // TODO Receive events and only remove those that are not in list
          self.removeAllEvents(events)
          events.forEach(addEvent)
          self.lastUpdatedDate = new Date().getTime()
        } catch (error) {
          // Error, cannot retrieve latest events, clean events tracked
          self.removeAllEvents()
          // Rethrow error
          throw error
        }
      }),
      removeEvent(eventId) {
        destroy(self.events.get(eventId))
      },
      detachAllEvents: () => {
        self.events.values().forEach(event => event.detachEvent())
      },
      attachAllEvents: () => {
        self.events.values().forEach(event => event.attachEvent())
      },
      removeAllEvents: (eventsNotToRemove = []) => {
        const eventsIdNotToRemove = eventsNotToRemove.map(
          existingEvent => existingEvent.id
        )

        self.events.values().forEach(event => {
          // Remove all events apart from the assigned to the user and that not are
          // in list not to remove
          if (
            !event.isAssigned &&
            !eventsIdNotToRemove.find(id => id === event.id)
          ) {
            self.removeEvent(event.id)
          }
        })
      },
      addEventFromNotification: ({ eventId, initAsDetachedEvent, event }) => {
        addEvent({
          id: eventId,
          initAsDetachedEvent: !!initAsDetachedEvent,
          ...(event || {})
        })

        // api.acknowledgeReceivedEvent(
        //   eventId,
        //   getRoot(self).authStore.currentUser.id
        // )

        trackEvent('EventNotificationReceived', {
          eventId
        })
      },
      setLoading: isLoading => {
        self.isLoading = isLoading
      },
      setCategories: categories => {
        self.categories.replace(categories)
      },
      initAfterAuth: async () => {
        // Load categories from API
        self.setCategories(await loadCategories())
      }
    }
  })
