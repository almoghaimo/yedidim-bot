import React, { Component } from 'react'
import appStyles from '../global-styles'
import styled from 'styled-components/native'
import { inject, observer } from 'mobx-react/native'
import { FormattedMessage, FormattedRelative } from 'react-intl'
import {
  Image,
  Linking,
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native'
import {
  Button,
  Container,
  Body,
  Content,
  Header,
  Title,
  Left,
  Icon,
  Right,
  Text,
  List,
  ListItem,
  Thumbnail,
  Grid,
  Row
} from 'native-base'
import debounce from 'lodash.debounce'
import format from 'date-fns/format'
import { trackEvent } from 'io/analytics'

import AlignedText from 'components/AlignedText'
import NotificationBadge from 'components/NotificationBadge'

import Sentry from 'sentry-expo'

import { REFRESH_TIMEOUT } from 'config'

const MessageView = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 15px 5px;
`

const BarItem = styled.Text`
  width: 25%;
  text-align: center;
  font-family: 'Alef';
`

const StatusBar = styled.View`
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: baseline;
  padding: 5px 15px;
  border-bottom-width: 1px;
  border-bottom-color: #d3d3d3;
`

const styles = StyleSheet.create({
  btn: {
    borderRadius: 10,
    marginHorizontal: 15,
    flex: 1,
    paddingHorizontal: 20,
    height: 35
  },
  guideButton: {
    backgroundColor: 'orange'
  },
  footer: {
    marginBottom: 20,
    marginTop: 10,
    width: '100%',
    flex: 1,
    justifyContent: 'space-between'
  }
})

// TODO Move saveNotificationToken to be executed after signin, if error exists then show button on home asking user to notification access (trigger again)
// TODO Don't use once to listen to user changes, that way we can have a computed property to enable notifications (Notification Store - will be used for muted)
// TODO Remove token after user logout
// TODO On notification, save the event data to event store and sync with firebase?

const distanceToString = distance => {
  if (distance < 1) {
    return (
      <FormattedMessage
        id="Home.event.distance.ms"
        defaultMessage="{formattedDistance} m"
        values={{ formattedDistance: (distance * 1000).toFixed(0).toString() }}
      >
        {txt => <AlignedText note>{txt}</AlignedText>}
      </FormattedMessage>
    )
  }
  return (
    <FormattedMessage
      id="Home.event.distance.kms"
      defaultMessage="{formattedDistance} km"
      values={{ formattedDistance: distance.toFixed(2).toString() }}
    >
      {txt => <AlignedText note>{txt}</AlignedText>}
    </FormattedMessage>
  )
}

const EventItem = observer(
  ({
    onPress,
    isAdmin,
    event: {
      id,
      carType,
      categoryName,
      categoryImg,
      displayAddress,
      more,
      timestamp,
      isLackingCriticalInfo,
      isTaken,
      isCompleted,
      distance,
      sentNotification,
      receivedNotification,
      errorNotification,
      assignedTo
    }
  }) =>
    isLackingCriticalInfo ? (
      <ListItem avatar>
        <Left>
          <ActivityIndicator size="large" />
        </Left>
        <Body>
          <FormattedMessage
            id="Home.event.loadingTitle"
            defaultMessage="Please wait, loading event..."
          >
            {txt => <AlignedText>{txt}</AlignedText>}
          </FormattedMessage>
          <AlignedText note />
        </Body>
        <Right />
      </ListItem>
    ) : (
      <ListItem
        avatar
        onPress={() => {
          onPress(id)
        }}
        style={{
          width: '90%',
          backgroundColor: 'white',
          borderBottomWidth: 3,
          borderBottomColor: isTaken ? 'grey' : 'red',
          marginTop: 10,
          marginRight: 'auto',
          marginBottom: 0,
          marginLeft: 'auto'
        }}
      >
        <Left>
          <View
            style={{
              width: 50,
              height: 50,
              borderColor: isTaken ? 'grey' : 'red',
              borderWidth: 1,
              borderRadius: 25,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Image
              style={{ width: 30, resizeMode: 'contain' }}
              source={categoryImg}
            />
          </View>
        </Left>
        <Body>
          <AlignedText>
            <Text style={{ fontWeight: 'bold', fontFamily: 'Alef' }}>
              {' '}
              {categoryName} {'\n'}{' '}
            </Text>{' '}
            {displayAddress} {carType && `(${carType})`}
          </AlignedText>
          <AlignedText note>{more}</AlignedText>
          {isAdmin && (
            <NotificationBadge
              sent={sentNotification}
              error={errorNotification}
              received={receivedNotification}
            />
          )}
        </Body>
        <Right
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingBottom: 0,
            paddingRight: 0
          }}
        >
          <FormattedRelative value={timestamp}>
            {relative => <AlignedText note>{relative}</AlignedText>}
          </FormattedRelative>
          {distance && distanceToString(distance)}
          {isTaken && (
            <AlignedText
              note
              style={{
                padding: 3,
                marginTop: 3,
                backgroundColor: 'grey',
                color: 'white',
                fontWeight: 'bold',
                fontFamily: 'Alef'
              }}
            >
              {isCompleted ? 'נסגר' : 'נלקח'}
              {!isCompleted &&
                assignedTo &&
                assignedTo.name &&
                ` ע״י ${assignedTo.name}`}
            </AlignedText>
          )}
        </Right>
      </ListItem>
    )
)

@observer
class HomeScreen extends Component {
  static navigationOptions = ({
    navigation,
    screenProps: { toggleMute, isMuted, loadLatestOpenEvents, isLoadingEvents }
  }) => ({
    header: (
      <Header style={appStyles.navigationHeaderStyles}>
        <Left>
          <Button
            transparent
            onPress={() => {
              trackEvent('Navigation', { page: 'Sidebar' })
              navigation.navigate('DrawerOpen')
            }}
          >
            <Icon style={appStyles.headerTitle} name="menu" />
          </Button>
        </Left>
        <Body>
          <FormattedMessage id="Home.title" defaultMessage="Home">
            {txt => (
              <Title style={[appStyles.appFont, appStyles.headerTitle]}>
                {txt}
              </Title>
            )}
          </FormattedMessage>
        </Body>
        <Right>
          <Button
            disabled={isLoadingEvents}
            transparent
            onPress={loadLatestOpenEvents}
          >
            <Icon style={{ color: 'white' }} name="md-refresh" />
          </Button>
          <Button transparent onPress={toggleMute}>
            <Icon
              style={{ color: 'white' }}
              name={`ios-notifications${isMuted ? '-off' : ''}`}
            />
          </Button>
        </Right>
      </Header>
    )
  })

  componentWillMount() {
    this.handleRefresh()
  }

  handleRefresh = () => {
    return this.props.eventStore.loadLatestOpenEvents()
  }

  handleEventItemPress = debounce(
    eventId => {
      trackEvent('Navigation', { page: 'EventPage', eventId })
      this.props.navigation.navigate('Event', { eventId })
    },
    1000,
    { leading: true, trailing: false }
  )

  render() {
    const {
      eventStore: {
        hasEvents,
        sortedEventsByStatusAndTimestamp,
        lastUpdatedDate,
        isLoadingEvents,
        loadingEventsError
      },
      currentUser
    } = this.props

    return (
      <Container>
        <Content
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingEvents}
              onRefresh={this.handleRefresh}
            />
          }
        >
          {!isLoadingEvents && (
            <StatusBar
              style={{
                backgroundColor: currentUser.isMuted ? '#e75656' : '#63db63'
              }}
            >
              <BarItem>{currentUser.name}</BarItem>
              <BarItem>מחובר</BarItem>
              <BarItem>
                {currentUser.isMuted ? 'מצב מושתק' : 'מצב זמין'}
              </BarItem>
              <BarItem>{format(lastUpdatedDate, 'H:mm')}</BarItem>
            </StatusBar>
          )}
          {hasEvents && !isLoadingEvents && !loadingEventsError && (
            <Content style={{ flex: 1 }}>
              <List
                dataArray={sortedEventsByStatusAndTimestamp}
                renderRow={event => (
                  <EventItem
                    event={event}
                    onPress={this.handleEventItemPress}
                    isAdmin={currentUser.isAdmin}
                  />
                )}
              />
            </Content>
          )}
          {!hasEvents && !isLoadingEvents && !loadingEventsError && (
            <MessageView>
              <Text>לא קיימים כעת אירועים פעילים</Text>
            </MessageView>
          )}
          {loadingEventsError && (
            <MessageView>
              <Text
                style={{
                  color: '#e75656',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              >
                מצטערים, לא הצלחנו לעדכן את רשימת האירועים הפעילים בגלל בעיות
                רשת. נא לנסות שנית.
              </Text>
            </MessageView>
          )}
          {/* add button here */}
        </Content>
      </Container>
    )
  }
}

export default inject(({ stores }) => ({
  currentUser: stores.authStore.currentUser,
  eventStore: stores.eventStore
}))(HomeScreen)
