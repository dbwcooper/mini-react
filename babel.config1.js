module.exports = (api) => {
  api.cache(true);
  console.log('api: ', api);
  const presets = [
    [
      "@babel/env",
      {
        targets: {
          edge: "17",
          firefox: "60",
          chrome: "67",
          safari: "11.1",
        },
        useBuiltIns: "usage",
        corejs: "3.5",
      },
    ],
    [
      "@babel/preset-react",
      {
        "pragma": "MiniReact.createElement", // default pragma is React.createElement
        // "pragmaFrag": "DomFrag", // default is React.Fragment
        // "throwIfNamespace": false // defaults to true
      }
    ]
  ];
  const plugins = [];
  return {
    presets,
    plugins
  }
}