/*
https://23.246.230.178

IP Address: 23.246.230.178
UN: root
PW: KY9W3vTd

java -jar selenium-server-standalone-2.39.0.jar
*/

var http = require("https"), url = require("url"), path = require("path"), fs = require("fs"), port = 443;

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

var io = require('socket.io').listen(app, {
    log: true,
    origins: '*:*'
});

io.set('transports', [
    // 'websocket',
    'xhr-polling',
    'jsonp-polling'
]);

var driverBuilder;

io.sockets.on('connection', function (socket) {
    socket.on('quit-drive', function() {
        if(driverBuilder && driverBuilder.end) driverBuilder.end();
        if(driverBuilder && driverBuilder.quit) driverBuilder.quit();
    });
    
    socket.on('local-test', function(sessions) {
        if(driverBuilder && driverBuilder.end) driverBuilder.end();
        if(driverBuilder && driverBuilder.quit) driverBuilder.quit();        
        
        var targetURL = 'https://19c071b13c664960e187d8a909253d4613e0572c.googledrive.com/host/0B6GWd_dUUTT8UHl6MWFBQUZiVFU/data-connection.html?sessions=' + sessions;
        
        var webdriverjs = require('webdriverjs');
        var options = { desiredCapabilities: {
                browserName: 'chrome',
                version: '36.0'
                //platform: 'XP',
                //args: ['--use-fake-device-for-media-stream'],
                //logLevel: 'logLevel',
                //screenshotPath: './'
            } 
         };
         
        driverBuilder = webdriverjs
           .remote(options)
           .init()
           .url(targetURL);
           
        driverBuilder.getTabIds(function(error, tabIds) {
            console.log('\n\n\n');
            console.log(error);
            console.log(tabIds);
        });
           
        driverBuilder.on('error', function(e) {
            console.log('\n\n\n');
            console.log(e);
            // will be executed everytime an error occured
            // e.g. when element couldn't be found
            console.log(e.body.value.class);   // -> "org.openqa.selenium.NoSuchElementException"
            console.log(e.body.value.message); // -> "no such element ..."
        });
    });
    
    socket.on('remote-test', function(sessions) {
        if(driverBuilder) {
            driverBuilder.quit();
        }
        
        var webdriver = require('browserstack-webdriver');
        
        webdriver.promise.controlFlow().on('uncaughtException', function(e) {
            console.error('Unhandled error: ' + e);
        });
        
        var capabilities = {
          'browserstack.user' : 'albertrodriguez1',
          'browserstack.key' : 'x2wpPzohYgNkLcwqZBhk',
          'browser' : 'Chrome',
          'chromeOptions' : {
            'args' : ['--use-fake-device-for-media-stream']
          },
          'browser_version' : '35.0',
          'os' : 'Windows',
          'os_version' : '7',
          'resolution' : '1024x768',
          'browserstack.debug' : 'true'
        }

        driverBuilder = new webdriver.Builder().
          usingServer('http://hub.browserstack.com/wd/hub').
          withCapabilities(capabilities).
          build();

        driverBuilder.get('https://19c071b13c664960e187d8a909253d4613e0572c.googledrive.com/host/0B6GWd_dUUTT8UHl6MWFBQUZiVFU/data-connection.html?sessions=' + sessions);
    });
    
    initChannelSocket(socket);
});

var channels = {};

function initChannelSocket(socket) {
    var initiatorChannel = '';
    if (!io.isConnected) {
        io.isConnected = true;
    }

    socket.on('new-channel', function (data) {
        if (!channels[data.channel]) {
            initiatorChannel = data.channel;
        }

        channels[data.channel] = data.channel;
        onNewNamespace(data.channel, data.sender);
    });

    socket.on('presence', function (channel) {
        var isChannelPresent = !! channels[channel];
        socket.emit('presence', isChannelPresent);
    });

    socket.on('disconnect', function (channel) {
        if (initiatorChannel) {
            delete channels[initiatorChannel];
        }
    });
}

function onNewNamespace(channel, sender) {
    io.of('/' + channel).on('connection', function (socket) {
        var username;
        if (io.isConnected) {
            io.isConnected = false;
            socket.emit('connect', true);
        }

        socket.on('message', function (data) {
            if (data.sender == sender) {
                if(!username) username = data.data.sender;
                
                socket.broadcast.emit('message', data.data);
            }
        });
        
        socket.on('disconnect', function() {
            if(username) {
                socket.broadcast.emit('user-left', username);
                username = null;
            }
        });
    });
}
