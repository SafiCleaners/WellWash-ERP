const path = require('path')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const webpack = require('webpack')
const env = process.env.WEBPACK_ENV

// Simply configure those 4 variables:
const JS_SOURCE_FILES = ['babel-polyfill', path.join(__dirname, '.', 'src/App.js')]
const OUTPUT_FILENAME = 'main'
const DEST_FOLDER = 'public/dist'
const COPYRIGHT = `Add your copyright here. It is included at the beginning of your bundle.`

const OUTPUT_FILE = `${OUTPUT_FILENAME}.min.js`
const OUTPUT_FILE_MIN = `${OUTPUT_FILENAME}.min.js`

const { plugins, outputfile, mode, watch } = env == 'build'
  ? {
    plugins: [
      new UglifyJSPlugin(),
      new webpack.BannerPlugin(COPYRIGHT)
    ],
    outputfile: OUTPUT_FILE_MIN,
    watch: false,
    mode: 'production'
  }
  : {
    plugins: [
      new webpack.BannerPlugin(COPYRIGHT)
    ],
    outputfile: OUTPUT_FILE,
    watch: true,
    mode: 'development'
  }

module.exports = {
  mode,
  watch,
  entry: JS_SOURCE_FILES,
  output: {
    path: path.join(__dirname, DEST_FOLDER),
    filename: outputfile,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [{
      // Only run `.js` files through Babel
      test: /\.m?js$/,
      exclude: /(node_modules)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }]
  },
  devtool: 'source-map',
  plugins: plugins
}