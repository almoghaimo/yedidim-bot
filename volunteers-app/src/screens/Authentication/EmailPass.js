import React from 'react'
import {
  Button,
  Text,
  Container,
  Body,
  Content,
  Header,
  Title,
  Left,
  Right,
  Form,
  Item,
  Label,
  Input,
  Icon
} from 'native-base'
import {
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  Linking,
  View
} from 'react-native'
import styled from 'styled-components/native'
import { inject, observer } from 'mobx-react/native'
import { FormattedMessage } from 'react-intl'
import { trackEvent } from 'io/analytics'
import { Constants } from 'expo'

const styles = StyleSheet.create({
  bigblue: {
    color: 'blue',
    fontWeight: 'bold',
    fontSize: 30
  },
  red: {
    color: 'red'
  },
  mainContent: {
    flex: 1,
    marginTop: -45
  },
  inputField: {
    marginRight: 30,
    textAlign: 'left',
    marginLeft: 30
  },
  authBtn: {
    margin: 40,
    height: 60,
    backgroundColor: '#191970',
    borderRadius: 10
  },
  personIcon: {
    fontSize: 20,
    marginRight: 20,
    marginLeft: 20,
    textAlign: 'left'
  },
  logo: {
    width: '100%',
    height: 250,
    marginTop: 20
  }
})

const IntroText = styled.Text`
  text-align: center;
  font-weight: bold;
  color: darkgray;
`

const RegisterBtn = styled.Text`
  text-align: center;
  font-weight: bold;
  font-size: 16px;
  margin-top: 8px;
`

const ErrorText = styled.Text`
  text-align: center;
  color: red;
  font-weight: bold;
  margin-top: 10px;
`

@observer
class EmailPassAuthenticationScreen extends React.Component {
  state = { phoneNumber: '', id: '' }

  handleAuthentication = async () => {
    trackEvent('Navigation', { page: 'EmailPassAuthentication' })
    this.props.signIn(this.state)
  }

  render() {
    const { authError } = this.props
    const { phoneNumber, id } = this.state

    return (
      <Container>
        <Image source={require('../loginLogo.png')} style={styles.logo} />
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <Content style={styles.mainContent}>
            <Form>
              <Item floatingLabel>
                <Label style={{ textAlign: 'left' }}>
                  <FormattedMessage
                    id="Authentication.phonenumber"
                    defaultMessage="Phone number"
                  >
                    {txt => txt}
                  </FormattedMessage>
                </Label>
                <Input
                  keyboardType="numeric"
                  value={phoneNumber}
                  onChangeText={value => this.setState({ phoneNumber: value })}
                />
              </Item>
              <Item floatingLabel>
                <Label style={{ textAlign: 'left' }}>
                  <Icon style={{ color: 'white' }} name="ios-person" />
                  <FormattedMessage id="Authentication.id" defaultMessage="ID">
                    {txt => txt}
                  </FormattedMessage>
                  {false && (
                    <Icon style={styles.personIcon} name="ios-person" />
                  )}
                </Label>
                <Input
                  keyboardType="numeric"
                  value={id}
                  onChangeText={value => this.setState({ id: value })}
                />
              </Item>
              {authError && (
                <View>
                  <FormattedMessage id="Authentication.error">
                    {txt => <ErrorText>{txt}</ErrorText>}
                  </FormattedMessage>
                </View>
              )}
              <Button
                style={styles.authBtn}
                iconLeft
                full
                large
                block
                success
                onPress={this.handleAuthentication}
              >
                <FormattedMessage
                  id="Authentication.button"
                  defaultMessage="Authenticate me"
                >
                  {txt => <Text>{txt}</Text>}
                </FormattedMessage>
              </Button>
              <View style={{ backgroundColor: 'grey', height: 10, width: 200 }} />
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                <Button
                  style={{ width: 1, height: 1 }}
                  onPress={() => Linking.openURL(`https://yedidim-il.org/`)}
                >
                  <Image
                    source={require('../../../assets/icons/icon_website.png')}
                  />
                </Button>
                <Button
                  style={{ width: 1, height: 1 }}
                  onPress={() =>
                    Linking.openURL(`https://www.facebook.com/yedidim.il/`)}
                >
                  <Image
                    source={require('../../../assets/icons/icon_facebook.png')}
                  />
                </Button>
                <Button style={{width:1, height: 1}}
                    onPress={() => Linking.openURL(`tel:${'0533131310'}`)}
                >
                  <Image
                    source={require('../../../assets/icons/icon_call.png')}
                  />
                </Button>
              </View>
            </Form>
            <FormattedMessage id="Authentication.stillNotVolunteers">
              {txt => <IntroText>{txt}</IntroText>}
            </FormattedMessage>
            <FormattedMessage id="Authentication.pressForSignup">
              {txt => (
                <RegisterBtn
                  onPress={() =>
                    Linking.openURL('https://yedidim-il.org/הצטרפו-אלינו/')}
                >
                  {txt}{' '}
                </RegisterBtn>
              )}
            </FormattedMessage>
          </Content>
        </KeyboardAvoidingView>
      </Container>
    )
  }
}

export default inject(({ stores }) => ({
  signIn: stores.authStore.signInWithEmailPass,
  authError: stores.authStore.error,
  isLoading: stores.authStore.isLoading
}))(EmailPassAuthenticationScreen)
