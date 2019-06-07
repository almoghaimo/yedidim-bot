import React from 'react'
import styled from 'styled-components/native'
import { observer } from 'mobx-react/native'
import { FormattedMessage, FormattedRelative } from 'react-intl'
import { Image, Linking, StyleSheet, View, ScrollView } from 'react-native'

import {
  Button,
  Container,
  Content,
  Icon,
  Grid,
  Col,
  Row,
  Text,
  Thumbnail
} from 'native-base'
import { MapView } from 'expo'

import NotificationBadge from 'components/NotificationBadge'
import TextFieldRow from './TextFieldRow'
import AlignedText from './AlignedText'

const styles = StyleSheet.create({
  textBold: {
    fontFamily: 'AlefBold',
    marginBottom: 5
  },
  detailsSection: {
    flex: 1,
    flexDirection: 'column',
    width: '100%'
  },
  EventDetailsContainer: {
    marginBottom: 20,
    paddingLeft: 25,
    paddingTop: 15,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  noteWithUpperBorder: {
    borderTopColor: 'gray',
    borderTopWidth: 1
  },
  waze: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  imgBtn: {
    height: 40,
    width: 40,
    marginBottom: 5
  },
  linkBtn: {
    backgroundColor: 'white',
    width: 40,
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0
  }
})

const MarginView = styled.View`
  margin: 10px 0;
`

const LabelText = styled.Text`
  text-align: left;
  font-family: 'Alef';
  font-size: 16px;
`
const EventDetails = ({
  isAdmin,
  cancelHandler,
  event: {
    categoryName,
    categoryImg,
    timestamp,
    lat,
    lon,
    caller,
    more,
    displayAddress,
    phone,
    privateInfo,
    carType,
    isAssigned,
    dispatcher,
    sentNotification,
    errorNotification
    // receivedNotification,
    // assignedTo
  },
  children
}) => (
  <Container>
    <Content style={{ flex: 1, backgroundColor: '#fff' }}>
      <View>
        <Row>
          <Col size={1}>
            <MarginView>
              <Thumbnail source={categoryImg} />
            </MarginView>
          </Col>
          <Col size={3}>
            <MarginView>
              <Text
                style={{
                  textAlign: 'left',
                  borderBottomColor: 'gray',
                  borderBottomWidth: 2,
                  fontWeight: 'bold',
                  fontFamily: 'AlefBold',
                  marginTop: 10
                }}
              >
                {categoryName}
              </Text>
              <FormattedRelative value={timestamp}>
                {relative => <AlignedText note>{relative}</AlignedText>}
              </FormattedRelative>
            </MarginView>
          </Col>
        </Row>
        {isAdmin && (
          <Row>
            <Col
              style={{
                paddingBottom: 10,
                paddingLeft: 10
              }}
            >
              <NotificationBadge
                sent={sentNotification}
                received={receivedNotification}
                error={errorNotification}
                showMore
              />
            </Col>
          </Row>
        )}
        <Row>
          <Col>
            <MapView
              style={{ height: 200, flex: 1 }}
              initialRegion={{
                latitude: lat,
                longitude: lon,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421
              }}
              showsMyLocationButton
              showsUserLocation
            >
              <MapView.Marker
                coordinate={{ latitude: lat, longitude: lon }}
                title={displayAddress}
                description={more}
              />
            </MapView>
          </Col>
        </Row>
        <Row
          style={{
            flex: 1,
            width: '100%',
            marginTop: 10
          }}
        >
          <Col>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                marginLeft: 7
              }}
            >
              <View>
                <Image
                  style={styles.waze}
                  source={require('../images/waze-logo.png')}
                />
              </View>
              <View>
                <Button
                  style={{
                    height: 30,
                    borderRadius: 20,
                    backgroundColor: '#4285f4',
                    padding: 0,
                    marginLeft: 4,
                    marginTop: 3
                  }}
                  onPress={() =>
                    Linking.openURL(`https://waze.com/ul?ll=${lat},${lon}`)
                  }
                >
                  <FormattedMessage
                    id={
                      isAssigned ? 'Event.navigate' : 'Event.button.check.time'
                    }
                  >
                    {txt => (
                      <Text style={{ fontSize: 14, fontFamily: 'AlefBold' }}>
                        {txt}
                      </Text>
                    )}
                  </FormattedMessage>
                </Button>
              </View>
            </View>
          </Col>
        </Row>
        {!isAssigned && (
          <View style={styles.EventDetailsContainer}>
            <View style={styles.detailsSection}>
              <FormattedMessage id="Event.description">
                {text => <LabelText style={styles.textBold}>{text}</LabelText>}
              </FormattedMessage>
              <LabelText>{displayAddress}</LabelText>
              <LabelText>{carType}</LabelText>
              <LabelText>{more}</LabelText>
            </View>
          </View>
        )}
        {isAssigned && (
          <View style={styles.EventDetailsContainer}>
            <View style={styles.detailsSection}>
              <FormattedMessage id="Event.caller">
                {text => <LabelText style={styles.textBold}>{text}</LabelText>}
              </FormattedMessage>
              <LabelText>{displayAddress}</LabelText>
              <LabelText>{caller}</LabelText>
              <LabelText>{phone}</LabelText>
            </View>
            <View style={styles.detailsSection}>
              <FormattedMessage id="Event.description">
                {text => <LabelText style={styles.textBold}>{text}</LabelText>}
              </FormattedMessage>
              <LabelText>{carType}</LabelText>
              {!!privateInfo && <LabelText>{privateInfo}</LabelText>}
              <LabelText>{more}</LabelText>
            </View>
          </View>
        )}
        {isAssigned && (
          <View>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '80%',
                alignSelf: 'center',
                paddingBottom: 20
              }}
            >
              <Button
                style={[styles.linkBtn, styles.centerBtn]}
                onPress={cancelHandler.onPress}
              >
                <Image
                  style={styles.imgBtn}
                  source={require('../../assets/icons/cancel.png')}
                />
                <FormattedMessage id="Event.button.cancel">
                  {text => <LabelText>{text}</LabelText>}
                </FormattedMessage>
              </Button>
              <Button
                style={styles.linkBtn}
                onPress={() => Linking.openURL(`tel:${phone}`)}
              >
                <Image
                  style={styles.imgBtn}
                  source={require('../../assets/icons/icon_call.png')}
                />
                <LabelText>התקשר</LabelText>
                <LabelText>למזעיק הסיוע</LabelText>
              </Button>
            </View>
            {dispatcher && !!dispatcher.callCenterPhone && (
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '80%',
                  alignSelf: 'center',
                  paddingBottom: 20
                }}
              >
                <Button
                  style={styles.linkBtn}
                  onPress={() =>
                    Linking.openURL(`tel:${dispatcher.callCenterPhone}`)
                  }
                >
                  <Image
                    style={styles.imgBtn}
                    source={require('../../assets/icons/icon_call.png')}
                  />
                  <LabelText>התקשר למוקד</LabelText>
                </Button>
              </View>
            )}
          </View>
        )}
      </View>
    </Content>
    <View style={{ height: 70, backgroundColor: '#fff' }}>{children}</View>
  </Container>
)

export default observer(EventDetails)
