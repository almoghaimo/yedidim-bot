import {
  types,
  flow,
  getRoot,
  getParent,
  getSnapshot,
  isAlive
} from 'mobx-state-tree'
import GeoFire from 'geofire'
import * as api from 'io/api'
import { trackEvent } from 'io/analytics'
import { categoryImg } from 'const'
import User from 'stores/Users/User'
import locationHandler from '../../phoneInterface/locationHandler'
import Dispatcher from './Dispatcher'

const calculateDistanceFromEvent = async event => {
  try {
    return GeoFire.distance(await locationHandler.getLocationIfPermitted(), [
      event.lat,
      event.lon
    ])
  } catch (error) {
    return null
  }
}

export default types
  .model('Event', {
    id: types.identifier(),
    address: types.maybe(types.string),
    caller: types.maybe(types.string),
    carType: types.maybe(types.string),
    category: types.maybe(types.string),
    subCategory: types.maybe(types.string),
    city: types.maybe(types.string),
    lat: types.maybe(types.number),
    lon: types.maybe(types.number),
    more: types.maybe(types.string),
    phone: types.maybe(types.string),
    privateInfo: types.maybe(types.string),
    status: types.maybe(types.string),
    assignedTo: types.maybe(User),
    timestamp: types.maybe(types.Date),
    distance: types.maybe(types.number),
    dispatcher: types.maybe(Dispatcher),
    sentNotification: types.optional(types.array(types.string), []),
    errorNotification: types.optional(types.array(types.string), []),
    receivedNotification: types.optional(types.array(types.string), []),
    initAsDetachedEvent: false
  })
  .views(self => ({
    get store() {
      return getParent(self, 2)
    },
    get isReadyForAssignment() {
      return self.status === 'sent' || self.status === 'submitted'
    },
    get isAssigned() {
      return (
        self.status === 'assigned' &&
        self.id === getRoot(self).authStore.currentUser.acceptedEventId
      )
    },
    get isTaken() {
      return (
        (self.status === 'assigned' &&
          self.assignedTo &&
          self.assignedTo.id !== getRoot(self).authStore.currentUser.id) ||
        self.status === 'completed'
      )
    },
    get isCompleted() {
      return self.status === 'completed'
    },
    get displayAddress() {
      return self.address && self.address.replace(/, ישראל$/, '')
    },
    get categoryName() {
      const category = getRoot(self).eventStore.categories.find(
        entry => entry.id === self.category
      )

      if (category) {
        const subCategory = category.subCategories.find(
          entry => entry.id === self.subCategory
        )

        return subCategory
          ? `${category.displayName}/${subCategory.displayName}`
          : category.displayName
      }

      return 'אחר'
    },
    get categoryImg() {
      return categoryImg(self.category)
    },
    get isLackingCriticalInfo() {
      return !self.address || !self.category
    }
  }))
  .actions(self => ({
    onEventUpdated: flow(function* onEventUpdated(eventData) {
      // If Mobx object not alive anymore, don't do any change
      if (!isAlive(self)) {
        return
      }

      if (
        !eventData ||
        !eventData.id ||
        (eventData.status === 'completed' && !self.isAssigned)
      ) {
        // Event was completed now or some time ago, mark as completed
        self.status = 'completed'
        // setTimeout(() => self.remove(), 15000)
        return
      }

      eventData.distance =
        eventData.distance ||
        self.distance ||
        (yield calculateDistanceFromEvent(eventData))
      Object.assign(self, { ...getSnapshot(self), ...eventData })

      const shouldFetchDispatcher =
        !self.dispatcher && eventData.dispatcherId && self.isAssigned
      if (shouldFetchDispatcher) {
        self.dispatcher = yield api.fetchDispatcher(eventData.dispatcherId)
      }

      if (self.isCompleted) {
        // Event is now completed, detach from updates to save memory
        self.detachEvent()
      }
    }),
    afterCreate: () => {
      if (!self.initAsDetachedEvent) {
        self.attachEvent()
      }
    },
    beforeDestroy: () => {
      self.detachEvent()
    },
    attachEvent: () => {
      if (!self.unsubscribeId) {
        self.unsubscribeId = api.subscribeToEvent(self.id, self.onEventUpdated)
      }
    },
    detachEvent: () => {
      if (self.unsubscribeId) {
        api.unsubscribeToEvent(self.id, self.unsubscribeId)
        delete self.unsubscribeId
      }
    },
    remove: () => {
      trackEvent('IgnoreEvent', {
        eventId: self.id
      })
      self.store.removeEvent(self.id)
    },
    execute: flow(function* execute(actionType) {
      if (
        !['finalise', 'accept', 'unaccept'].find(
          action => action === actionType
        )
      ) {
        throw new Error(`Invalid event action type ${actionType}`)
      }

      // Retrieve current logged user id
      self.store.setLoading(true)
      try {
        yield api[`${actionType}Event`](
          self.id,
          getRoot(self).authStore.currentUser
        )

        trackEvent(`${actionType}Event`, {
          eventId: self.id
        })
      } finally {
        self.store.setLoading(false)
      }
    })
  }))
