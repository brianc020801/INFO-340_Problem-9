module.exports = function (api) {
  api.cache(true);

  const presets =  [
    "@babel/preset-env",
    "@babel/preset-react"
  ]
  const plugins = [
    // "transform-class-properties"
  ]

  return {
    presets,
    plugins
  };
}