let GeoFire = require('geofire')

exports.getLastLocation = (collectionName, admin, key) => {
  let geoFire = new GeoFire(admin.database().ref(collectionName))

  return geoFire
    .get(key)
    .then(location => {
      console.log('retrieved geo for ' + collectionName + '/' + key, location)
      return location
    })
    .catch(error => {
      console.log(error)
    })
}

exports.saveLocation = (collectionName, admin, key, location) => {
  let geoFire = new GeoFire(admin.database().ref(collectionName))
  if (!location[0] || !location[1]) {
    return
  }

  return geoFire
    .set(key, location)
    .then(() => {
      console.log('added geo index for ' + collectionName + '/' + key)
    })
    .catch(error => {
      console.log(error)
    })
}

exports.removeLocation = (collectionName, admin, key) => {
  let geoFire = new GeoFire(admin.database().ref(collectionName))
  return geoFire
    .remove(key)
    .then(() => {
      console.log('removed geo index for ' + collectionName + '/' + key)
    })
    .catch(error => {
      console.log(error)
    })
}
