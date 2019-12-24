module.exports = (api) => {
  
  api.cache(true);
  console.log('Other Babel Root module: ');
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
        corejs: "3.5",
        useBuiltIns: "usage",
      },
    ],
  ];
  const plugins = [];
  return {
    presets,
    plugins
  }
}