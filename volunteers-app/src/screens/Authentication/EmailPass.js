import React from 'react'
import {
  Button,
  Text,
  Container,
  Content,
  Form,
  Item,
  Label,
  Input,
  Icon
} from 'native-base'
import { Image, StyleSheet, Linking, View } from 'react-native'
import styled from 'styled-components/native'
import { inject, observer } from 'mobx-react/native'
import { FormattedMessage } from 'react-intl'
import { trackEvent } from 'io/analytics'

const styles = StyleSheet.create({
  bigblue: {
    color: 'blue',
    fontWeight: 'bold',
    fontSize: 30
  },
  linkBtn: {
    backgroundColor: 'white',
    width: 40,
    height: 40
  },
  red: {
    color: 'red'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    marginTop: '-7%'
  },
  inputField: {
    marginRight: 30,
    textAlign: 'left',
    marginLeft: 30
  },
  authBtn: {
    margin: 40,
    height: 60,
    backgroundColor: '#0b445f',
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
    height: '40%'
  },
  imgBtn: {
    height: 40,
    width: 40
  },
  centerBtn: {
    marginLeft: 20,
    marginRight: 20
  },
  defaultFont: {
    fontFamily: 'Alef'
  }
})

const IntroText = styled.Text`
  text-align: center;
  font-weight: bold;
  color: darkgray;
  font-family: 'Alef';
`

const RegisterBtn = styled.Text`
  text-align: center;
  font-weight: bold;
  font-size: 16px;
  margin-top: 8px;
  font-family: 'AlefBold';
  font-size: 20px;
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
    const { id } = this.state
    this.props.signIn({
      ...this.state,
      id: id[0] === '0' ? id.substring(1) : id
    })
  }

  render() {
    const { authError } = this.props
    const { phoneNumber, id } = this.state

    return (
      <Container>
        <Image source={require('../loginLogo.png')} style={styles.logo} />
        <View behavior="padding" style={{ flex: 1 }}>
          <Content style={styles.mainContent}>
            <Form>
              <View
                style={{ width: '100%', paddingLeft: 40, paddingRight: 40 }}
              >
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
                    onChangeText={value =>
                      this.setState({ phoneNumber: value })
                    }
                  />
                </Item>
                <Item floatingLabel>
                  <Label style={{ textAlign: 'left' }}>
                    <Icon style={{ color: 'white' }} name="ios-person" />
                    <FormattedMessage
                      id="Authentication.id"
                      defaultMessage="ID"
                    >
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
              </View>
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
              <FormattedMessage id="Authentication.stillNotVolunteers">
                {txt => <IntroText>{txt}</IntroText>}
              </FormattedMessage>
              <FormattedMessage id="Authentication.pressForSignup">
                {txt => (
                  <RegisterBtn
                    onPress={() =>
                      Linking.openURL('https://yedidim-il.org/הצטרפו-אלינו/')
                    }
                  >
                    {txt}{' '}
                  </RegisterBtn>
                )}
              </FormattedMessage>
              <View
                style={{
                  backgroundColor: '#e0e0e0',
                  height: 3,
                  width: 250,
                  marginTop: 10,
                  marginRight: 'auto',
                  marginBottom: 0,
                  marginLeft: 'auto'
                }}
              />
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  marginTop: '5%',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                <Button
                  style={styles.linkBtn}
                  onPress={() => Linking.openURL(`https://yedidim-il.org/`)}
                >
                  <Image
                    style={styles.imgBtn}
                    source={require('../../../assets/icons/icon_website.png')}
                  />
                </Button>
                <Button
                  style={[styles.linkBtn, styles.centerBtn]}
                  onPress={() =>
                    Linking.openURL(`https://www.facebook.com/yedidim.il/`)
                  }
                >
                  <Image
                    style={styles.imgBtn}
                    source={require('../../../assets/icons/icon_facebook.png')}
                  />
                </Button>
                <Button
                  style={styles.linkBtn}
                  onPress={() => Linking.openURL(`tel:${'0533131310'}`)}
                >
                  <Image
                    style={styles.imgBtn}
                    source={require('../../../assets/icons/icon_call.png')}
                  />
                </Button>
              </View>
            </Form>
          </Content>
        </View>
      </Container>
    )
  }
}

export default inject(({ stores }) => ({
  signIn: stores.authStore.signInWithEmailPass,
  authError: stores.authStore.error,
  isLoading: stores.authStore.isLoading
}))(EmailPassAuthenticationScreen)
