/* Webpack configuration for compilation */
const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const visualizer = require('webpack-visualizer-plugin');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const ENTRY_MAIN = './src/js/tmd-editor.js';
const IS_HMR = process.argv.indexOf('--hot') >= 0 || process.argv.indexOf('--hotOnly') >= 0;
const IS_DEV_SERVER = process.argv[1].indexOf('webpack-dev-server') >= 0;
const IS_PRODUCTION = process.argv.indexOf('-p') >= 0;

const DIST_DIR_NAME = 'dist';
const DIST_PATH = path.join(__dirname, DIST_DIR_NAME);
const DIST_FILE = `[name]${IS_PRODUCTION ? '.min' : ''}.js`;
const PUBLIC_PATH = `http://localhost:8080/${DIST_DIR_NAME}/`;

const BANNER = [
    pkg.name,
    `@version ${pkg.version}`,
    `@author ${pkg.author}`,
    `@license ${pkg.license}`
].join('\n');

const config = {
    cache: false,
    entry: {
        'tmd-editor': ENTRY_MAIN
    },
    output: {
        path: DIST_PATH,
        publicPath: 'dist/',
        pathinfo: false,
        filename: DIST_FILE
    },
    module: {},
    plugins: [
        new webpack.BannerPlugin({
            banner: BANNER,
            raw: false,
            entryOnly: true
        }),
        new webpack.ProvidePlugin({
            //'CodeMirror': 'codemirror'
        }),
        new visualizer({ filename: './build/report/webpack-statistics.html' })
    ]
};

if (IS_DEV_SERVER) {
    config.entry = {
        'tmd-editor': [ENTRY_MAIN, 'webpack-dev-server/client?http://localhost:8080']
    };
    //config.output.path = PUBLIC_PATH;
    config.devServer = {
        host: '0.0.0.0',
        disableHostCheck: true,
        port: 8080,
        publicPath: PUBLIC_PATH,
        noInfo: true,
        inline: true,
        stats: {
            colors: true
        }
    }
    config.devtool = "inline-source-map";
    if (IS_HMR) {
        config.plugins.push(new webpack.HotModuleReplacementPlugin());
    }
}

module.exports = config;
