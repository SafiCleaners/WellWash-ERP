const path = require('path')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const webpack = require('webpack')
const { BugsnagSourceMapUploaderPlugin } = require('webpack-bugsnag-plugins')
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
      new UglifyJSPlugin({
        // UglifyJS options
        parallel: true, // Enable parallelization for faster minification
        uglifyOptions: {
            output: {
                comments: false, // Remove all comments
            },
            compress: {
                // UglifyJS compression options
                unused: true, // Drop unreferenced functions and variables
                dead_code: true, // Remove unreachable code
                warnings: false, // Suppress uglification warnings
                keep_fnames: false, // Remove function name mangling
                pure_funcs: ['console.log'], // List of functions to be removed if not used
            },
        },
    }),
      new webpack.BannerPlugin(COPYRIGHT),
      new BugsnagSourceMapUploaderPlugin({
        apiKey: 'd626c9610aa4d6ab8b09d922475c57d1',
        appVersion: '1.2.3',
        metadata: {
          "buildServer": "build1",
          "buildReason": "Working on auth and order flow"
        }
      })
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