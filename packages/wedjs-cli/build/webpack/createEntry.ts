export default function createEntry(appEntry: string, hmr: boolean) {
  let code = `
    import App from './${appEntry}';
    import React from 'react';
    import { hydrateServerRenderer } from 'wedjs/cjs/renderer/hydrate';
    let render = Component => {
      hydrateServerRenderer(<Component />);
    };
  `

  if(hmr) {
    code += `
      import { AppContainer } from 'react-hot-loader';

      render = Component => {
        hydrateServerRenderer(<AppContainer><App /></AppContainer>);
      }

      if (module.hot) {
        module.hot.accept('./App', () => {
          render(App);
        });
      }
    `
  }

  code += 'render(App);'

  return code
}