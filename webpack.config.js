const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  devServer: {
    static: './public',
    hot: true,
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
    clean: true,
  },
  plugins: [
    new Dotenv()
  ]
};