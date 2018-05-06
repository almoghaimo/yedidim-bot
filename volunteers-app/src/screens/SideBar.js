import React from 'react'
import { Constants } from 'expo'
import {
  Container,
  List,
  ListItem,
  Content,
  Icon,
  Body,
  Left,
  Separator
} from 'native-base'
import { Image, Alert } from 'react-native'
import { inject, observer } from 'mobx-react/native'
import { FormattedMessage } from 'react-intl'
import { NavigationActions } from 'react-navigation'
import { sendTestNotification } from 'io/notifications'
import Logo from './logo.png'
import AlignedText from '../components/AlignedText'

const SideBar = ({
  signOut,
  currentUser: { id, name, phone, role },
  nextLanguage,
  toggleLanguage,
  navigation
}) => (
  <Container>
    <Content>
      <Image
        source={Logo}
        style={{
          height: 200,
          width: 260,
          marginTop: 40,
          marginLeft: 20,
          marginRight: 20,
          justifyContent: 'center',
          alignItems: 'center'
        }}
        resizeMode="contain"
      />
      <List style={{ marginTop: 20 }}>
        <ListItem>
          <AlignedText>
            {name} {phone && `(${phone})`}
          </AlignedText>
        </ListItem>
        <ListItem>
          <AlignedText>v{Constants.manifest.version}</AlignedText>
        </ListItem>
        <ListItem
          button
          onPress={async () => {
            await toggleLanguage()
          }}
        >
          <AlignedText>{nextLanguage}</AlignedText>
        </ListItem>
        <ListItem
          button
          onPress={async () => {
            try {
              await sendTestNotification(id, role)
              Alert.alert(
                'התראה נשלחה',
                'הבדיקה תצליח אם תקבל התראה בדיקה בשניות הקרובות',
                [{ text: 'בסדר', onPress: () => {} }],
                { cancelable: false }
              )
            } catch (error) {
              Alert.alert(
                'שגיעה',
                'אירע שגיעה, לא הצלחנו לשלוח את הבדיקה התראות אליך. נסה שוב מאוחר יותר.',
                [{ text: 'בסדר', onPress: () => {} }],
                { cancelable: false }
              )
            }
          }}
        >
          <AlignedText>בדוק התראות</AlignedText>
        </ListItem>
        <ListItem button onPress={signOut}>
          <FormattedMessage
            id="Authentication.signout"
            defaultMessage="Sign out"
          >
            {txt => <AlignedText>{txt}</AlignedText>}
          </FormattedMessage>
        </ListItem>
        <ListItem
          button
          onPress={() => {
            navigation.dispatch(
              NavigationActions.navigate({
                routeName: 'AboutStartach'
              })
            )
          }}
        >
          <FormattedMessage
            id="Sidebar.aboutStartach"
            defaultMessage="About Startach"
          >
            {txt => <AlignedText>{txt}</AlignedText>}
          </FormattedMessage>
        </ListItem>
        {role === 'admin' && (
          <React.Fragment>
            <Separator bordered>
              <FormattedMessage
                id="Sidebar.admin"
                defaultMessage="Administrators"
              >
                {txt => <AlignedText>{txt}</AlignedText>}
              </FormattedMessage>
            </Separator>
            <ListItem
              button
              icon
              onPress={() => {
                navigation.dispatch(
                  NavigationActions.navigate({
                    routeName: 'NotificationReport'
                  })
                )
              }}
            >
              <Left>
                <Icon name="ios-notifications" />
              </Left>
              <Body>
                <FormattedMessage
                  id="Sidebar.admin.notificationTest"
                  defaultMessage="Notification Test"
                >
                  {txt => <AlignedText>{txt}</AlignedText>}
                </FormattedMessage>
              </Body>
            </ListItem>
          </React.Fragment>
        )}
      </List>
    </Content>
  </Container>
)

export default inject(({ stores }) => ({
  signOut: stores.authStore.signOut,
  currentUser: stores.authStore.currentUser,
  nextLanguage: stores.nextLanguage,
  toggleLanguage: stores.toggleLanguage
}))(observer(SideBar))
