import firebase from 'firebase'

const volunteerSnapshotToUserJSON = snapshot => ({
  name: `${snapshot.FirstName} ${snapshot.LastName}`,
  phone: snapshot.MobilePhone,
  role: snapshot.Role ? snapshot.Role : 'volunteer',
  notificationStatus: snapshot.NotificationTest
    ? snapshot.NotificationTest.Status
    : 'pending',
  notificationTimestamp: snapshot.NotificationTest
    ? snapshot.NotificationTest.Status
    : null
})

const dispatcherSnapshotToUserJSON = snapshot => ({
  name: snapshot.name,
  phone: snapshot.phone,
  role: snapshot.role ? snapshot.role : 'dispatcher',
  notificationStatus: snapshot.NotificationTest
    ? snapshot.NotificationTest.Status
    : 'pending',
  notificationTimestamp: snapshot.NotificationTest
    ? snapshot.NotificationTest.Status
    : null
})

function onUsersChange(onChangeCallback) {
  // Get reference
  const volunteersRef = firebase.database().ref(`volunteer`)
  const dispatchersRef = firebase.database().ref(`dispatchers`)

  const callback = (event, conversionFunc) => snapshot => {
    onChangeCallback({
      event,
      data: {
        id: snapshot.key,
        ...conversionFunc(snapshot.val())
      }
    })
  }

  // Attach events
  ;['child_added', 'child_changed', 'child_removed'].forEach(event => {
    volunteersRef.on(event, callback(event, volunteerSnapshotToUserJSON))
    dispatchersRef.on(event, callback(event, dispatcherSnapshotToUserJSON))
  })

  // Return unsubscribe method
  return () => {
    volunteersRef.off()
    dispatchersRef.off()
  }
}

export default onUsersChange
