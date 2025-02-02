
const purify = require('purify-css');
const fs = require('fs');
const path = require('path');

const content = ['js/**/*.js', 'index.html'];
const css = ['css/**/*.css'];

const options = {
  minify: true,
  output: 'css/purified.css',
  info: true
};

purify(content, css, options, function (purifiedCSS) {
  console.log('CSS purified!');
});
