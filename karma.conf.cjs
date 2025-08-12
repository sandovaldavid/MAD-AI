// karma.conf.cjs
const puppeteer = require('puppeteer');
process.env.CHROME_BIN = puppeteer.executablePath();

/** @type {import('karma').Config} */
module.exports = (config) => {
    config.set({
        frameworks: ['jasmine'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-jasmine-html-reporter'),
            require('karma-coverage'),
        ],
        reporters: ['progress', 'kjhtml'],
        browsers: ['ChromeHeadless'],
        customLaunchers: {
            ChromeHeadlessCI: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
            },
        },
        singleRun: false,
        restartOnFileChange: true,
    });
};
