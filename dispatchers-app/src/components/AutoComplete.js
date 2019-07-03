import React, { Component } from 'react'
import { Input, Item, Text, View } from 'native-base'
import { I18nManager, StyleSheet } from 'react-native'

class Autocomplete extends Component {
  static defaultProps = {
    suggestions: []
  }

  constructor(props) {
    super(props)

    this.state = {
      // The suggestions that match the user's input
      filteredSuggestions: [],
      // Whether or not the suggestion list is shown
      showSuggestions: false,
      // What the user has entered
      userInput: ''
    }
  }

  // Event fired when the input value is changed
  onChange = value => {
    let filteredSuggestions = []

    const isShowSuggestions = value.length > 1

    if (isShowSuggestions) {
      const { suggestions } = this.props
      const userInput = value

      // Filter our suggestions that don't contain the user's input
      filteredSuggestions = suggestions
        .slice(0, 15)
        .filter(suggestion =>
          suggestion.toLowerCase().startsWith(userInput.toLowerCase())
        )

      // Update the user input and filtered suggestions, reset the active
      // suggestion and make sure the suggestions are shown
    }

    this.setState({
      filteredSuggestions,
      showSuggestions: isShowSuggestions,
      userInput: value
    })
  }

  render() {
    const {
      onChange,
      state: { filteredSuggestions, showSuggestions, userInput }
    } = this

    let suggestionsListComponent

    if (showSuggestions && userInput) {
      if (filteredSuggestions.length) {
        suggestionsListComponent = filteredSuggestions
          .sort((a, b) => a.localeCompare(b, 'he', { ignorePunctuation: true})) // todo should work in multiple languages
          .map((suggestion, index) => {
            const style = Object.assign({}, styles.item)
            if (index === 0) {
              style.borderTopWidth = 0.5
            }
            return (
              <Text
                onPress={() => console.log(`1st: ${suggestion}`)}
                key={suggestion}
                style={style}
              >
                {suggestion}
              </Text>
            )
          })
      } else {
        suggestionsListComponent = (
          <Text style={{ backgroundColor: 'green' }}>
            {' '}
            "No suggestions, you're on your own!"{' '}
          </Text>
        )
      }
    }

    const viewStyle = { flex: 1, flexDirection: 'column' }
    viewStyle.textAlign = I18nManager.isRTL ? undefined : 'right'

    return (
      <View style={viewStyle}>
        <Input
          type="text"
          onChangeText={value => onChange(value)}
          value={userInput}
        />
        {suggestionsListComponent}
      </View>
    )
  }
}

export default Autocomplete

const styles = StyleSheet.create({
  item: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5
  }
})
