import { types, getParent, flow, getSnapshot } from 'mobx-state-tree'
import * as api from 'io/api'
import { trackUserLogin, trackEvent } from 'io/analytics'
import { acknowledgeTestNotification } from 'io/notifications'
import Sentry from 'sentry-expo'

const Location = types.model('Location', {
  id: types.identifier(types.string),
  name: types.string,
  lat: types.number,
  lon: types.number
})

const CurrentUser = types
  .model('CurrentUser', {
    id: types.identifier(),
    name: types.string,
    phone: types.string,
    muted: types.maybe(types.Date),
    acceptedEventId: types.maybe(types.string),
    role: types.optional(
      types.enumeration('Role', ['volunteer', 'dispatcher', 'admin']),
      'volunteer'
    ),
    trackAnalytics: types.optional(types.boolean, false),
    locations: types.optional(types.array(Location), []),
    radius: types.maybe(types.number),
    lastSeen: types.maybe(types.Date)
  })
  .views(self => ({
    get isMuted() {
      // is muted if muted exists and is less then 24 hours from now
      return !!(
        self.muted &&
        self.muted.getTime() > new Date().getTime() - 24 * 3600 * 1000
      )
    },
    get hasEventAssigned() {
      return !!self.acceptedEventId
    },
    get isAdmin() {
      // Disable admin features for the time being
      return false // self.role === 'admin'
    }
  }))
  .actions(self => ({
    updateUserLastSeen: flow(function* updateUserLastSeen() {
      const newLastSeen = new Date().getTime()
      trackEvent('UpdateUserLastSeen', { lastSeen: newLastSeen })

      yield api.updateUser(self.id, {
        LastSeen: newLastSeen
      })
    }),
    toggleMute: flow(function* toggleMute() {
      // if it is muted, then unmuted (remove field) or set new timestamp for now
      const newMute = self.isMuted ? null : new Date().getTime()

      trackEvent('ToggleMute', { mute: !!newMute })

      yield api.updateUser(self.id, {
        Muted: newMute
      })
    }),
    acknowledgeTestNotification: () => {
      acknowledgeTestNotification(self.id)
    },
    setRadius: flow(function* setRadius(radius) {
      if (!radius) {
        return
      }
      self.radius = radius

      trackEvent('SetRadius', { radius: radius })

      yield api.updateUser(self.id, {
        Radius: self.radius
      })
    }),
    addLocation: flow(function* addLocation(addedLocation) {
      // Check if location is valid and is not in the list yet
      if (
        !addedLocation ||
        !addedLocation.id ||
        self.locations.find(location => location.id === addedLocation.id)
      ) {
        return
      }

      // Optimistic push location to user
      self.locations.push(addedLocation)

      trackEvent('AddLocation', { location: addedLocation })

      yield api.updateUser(self.id, {
        Locations: getSnapshot(self.locations)
      })
    }),
    removeLocation: flow(function* addLocation(removedLocation) {
      // Check if location is valid and is in the list already
      if (
        !removedLocation ||
        !removedLocation.id ||
        !self.locations.find(location => location.id === removedLocation.id)
      ) {
        return
      }

      // Optimistic push location to user
      self.locations = self.locations.filter(
        location => location.id !== removedLocation.id
      )

      trackEvent('RemoveLocation', { location: removedLocation })

      yield api.updateUser(self.id, {
        Locations: getSnapshot(self.locations)
      })
    })
  }))

const AuthenticationStore = types
  .model('AuthenticationStore', {
    isInitializing: true,
    isOffline: false,
    isLoading: false,
    currentUser: types.maybe(CurrentUser),
    error: types.maybe(types.string)
  })
  .views(self => ({
    get root() {
      return getParent(self)
    },
    get isAuthenticated() {
      return !!self.currentUser
    }
  }))
  .actions(self => {
    function onUserChanged(userInfo) {
      if (!userInfo) {
        // Not authenticated
        Sentry.setUserContext()
        self.currentUser = null
      } else {
        // Check if user has changed
        // This method called any time the user has a property changed, but
        // we want to track when user has logged in (when app starts or logging is done)
        const userHasChanged =
          !self.currentUser || self.currentUser.id !== userInfo.id

        Sentry.setUserContext(userInfo)
        self.currentUser = userInfo

        if (userHasChanged) {
          // User logged in has changed, update
          self.currentUser.updateUserLastSeen()
        }
      }

      trackUserLogin(self.currentUser && self.currentUser.id)

      self.isOffline = false
      self.isInitializing = false
    }

    function onError(error) {
      console.log('onError', error) // TODO Throw ?
      self.error = error
      self.isOffline = false
      self.isInitializing = false
    }

    function onOffline() {
      // If still initialiazing, then we are offline
      if (self.isInitializing) {
        // Unblock app
        self.isInitializing = false
        self.isOffline = true
      }
    }

    function afterCreate() {
      self.unwatchAuth = api.onAuthenticationChanged(
        self.onUserChanged,
        self.onError
      )

      // Wait to check offline in 15s
      setTimeout(self.onOffline, 15000)
    }

    function beforeDestroy() {
      self.unwatchAuth()
    }

    const signInWithPhone = flow(function* signInWithPhone({
      verificationId,
      code
    }) {
      trackEvent('PhoneSignIn')
      self.isLoading = true
      self.error = null

      try {
        yield api.signInWithPhone({
          verificationId,
          code
        })
        self.isLoading = false
        trackEvent('PhoneSignInSuccess')
      } catch (error) {
        self.error = error
        self.isLoading = false
        trackEvent('PhoneSignInError', { error })
      }
    })

    const signInWithEmailPass = flow(function* signInWithEmailPass({
      phoneNumber,
      id
    }) {
      trackEvent('EmailPassSignIn')
      self.isLoading = true
      self.error = null

      try {
        yield api.signInWithEmailPass({
          phoneNumber,
          id
        })
        self.isLoading = false
        trackEvent('EmailPassSignInSuccess')
      } catch (error) {
        self.error = error
        self.isLoading = false
        trackEvent('EmailPassSignInError', { error })
      }
    })

    const signOut = flow(function* signOut() {
      trackEvent('SignOut')
      self.isLoading = true
      self.error = null

      try {
        self.root.eventStore.removeAllEvents()
        yield api.signOut()
        self.isLoading = false
        trackEvent('SignOutSuccess')
      } catch (error) {
        Sentry.captureException(error)
        trackEvent('SignOutError', { error })
        self.error = error
        self.isLoading = false
      }
    })

    return {
      afterCreate,
      beforeDestroy,
      signInWithEmailPass,
      signInWithPhone,
      signOut,
      onUserChanged,
      onError,
      onOffline
    }
  })

export default AuthenticationStore
