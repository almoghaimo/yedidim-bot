import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { View, Text, StyleSheet, I18nManager } from 'react-native'
import { Form, Item, Label, Input, Button } from 'native-base'
import { signIn } from '../actions/dataSourceActions'

class LoginScreen extends Component {
  constructor(props) {
    super(props)
    this.state = { id: '', phone: '', error: undefined, signingIn: false }
  }

  onSignIn() {
    if (this.state.id.length < 3) {
      this.setState({ error: 'מספר מוקדן שגוי. הזן 3 ספרות' })
      return
    }
    if (this.state.phone.length < 10) {
      this.setState({ error: 'מספר טלפון שגוי. הזן 10 ספרות' })
      return
    }
    this.setState({ signingIn: true })
    this.props.signIn(
      this.state.id,
      this.state.phone,
      this.showError.bind(this)
    )
  }

  showError(error) {
    this.setState({ signingIn: false, error })
  }

  render() {
    return (
      <Form style={styles.container}>
        <Text style={styles.header}>כניסה</Text>
        <Item fixedLabel style={styles.item}>
          <Label style={I18nManager.isRTL ? undefined : { textAlign: 'right' }}>
            מספר מוקדן
          </Label>
          <Input
            maxLength={3}
            keyboardType="phone-pad"
            value={this.state.id}
            onChangeText={text => this.setState({ id: text, error: undefined })}
          />
        </Item>
        <Item fixedLabel style={styles.item}>
          <Label style={I18nManager.isRTL ? undefined : { textAlign: 'right' }}>
            מספר טלפון
          </Label>
          <Input
            maxLength={10}
            keyboardType="phone-pad"
            value={this.state.phone}
            onChangeText={text =>
              this.setState({ phone: text, error: undefined })
            }
          />
        </Item>
        <View style={styles.button}>
          <Button
            full
            style={styles.button}
            disabled={this.state.signingIn}
            onPress={this.onSignIn.bind(this)}
          >
            <Text style={styles.buttonText}>התחבר</Text>
          </Button>
          <Text style={styles.error}>
            {this.state.error ? this.state.error : ''}
          </Text>
        </View>
      </Form>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    signIn: (id, phone, onError) => {
      dispatch(signIn(id, phone, onError))
    }
  }
}

export default connect(
  null,
  mapDispatchToProps
)(LoginScreen)

LoginScreen.propTypes = {
  signIn: PropTypes.func
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    marginRight: 20,
    marginLeft: 20
  },
  header: {
    paddingBottom: 20,
    fontSize: 20,
    alignSelf: 'stretch',
    textAlign: 'center'
  },
  item: {
    flexDirection: 'row-reverse'
  },
  button: {
    paddingTop: 30,
    justifyContent: 'center'
  },
  buttonText: {
    color: 'white',
    alignSelf: 'center'
  },
  error: {
    paddingTop: 40,
    color: 'red',
    alignSelf: 'stretch',
    textAlign: 'center'
  }
})
