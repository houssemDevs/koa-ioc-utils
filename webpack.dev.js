const path = require('path');
const nodeExternals = require('webpack-node-externals');
const cleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = () => ({
  target: 'node',
  mode: 'development',
  node: {
    __dirname: false,
    __filename: false,
  },
  entry: {
    index: path.resolve(__dirname, 'src/index.ts'),
    testing: path.resolve(__dirname, 'src/testing.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.dev.json',
          },
        },
      },
    ],
  },
  devtool: 'inline-source-map',
  externals: [nodeExternals()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.ts', '.js'],
  },
  plugins: [new cleanWebpackPlugin()],
});
