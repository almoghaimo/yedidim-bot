import React from 'react'
import dateFormat from 'dateformat'
import { StyleSheet } from 'react-native'
import { Text, Row, View } from 'native-base'

const TimelineItem = ({ createdAt, action, who, last }) => (
  <Row style={styles.row}>
    <Text style={styles.timestamp}>
      {dateFormat(new Date(createdAt), 'dd/mm HH:MM:ss')}
    </Text>
    <View style={styles.bubble} />
    {!last && <View style={styles.line} />}
    <Text style={styles.text}>{action + ' ע"י ' + who}</Text>
  </Row>
)
export default TimelineItem

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse'
  },
  text: {
    marginRight: 10,
    flex: 1,
    flexWrap: 'wrap'
  },
  timestamp: {
    color: 'gray',
    marginLeft: 15,
    textAlign: 'left'
  },
  bubble: {
    borderRadius: 10 / 2,
    backgroundColor: '#ab4584',
    height: 10,
    width: 10,
    marginTop: 7
  },
  line: {
    height: 35,
    width: 1,
    backgroundColor: '#ab4584',
    position: 'relative',
    right: 5.5,
    top: 10
  }
})
