const fs = require('fs')
var minify = require('html-minifier').minify;

var path = require("path")

const start = () => {
    fs.readFile(path.join(__dirname, '.', 'index-dev.html'), 'utf8', (err, data) => {
        if (err) {
            console.error(err)
            return
        }

        var result = minify(data, {
            removeAttributeQuotes: true,
            html5: true,
            minifyJS: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true,
            useShortDoctype: true
        });

        // console.log(result)
        fs.writeFile('public/index.html', result, function (err) {
            if (err) return console.log(err);
            console.log('html minification successfull');
            console.log('index-dev.html > index.html');
        });
    })
}

start()