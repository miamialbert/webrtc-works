/*
https://23.246.230.179/index3.html
IP Address: 23.246.230.179
UN:  root
PW:  A4yYSxAh
*/

var http = require("https"), url = require("url"), path = require("path"),fs = require("fs"), port = 443;

var options = {
    key: fs.readFileSync('fake-keys/privatekey.pem'),
    cert: fs.readFileSync('fake-keys/certificate.pem')
};

var app = http.createServer(options, function (request, response) {

    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd() + (process.platform == 'linux'? '/public_html' : '\\public_html'), uri);

    fs.exists(filename, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                "Content-Type": "text/plain"
            });
            response.write('404 Not Found: ' + filename + '\n');
            response.end();
            return;
        }
        
        var contentType;

        if (fs.statSync(filename).isDirectory()) {
            filename += '/index.html';
        }
        
        if(filename.indexOf('.html') != -1) {
            contentType = {
                "Content-Type": "text/html"
            };
        }

        fs.readFile(filename, 'binary', function (err, file) {
            if (err) {
                response.writeHead(500, {
                    "Content-Type": "text/plain"
                });
                response.write(err + "\n");
                response.end();
                return;
            }

            response.writeHead(200, contentType);
            response.write(file, 'binary');
            response.end();
        });
    });
}).listen(port);
