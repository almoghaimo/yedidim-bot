import React, { Component } from 'react'
import styled from 'styled-components/native'
import { FormattedMessage, FormattedRelative } from 'react-intl'
import { I18nManager } from 'react-native'
import { trackEvent } from 'io/analytics'

import {
  Button,
  Body,
  Header,
  Title,
  Left,
  Icon,
  Right,
  Container,
  Content,
  Text,
  Grid,
  Col,
  Row,
  List,
  ListItem,
  Separator,
  ActionSheet
} from 'native-base'

import { inject, observer } from 'mobx-react/native'
import { sendTestNotification } from 'io/notificationsTester'

// import AlignedText from 'components/AlignedText'

const MarginView = styled.View`
  margin: 10px 10px 0;
`

const ListMargin = styled(List)`
  margin: 10px 0;
`

const UserEntry = ({ name }) => (
  <ListItem
    icon
    onPress={() =>
      ActionSheet.show(
        {
          options: ['Call', 'Resend Notification', 'Cancel'],
          cancelButtonIndex: 2,
          title: name
        },
        buttonIndex => {
          console.log(['Call', 'Resend Notification', 'Cancel'][buttonIndex])
        }
      )}
  >
    <Body>
      <Text>{name}</Text>
    </Body>
    <Right>
      <FormattedMessage
        id="NotificationReport.status.sent"
        defaultMessage="Waiting"
      >
        {txt => (
          <FormattedRelative value={new Date().getTime() - 232223222}>
            {relative => (
              <Text note style={{ color: 'orange' }}>
                {txt} ({relative})
              </Text>
            )}
          </FormattedRelative>
        )}
      </FormattedMessage>
      <Icon name="ios-time" style={{ color: 'orange' }} />
    </Right>
  </ListItem>
)

@observer
class NotificationTest extends Component {
  static navigationOptions = ({ navigation }) => ({
    header: (
      <Header>
        <Left>
          <Button
            transparent
            onPress={() => {
              trackEvent('Navigation', { page: 'BackFromHelpPage' })
              navigation.goBack()
            }}
          >
            <Icon name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} />
          </Button>
        </Left>
        <Body>
          <FormattedMessage
            id="NotificationReport.title"
            defaultMessage="Notifications"
          >
            {txt => <Title>{txt}</Title>}
          </FormattedMessage>
        </Body>
        <Right />
      </Header>
    )
  })

  render() {
    const userId = this.props.currentUser.id
    const { volunteers, dispatchers, admins } = this.props

    return (
      <Container>
        <Content style={{ flex: 1, backgroundColor: '#fff' }}>
          <Grid>
            <Row>
              <Col>
                <MarginView>
                  <Button
                    full
                    block
                    onPress={() => sendTestNotification(userId)}
                  >
                    <FormattedMessage
                      id="NotificationReport.button.text"
                      defaultMessage="Reset & Send test notifications to all"
                    >
                      {txt => <Text>{txt}</Text>}
                    </FormattedMessage>
                  </Button>
                </MarginView>
                {/* <MarginView>
                  <FormattedMessage
                    id="NotificationReport.text"
                    defaultMessage="Last test done at:"
                  >
                    {txt => (
                      <FormattedRelative value={new Date().getTime()}>
                        {relative => (
                          <AlignedText>
                            {txt} {relative}
                          </AlignedText>
                        )}
                      </FormattedRelative>
                    )}
                  </FormattedMessage>
                </MarginView> */}
              </Col>
            </Row>
            <Row>
              <Col>
                <ListMargin>
                  <Separator bordered>
                    <FormattedMessage
                      id="NotificationReport.volunteers"
                      defaultMessage="Volunteers"
                    >
                      {txt => <Text>{txt}</Text>}
                    </FormattedMessage>
                  </Separator>
                  {volunteers.map(volunteer => (
                    <UserEntry key={volunteer.id} {...volunteer} />
                  ))}
                  <Separator bordered>
                    <FormattedMessage
                      id="NotificationReport.dispatchers"
                      defaultMessage="Dispatchers"
                    >
                      {txt => <Text>{txt}</Text>}
                    </FormattedMessage>
                  </Separator>
                  {dispatchers.map(dispatcher => (
                    <UserEntry key={dispatcher.id} {...dispatcher} />
                  ))}
                  <Separator bordered>
                    <FormattedMessage
                      id="NotificationReport.admins"
                      defaultMessage="Administrators"
                    >
                      {txt => <Text>{txt}</Text>}
                    </FormattedMessage>
                  </Separator>
                  {admins.map(admin => <UserEntry key={admin.id} {...admin} />)}
                </ListMargin>
              </Col>
            </Row>
          </Grid>
        </Content>
      </Container>
    )
  }
}

export default inject(({ stores }) => ({
  currentUser: stores.authStore.currentUser,
  admins: stores.userStore.admins,
  dispatchers: stores.userStore.dispatchers,
  volunteers: stores.userStore.volunteers
}))(NotificationTest)
