module.exports = {
  "extends": "airbnb",
  "plugins": [],
  globals: {
    angular: true,
    _: true,
    API_URL: true
  },
  rules: {
    'comma-dangle': ['error', 'never'],
    "arrow-parens": ["error", "always"]
  },
  env: {
    browser: true,
    jasmine: true,
    es6: true,
    node: true
  }
};
