module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // 'react-native-reanimated/plugin', // Commented out for Expo Go compatibility
        ],
    };
};
