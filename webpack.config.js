module.exports = {
  context: __dirname + "/src",
  entry: "./autocsp",
  output: {
    path: __dirname + "/dist",
    libraryTarget: 'var',
    filename: 'bundle.js',
    library: 'AutoCSP'
  },
  module: {
    loaders: [
    { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
    { test: /\.json$/, loader: 'json-loader' }
    ]
  }
};
