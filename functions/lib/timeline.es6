const admin = require('firebase-admin')

// action, who, oldValue, newValue, eventId
exports.addTimelineEntry = async props => {
  try {
    const { eventId, ...others } = props

    console.log('[addTimelineEntry]', eventId, others)

    if (!eventId) {
      throw 'Unable to add timeline to event without id'
    }

    await admin
      .database()
      .ref(`events/${eventId}/timeline`)
      .push({
        ...others,
        // action, who, oldValue, newValue
        createdAt: Date.now()
      })

    return true
  } catch (e) {
    console.error('[addTimelineEntry]', props, e)
    return false
  }
}

exports.addTimelineEntryFromStatus = async (
  currentStatus,
  previousStatus,
  eventData
) => {
  if (!eventData) {
    return false
  }

  const info = {
    eventId: eventData.key,
    who:
      (eventData.assignedTo
        ? eventData.assignedTo.name
        : eventData.dispatcher) || null
  }

  if (currentStatus === 'draft') {
    info.action = 'נוצר'
    info.who = 'בוט'
  }

  if (currentStatus === 'submitted') {
    info.action = 'הוקפץ למוקדנים'
    info.who = 'בוט'
  }

  if (currentStatus === 'sent') {
    info.action = 'נפתח'
    info.who = eventData.dispatcher
  }

  if (currentStatus === 'assigned') {
    // Event was assigned
    info.action = 'נלקח'
  }

  if (currentStatus === 'sent' && previousStatus === 'assigned') {
    // Event was unassigned
    info.action = 'שוחרר'
  }

  if (currentStatus === 'completed') {
    // Event was completed
    info.action = 'נסגר'
  }

  if (!info.action) {
    info.action = 'שינוי סטטוס'
    info.newValue = currentStatus
    info.oldValue = previousStatus
  }

  return exports.addTimelineEntry(info)
}
