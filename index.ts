import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

if (ErrorUtils) {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('GLOBAL_ERROR_HANDLER:', error);
        originalHandler(error, isFatal);
    });
}

registerRootComponent(App);
