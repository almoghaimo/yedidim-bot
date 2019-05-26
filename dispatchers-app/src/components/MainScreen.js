import React, { Component } from 'react'
import {
  I18nManager,
  Platform,
  RefreshControl,
  BackHandler
} from 'react-native'
import {
  Container,
  Header,
  Left,
  Body,
  Right,
  Title,
  Content,
  Button,
  Text,
  Footer,
  FooterTab,
  Icon
} from 'native-base'
import EventsMain from '../components/EventsMain'
import EventDetailsMain from '../components/EventDetailsMain'
import EventDetailsEditor from '../components/EventDetailsEditor'
import EventsSearch from '../components/EventsSearch'
import ProfileScreen from '../components/ProfileScreen'
import { ScreenType } from '../constants/consts'

export const Screens = {
  [ScreenType.EventsList]: { screen: EventsMain, title: 'אירועים' },
  [ScreenType.EventDetails]: {
    screen: EventDetailsMain,
    title: 'פרטי אירוע',
    backScreen: ScreenType.EventsList
  },
  [ScreenType.EventCreate]: {
    screen: EventDetailsEditor,
    title: 'פרטי אירוע',
    backScreen: ScreenType.EventsList
  },
  [ScreenType.EventDetailsEditor]: {
    screen: EventDetailsEditor,
    title: 'פרטי אירוע',
    backScreen: ScreenType.EventDetails
  },
  [ScreenType.EventsSearch]: { screen: EventsSearch, title: 'חיפוש' },
  [ScreenType.ProfileScreen]: { screen: ProfileScreen, title: 'משתמש' }
}

class MainScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeScreen: ScreenType.EventsList,
      mainScreen: ScreenType.EventsList,
      refreshing: false
    }
    this.navigate = this.navigate.bind(this)
    this.back = this.back.bind(this)
    this.registerForRefresh = this.registerForRefresh.bind(this)
    this.onRefresh = this.onRefresh.bind(this)
    this.handleHardwareBack = this.handleHardwareBack.bind(this)
  }

  componentWillMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleHardwareBack)
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleHardwareBack
    )
  }

  handleHardwareBack() {
    if (Screens[this.state.activeScreen].backScreen) {
      this.back()
      return true
    }
    return false
  }

  registerForRefresh(handleRefresh) {
    this.handleRefresh = handleRefresh
  }

  onRefresh() {
    if (this.handleRefresh) {
      this.setState({ refreshing: true })
      this.handleRefresh(() => {
        this.setState({ refreshing: false })
      })
    }
  }

  setActiveScreen(screen) {
    this.setState({ activeScreen: screen, mainScreen: screen })
  }

  navigate(screen, params) {
    this.setState({ activeScreen: screen, params })
  }

  back() {
    const backScreen = Screens[this.state.activeScreen].backScreen
    this.navigate(backScreen, { ...this.state.params })
  }

  render() {
    const activeScreen = Screens[this.state.activeScreen]
    const Component = activeScreen.screen
    return (
      <Container>
        <Header>
          <Left>
            {activeScreen.backScreen ? (
              <Button transparent onPress={this.back}>
                <Icon
                  type="Ionicons"
                  name={
                    I18nManager.isRTL ? 'ios-arrow-forward' : 'ios-arrow-back'
                  }
                />
              </Button>
            ) : (
              undefined
            )}
          </Left>
          <Body>
            <Text
              style={{
                color: Platform.OS === 'android' ? 'white' : 'black',
                alignSelf: 'center'
              }}
            >
              {activeScreen.title}
            </Text>
          </Body>
          <Right />
        </Header>
        <Content
          refreshControl={
            this.state.activeScreen === ScreenType.EventsList ? (
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this.onRefresh}
              />
            ) : (
              undefined
            )
          }
        >
          <Component
            navigate={this.navigate}
            params={this.state.params}
            ref={ref => (this.component = ref)}
            registerForRefresh={this.registerForRefresh}
          />
        </Content>
        <Footer>
          <FooterTab>
            <Button
              active={
                this.state.activeScreen !== ScreenType.ProfileScreen &&
                this.state.activeScreen !== ScreenType.EventsSearch
              }
              onPress={this.setActiveScreen.bind(this, ScreenType.EventsList)}
            >
              <Text>אירועים</Text>
            </Button>
            <Button
              active={this.state.activeScreen === ScreenType.EventsSearch}
              onPress={this.setActiveScreen.bind(this, ScreenType.EventsSearch)}
            >
              <Text>חיפוש</Text>
            </Button>
            <Button
              active={this.state.activeScreen === ScreenType.ProfileScreen}
              onPress={this.setActiveScreen.bind(
                this,
                ScreenType.ProfileScreen
              )}
            >
              <Text>משתמש</Text>
            </Button>
          </FooterTab>
        </Footer>
      </Container>
    )
  }
}

export default MainScreen
