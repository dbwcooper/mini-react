module.exports = {
  env: {
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module", // 支持es6 export import
  },
  rules: {
    semi: ["error", "always"],
    quotes: ["error", "double"]
  }
};
