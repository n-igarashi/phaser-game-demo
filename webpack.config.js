const webpack = require('webpack');
const DEBUG = !process.argv.includes('build');

module.exports = {
  mode: DEBUG ? 'development' : 'production',
  entry: ['babel-polyfill', './src/_assets/js/index.js'],
  output: {
    filename: 'bundle.js'
  },
  devtool: false,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      append: DEBUG ? '\n//# sourceMappingURL=[url]' : false,
      filename: '../sourcemaps/[file].map'
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]
};
