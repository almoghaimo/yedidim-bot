import React from "react";
import {
  Button,
  Text,
  Container,
  Card,
  CardItem,
  Body,
  Content,
  Header,
  Title,
  Left,
  Icon,
  Right,
  Form,
  Item,
  Input,
  Label
} from "native-base";
import { View, WebView } from "react-native";
import styled from "styled-components/native";
import signIn, { signOut } from "../../api";

const IntroText = styled.Text`
  text-align: center;
  font-weight: bold;
  margin: 30px 10px 30px;
  font-size: 16px;
`;

const ButtonsView = styled.View`
  flex-direction: row;
  margin-top: 40px;
`;

const StyledButton = styled(Button)`
  flex-grow: 1;
  align-content: center;
  justify-content: center;
  margin: 0 5px;
`;

export default class AuthenticationScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      phone: "",
      code: "",
      authenticated: false
    };
  }
  render() {
    const { authenticated, phone, code } = this.state;

    const canSubmit = authenticated ? !!code : !!phone;

    const patchPostMessageFunction = function() {
      var originalPostMessage = window.postMessage;

      var patchedPostMessage = function(message, targetOrigin, transfer) {
        originalPostMessage(message, targetOrigin, transfer);
      };

      patchedPostMessage.toString = function() {
        return String(Object.hasOwnProperty).replace(
          "hasOwnProperty",
          "postMessage"
        );
      };

      window.postMessage = patchedPostMessage;
    };

    const patchPostMessageJsCode =
      "(" + String(patchPostMessageFunction) + ")();";

    return (
      <Container>
        <Header>
          <Left />
          <Body>
            <Title>Authentication</Title>
          </Body>
          <Right />
        </Header>
        <Content padder>
          <IntroText>
            Please enter your phone number to receive a code by SMS for
            authentication so to be able to accept events.
          </IntroText>
          <Form>
            <Item>
              <Input
                value={phone}
                keyboardType="numeric"
                disabled={authenticated}
                style={{
                  color: authenticated ? "#d2d4d8" : "black"
                }}
                onChangeText={phone => this.setState({ phone })}
                placeholder="Phone number"
              />
            </Item>
            {authenticated && (
              <Item>
                <Input
                  value={code}
                  onChangeText={code => this.setState({ code })}
                  keyboardType="numeric"
                  placeholder="Enter code received"
                />
              </Item>
            )}
          </Form>
          <ButtonsView>
            <StyledButton
              disabled={!canSubmit}
              success={canSubmit}
              onPress={() => {
                this.setState({ authenticated: true });
                this.webview.postMessage(phone);
                // signIn();
              }}
            >
              <Text>
                {authenticated ? "Verify Code" : "Send me the code by SMS"}
              </Text>
            </StyledButton>
            {authenticated && (
              <StyledButton
                danger
                onPress={() => {
                  this.setState({ authenticated: false, phone: "" });
                  // signOut();
                }}
              >
                <Text>Start Again</Text>
              </StyledButton>
            )}
          </ButtonsView>
          <WebView
            ref={webview => (this.webview = webview)}
            mixedContentMode="always"
            injectedJavaScript={patchPostMessageJsCode}
            style={{ height: 500, width: 500 }}
            source={require("./webview.html")}
            onMessage={event => {
              console.log(">>>onMessage:", event.nativeEvent.data);
              signIn(JSON.parse(event.nativeEvent.data));
            }}
          />
        </Content>
      </Container>
    );
  }
}
