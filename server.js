var http = require("https"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    port = process.argv[2] || 8888;
    
port = parseInt(port, 10);

var options = {
    key: fs.readFileSync('fake-keys/privatekey.pem'),
    cert: fs.readFileSync('fake-keys/certificate.pem')
};

var app = http.createServer(options, function (request, response) {

    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd() + '\\public_html', uri);

    path.exists(filename, function (exists) {
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

function testUDPConnection(callback) {
    //server.js
    var PORT = 33333;
    var HOST = '127.0.0.1';

    var dgram = require('dgram');
    var server = dgram.createSocket('udp4');

    //As soon as the server is ready to receive messages, handle it with this handler
    server.on('listening', function() {
        var address = server.address();
        console.log('UDP Server listening on ' + address.address + ":" + address.port);
    });

    //When getting a message, handle it like so:
    server.on('message', function(message, remote) {
        //print out the message
        // console.log(remote.address + ':' + remote.port + ' - ' + message);
        //prepare a response
        var okBuffer = new Buffer("OK " + message);
        server.send(okBuffer, 0, okBuffer.length, remote.port, remote.address, function(err, bytes) {
            if (err) {
                throw err;
            }
            //----------maybe invoke callback here?
        });
    });

    server.bind(PORT, HOST);

    //client.js
    var PORT = 33333;
    var HOST = '127.0.0.1';

    var dgram = require('dgram');
    var message = new Buffer('My KungFu is Good!');

    var client = dgram.createSocket('udp4');

    //When the client socket receives the message event, handle it with this handler
    client.on('message', function(message, remote) {
         callback(true);
    });

    //Send a message [message variable] to the host and port configured in the first two lines,
    //logging as appropriate.
    client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
        if (err) throw err;
    });
}

function testTCPConnection(callback) {
    var net = require('net');
    var client = net.connect({port: port},
    function(error) {
        callback(true);
        client.end();
    });
}

var io = require('socket.io').listen(app, {
    log: true,
    origins: '*:*'
});

io.set('transports', [
    // 'websocket',
    'xhr-polling',
    'jsonp-polling'
]);

var channels = {};
var driverBuilder;

io.sockets.on('connection', function (socket) {
    socket.on('quit-drive', function() {
        if(driverBuilder) {
            driverBuilder.quit();
        }
    });
    
    socket.on('test', function(sessions) {
        if(driverBuilder) {
            driverBuilder.quit();
        }
        
        var webdriver = require('browserstack-webdriver');
        
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
        socket.emit('sent-test');
        return;
        
        /*
        driver.findElement(webdriver.By.name('q')).sendKeys('BrowserStack');
        driver.findElement(webdriver.By.name('btnG')).click();

        driver.getTitle().then(function(title) {
          console.log(title);
        });
        */
    });
    
    return;
    socket.on('test-udp', function() {
        testUDPConnection(function(isUDPFunctional) {
            socket.emit('udp-supported', true);
        });
    });
    
    socket.on('test-tcp', function() {
        testTCPConnection(function(isUDPFunctional) {
            socket.emit('tcp-supported', true);
        });
    });
    
    socket.on('test-stun', function() {
        testSTUN(function(isUDPFunctional) {
            socket.emit('stun-supported', true);
        });
    });
    
    // testSTUN();
});

function testSTUN(callback) {
    // https://github.com/summerwind/node-stun
    var stun  = require('stun');

    // STUN Server by Google
    var port = 19302;
    var host = 'stun.l.google.com';;

    // Connect to STUN Server
    var client = stun.connect(port, host);
    // UDP Message event handler
    client.on('message', function(msg, rinfo){
        console.log('----------');
        console.log('\n\n');
        console.log('----------');
        console.log('Received UDP message:', msg);
    });
    client.on('error', function(error) {
        console.log('----------');
        console.log('\n\n', error);
        console.log('----------');
    });
    client.on('response', function(packet){
        console.log('----------');
        console.log('\n\n');
        console.log('----------');
        client.close();

        var method = stun.method.RESPONSE_S;
        var attr   = stun.attribute.MAPPED_ADDRESS;
        
        console.log(packet.class);
        console.log('attr:' + attr);
        // test.equal(packet.class, 1);
        
        if(packet.class == 1) {
            callback(true);
        }
        
        if(packet.attrs[attr]) {
            console.log(packet.attrs[attr].family);
            // test.equal(packet.method, method);
            // test.equal(packet.attrs[attr].family, 4);
            
            console.log(packet.attrs[attr].port);
            // test.notEqual(packet.attrs[attr].port, null);
            
            console.log(packet.attrs[attr].address);
            // test.notEqual(packet.attrs[attr].address, null);
        }
    });
    
    // Event Handler
    var onRequest = function(){
        console.log('----------');
        console.log('\n\n');
        console.log('----------');
        console.log('Sending STUN packet');
    };
    
    client.request(onRequest);
}