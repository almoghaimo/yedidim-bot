import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './components/Root';
import configureStore, {history} from './store/configureStore';

require('./favicon.ico'); // Tell webpack to load favicon.ico
//require('./apple-touch-icon.png');
import './styles/styles.scss'; // Yep, that's right. You can import SASS/CSS files too! Webpack will run the associated loader and plug this into the page.

const initialState = process.env.NODE_ENV === 'production' ?
  {dataSource: {production: true, allowAdd: false}}
  :
  {dataSource: {production: false, allowAdd: false}};
const store = configureStore(initialState);

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('app')
);

if (module.hot) {
  module.hot.accept('./components/Root', () => {
    const NewRoot = require('./components/Root').default;
    render(
      <AppContainer>
        <NewRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('app')
    );
  });
}