// Last time updated at August 05, 2014, 08:32:23

// Latest file can be found here: https://cdn.webrtc-experiment.com/DetectRTC.js

// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// Documentation - github.com/muaz-khan/WebRTC-Experiment/tree/master/DetectRTC
// ____________
// DetectRTC.js

// DetectRTC.hasWebcam (has webcam device!)
// DetectRTC.hasMicrophone (has microphone device!)
// DetectRTC.hasSpeakers (has speakers!)
// DetectRTC.isScreenCapturingSupported
// DetectRTC.isSctpDataChannelsSupported
// DetectRTC.isRtpDataChannelsSupported
// DetectRTC.isAudioContextSupported
// DetectRTC.isWebRTCSupported
// DetectRTC.isDesktopCapturingSupported
// DetectRTC.isMobileDevice

// DetectRTC.isWebSocketsSupported
// DetectRTC.isAcceptsUDP
// DetectRTC.isAcceptTCP
// DetectRTC.clientIP
// DetectRTC.isBehindProxy
// DetectRTC.browser
// DetectRTC.os
// DetectRTC.videoResolutions
// DetectRTC.screenResolutions

// detect node-webkit
var isNodeWebkit = window.process && (typeof window.process == 'object') && window.process.versions && window.process.versions['node-webkit'];

var browser = getBrowserInfo();

// is this a chromium browser (opera or chrome)
var isChrome = browser.name == 'Chrome';
var isFirefox = browser.name == 'Firefox';

var DetectRTC = {
    browser: browser,
    hasMicrophone: false,
    hasSpeakers: false,
    hasWebcam: false,

    isWebRTCSupported: !!window.webkitRTCPeerConnection || !!window.mozRTCPeerConnection,
    isAudioContextSupported: (!!window.AudioContext || !!window.webkitAudioContext) && !!AudioContext.prototype.createMediaStreamSource,

    isScreenCapturingSupported: (isFirefox && browser.version >= 33) ||
        (isChrome && browser.version >= 26 && (isNodeWebkit ? true : location.protocol == 'https:')),

    isDesktopCapturingSupported: (isFirefox && browser.version >= 33) || (isChrome && browser.version >= 34) || isNodeWebkit || false,

    isSctpDataChannelsSupported: isFirefox || (isChrome && browser.version >= 25),
    isRtpDataChannelsSupported: isChrome && browser.version >= 31,
    isMobileDevice: !!navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i),
    isBehindNAT: false,
    isWebSocketsSupported: 'WebSocket' in window && 2 === window.WebSocket.CLOSING,

    isTCPRequestsAllowed: false,
    isUDPRequestsAllowed: false
};

var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isFirefox = typeof InstallTrigger !== 'undefined';
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
var isChrome = !!window.chrome && !isOpera;
var isIE = !!document.documentMode;
    
var isMobileDevice = !!navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i);

// detect node-webkit
var isNodeWebkit = !!(window.process && (typeof window.process == 'object') && window.process.versions && window.process.versions['node-webkit']);

DetectRTC.UA = {
    Firefox: isFirefox,
    Chrome: isChrome,
    Mobile: isMobileDevice,
    Version: browser.version,
    NodeWebkit: isNodeWebkit,
    Safari: isSafari,
    InternetExplorer: isIE,
    Opera: isOpera
};

var OSName="Unknown OS";
if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";

DetectRTC.OSName = OSName;

(function() {
    DetectRTC.MediaDevices = [];

    // http://dev.w3.org/2011/webrtc/editor/getusermedia.html#mediadevices
    // todo: switch to enumerateDevices when landed in canary.
    function CheckDeviceSupport(callback) {
        // This method is useful only for Chrome!

        // Firefox seems having no support of enumerateDevices feature.
        // Though there seems some clues of "navigator.getMediaDevices" implementation.
        if (isFirefox) {
            callback && callback();
            return;
        }

        if (!navigator.getMediaDevices && MediaStreamTrack && MediaStreamTrack.getSources) {
            navigator.getMediaDevices = MediaStreamTrack.getSources.bind(MediaStreamTrack);
        }

        // if still no "getMediaDevices"; it MUST be Firefox!
        if (!navigator.getMediaDevices) {
            log('navigator.getMediaDevices is undefined.');
            // assuming that it is older chrome or chromium implementation
            if (isChrome) {
                DetectRTC.hasMicrophone = true;
                DetectRTC.hasSpeakers = true;
                DetectRTC.hasWebcam = true;
            }

            callback && callback();
            return;
        }

        navigator.getMediaDevices(function(devices) {
            devices.forEach(function(device) {
                // if it is MediaStreamTrack.getSources
                if (device.kind == 'audio') {
                    device.kind = 'audioinput';
                }

                if (device.kind == 'video') {
                    device.kind = 'videoinput';
                }

                if (!device.deviceId) {
                    device.deviceId = device.id;
                }

                if (!device.id) {
                    device.id = device.deviceId;
                }

                DetectRTC.MediaDevices.push(device);

                if (device.kind == 'audioinput' || device.kind == 'audio') {
                    DetectRTC.hasMicrophone = true;
                }

                if (device.kind == 'audiooutput') {
                    DetectRTC.hasSpeakers = true;
                }

                if (device.kind == 'videoinput' || device.kind == 'video') {
                    DetectRTC.hasWebcam = true;
                }

                // there is no "videoouput" in the spec.
            });

            if (callback) callback();
        });
    }

    // check for microphone/camera support!
    CheckDeviceSupport();
    DetectRTC.load = CheckDeviceSupport;

    var screenCallback;

    DetectRTC.screen = {
        chromeMediaSource: 'screen',
        extensionid: ReservedExtensionID,
        getSourceId: function(callback) {
            if (!callback) throw '"callback" parameter is mandatory.';
            screenCallback = callback;
            window.postMessage('get-sourceId', '*');

            // sometimes content-script mismatched URLs
            // causes infinite delay.
            setTimeout(function() {
                if (!DetectRTC.screen.sourceId && DetectRTC.screen.chromeMediaSource == 'screen') {
                    callback('No-Response');
                }
            }, 2000);
        },
        isChromeExtensionAvailable: function(callback) {
            if (!callback) return;

            if (DetectRTC.screen.chromeMediaSource == 'desktop') return callback(true);

            // ask extension if it is available
            window.postMessage('are-you-there', '*');

            setTimeout(function() {
                if (DetectRTC.screen.chromeMediaSource == 'screen') {
                    callback(false);
                } else callback(true);
            }, 2000);
        },
        onMessageCallback: function(data) {
            if (!(typeof data == 'string' || !!data.sourceId)) return;

            // "cancel" button is clicked
            if (data == 'PermissionDeniedError') {
                DetectRTC.screen.chromeMediaSource = 'PermissionDeniedError';
                if (screenCallback) return screenCallback('PermissionDeniedError');
                else throw new Error('PermissionDeniedError');
            }

            // extension notified his presence
            if (data == 'rtcmulticonnection-extension-loaded') {
                DetectRTC.screen.chromeMediaSource = 'desktop';
                DetectRTC.isDesktopCapturingSupported = true;

                if (DetectRTC.screen && DetectRTC.screen.onScreenCapturingExtensionAvailable) {
                    DetectRTC.screen.onScreenCapturingExtensionAvailable();

                    // make sure that this event isn't fired multiple times
                    DetectRTC.screen.onScreenCapturingExtensionAvailable = null;
                }
            }

            // extension shared temp sourceId
            if (data.sourceId) {
                DetectRTC.screen.sourceId = data.sourceId;
                if (screenCallback) screenCallback(DetectRTC.screen.sourceId);
            }
        },
        getChromeExtensionStatus: function(extensionid, callback) {
            if (isFirefox) return callback('not-chrome');

            if (arguments.length != 2) {
                callback = extensionid;
                extensionid = this.extensionid;
            }

            var image = document.createElement('img');
            image.src = 'chrome-extension://' + extensionid + '/icon.png';
            image.onload = function() {
                DetectRTC.screen.chromeMediaSource = 'screen';
                window.postMessage('are-you-there', '*');
                setTimeout(function() {
                    if (DetectRTC.screen.chromeMediaSource == 'screen') {
                        callback(DetectRTC.screen.extensionid == extensionid ? 'installed-enabled' : 'installed-disabled');
                    } else callback('installed-enabled');
                }, 2000);
            };
            image.onerror = function() {
                callback('not-installed');
            };
        }
    };

    // check if desktop-capture extension installed.
    if (window.postMessage && isChrome) {
        DetectRTC.screen.isChromeExtensionAvailable();
    }

    /*
    window.addEventListener('load', function() {
        connectPeerConnections({
            stun: true,
            udp: true,
            tcp: true,
            callback: function(iceConnectionState) {
                DetectRTC.isBehindNAT = iceConnectionState == 'failed';
                if (DetectRTC.onupdate) DetectRTC.onupdate();
            }
        });
    }, false);
    */

    /*
    connectPeerConnections({
        udp: true,
        callback: function(iceConnectionState) {
            console.log('isUDPRequestsAllowed', iceConnectionState);
            DetectRTC.isUDPRequestsAllowed = iceConnectionState != 'failed';
            if (DetectRTC.onupdate) DetectRTC.onupdate();
        }
    });

    connectPeerConnections({
        udp: true,
        callback: function(iceConnectionState) {
            console.log('isTCPRequestsAllowed', iceConnectionState);
            DetectRTC.isTCPRequestsAllowed = iceConnectionState != 'failed';
            if (DetectRTC.onupdate) DetectRTC.onupdate();
        }
    });
    */

    function connectPeerConnections(args) {
        if(!args.iframe) {
            args.iframe = document.createElement('iframe');
            args.iframe.srcdoc = '<script>function connectPeerConnection(e){function u(e){console.error(e)}function a(){}var t=typeof e.stun=="undefined";var n=typeof e.stun!="undefined"?e.stun:true;var r=typeof e.tcp!="undefined"?e.tcp:true;var i=typeof e.udp!="undefined"?e.udp:true;var s={iceServers:n?[{url:"stun:localhost:8888"}]:[]};var o={optional:[],mandatory:{OfferToReceiveAudio:false,OfferToReceiveVideo:false}};answerer=new RTCPeerConnection(s);answerer.onicecandidate=function(e){if(!e||!e.candidate)return;var s=e.candidate;if(!i&&s.candidate.indexOf(" udp ")!=-1)return;if(!r&&s.candidate.indexOf(" tcp ")!=-1)return;if(t&&s.candidate.indexOf(" typ host ")==-1)return;if(n&&s.candidate.indexOf(" typ srflx ")==-1)return;window.postMessage({ice:JSON.stringify(s),sender:sender},"*")};answererDataChannel=answerer.createDataChannel("RTCDataChannel",{});answerer.oniceconnectionstatechange=function(){console.log("iframe-oniceconnectionstatechange",JSON.stringify({iceConnectionState:answerer.iceConnectionState,iceGatheringState:answerer.iceGatheringState,signalingState:answerer.signalingState},null,"	"))};console.log("iframe:setting remote descriptions",e.sdp.sdp);answerer.setRemoteDescription(new RTCSessionDescription(e.sdp),a,u);answerer.createAnswer(function(e){answerer.setLocalDescription(e);window.postMessage({sdp:JSON.stringify(e),sender:sender},"*")},u,o)}var sender=(Math.random()*1e3).toString().replace(".","");var answerer,answererDataChannel;window.addEventListener("message",function(e){var t=e.data;if(t.offerArgs){t.offerArgs=JSON.parse(t.offerArgs);console.log("iframe-args",t.offerArgs);connectPeerConnection(t.offerArgs)}if(t.ice&&t.sender!=sender){t.ice=JSON.parse(t.ice);console.log("added-ice-iframe",t.ice.candidate);if(answerer)answerer.addIceCandidate(new RTCIceCandidate(t.ice))}});var RTCPeerConnection=window.mozRTCPeerConnection||window.webkitRTCPeerConnection;var RTCSessionDescription=window.mozRTCSessionDescription||window.RTCSessionDescription;var RTCIceCandidate=window.mozRTCIceCandidate||window.RTCIceCandidate</script>';
            args.iframe.style.display = 'none';
            args.iframe.onload = function() {
                connectPeerConnections(args);
            };
            document.body.insertBefore(args.iframe, document.body.firstChild);
            return;
        }
        
        args.iframe.contentWindow.addEventListener('message', function(event) {
            var message = event.data;
            if(message.sender == sender) return;
            
            if(message.sdp && message.sender != sender) {
                message.sdp = JSON.parse(message.sdp);
                console.log('normal:setting remote descriptions', message.sdp.sdp);
                offerer.setRemoteDescription(
                    new RTCSessionDescription(message.sdp)
                );
            }
            if(message.ice && message.sender != sender) {
                message.ice = JSON.parse(message.ice);
                console.log('added-ice-normal', message.ice.candidate);
                offerer.addIceCandidate(
                    new RTCIceCandidate(message.ice)
                );
            }
        });
        
        var sender = (Math.random() * 1000).toString().replace('.', '');
        
        var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        var RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
        var RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

        var host = typeof args.stun == 'undefined' || args.stun == false;
        var stun = typeof args.stun != 'undefined' ? args.stun : true;

        var tcp = typeof args.tcp != 'undefined' ? args.tcp : true;
        var udp = typeof args.udp != 'undefined' ? args.udp : true;

        var iceServers = {
            iceServers: stun ? [{
                url: 'stun:localhost:8888'
            }] : []
        };

        var mediaConstraints = {
            optional: [],
            mandatory: {
                OfferToReceiveAudio: false,
                OfferToReceiveVideo: false
            }
        };

        var offerer = new RTCPeerConnection(iceServers);
        var offererDataChannel = offerer.createDataChannel('RTCDataChannel', {});
        
        offerer.oniceconnectionstatechange = function() {
            console.log('normal-oniceconnectionstatechange', JSON.stringify({
                iceConnectionState: offerer.iceConnectionState,
                iceGatheringState: offerer.iceGatheringState,
                signalingState: offerer.signalingState
            }, null, '\t'));
            
            if(offerer.iceConnectionState.search(/failed|completed/g) != -1) {
                args.callback(offerer.iceConnectionState);
            }
        };

        offerer.onicecandidate = function(e) {
            if (!e || !e.candidate) return;

            var ice = e.candidate;
            
            if (!udp && ice.candidate.indexOf(' udp ') != -1) return;
            if (!tcp && ice.candidate.indexOf(' tcp ') != -1) return;

            if (host && ice.candidate.indexOf(' typ host ') == -1) return;
            if (stun && ice.candidate.indexOf(' typ srflx ') == -1) return;

            args.iframe.contentWindow.postMessage({
                ice: JSON.stringify(ice),
                sender: sender
            }, '*')
        };

        offerer.createOffer(function(sessionDescription) {
            offerer.setLocalDescription(sessionDescription);
            args.iframe.contentWindow.postMessage({
                offerArgs: JSON.stringify({
                    stun: !!args.stun,
                    udp: !!args.udp,
                    sdp: sessionDescription
                }),
                sender: sender
            }, '*')
        }, onSdpFailure, mediaConstraints);

        function onSdpFailure(error) {
            console.error(error);
        }

        function onSdpSuccess() {
            console.log('onSdpSuccess');
        }
    }
})();

// if IE
if (!window.addEventListener) {
    window.addEventListener = function(el, eventName, eventHandler) {
        if (!el.attachEvent) return;
        el.attachEvent('on' + eventName, eventHandler);
    }
}

window.addEventListener('message', function(event) {
    if (event.origin != window.location.origin) {
        return;
    }

    DetectRTC.screen.onMessageCallback(event.data);
});

var ReservedExtensionID = 'ajhifddimkapgcifgcodmmfdlknahffk';

function getBrowserInfo() {
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browserName = navigator.appName;
    var fullVersion = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix;

    // In Opera, the true version is after "Opera" or after "Version"
    if ((verOffset = nAgt.indexOf("Opera")) != -1) {
        browserName = "Opera";
        fullVersion = nAgt.substring(verOffset + 6);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }
    // In MSIE, the true version is after "MSIE" in userAgent
    else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
        browserName = "IE";
        fullVersion = nAgt.substring(verOffset + 5);
    }
    // In Chrome, the true version is after "Chrome" 
    else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
        browserName = "Chrome";
        fullVersion = nAgt.substring(verOffset + 7);
    }
    // In Safari, the true version is after "Safari" or after "Version" 
    else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
        browserName = "Safari";
        fullVersion = nAgt.substring(verOffset + 7);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }
    // In Firefox, the true version is after "Firefox" 
    else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
        browserName = "Firefox";
        fullVersion = nAgt.substring(verOffset + 8);
    }
    // In most other browsers, "name/version" is at the end of userAgent 
    else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
        browserName = nAgt.substring(nameOffset, verOffset);
        fullVersion = nAgt.substring(verOffset + 1);
        if (browserName.toLowerCase() == browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }
    // trim the fullVersion string at semicolon/space if present
    if ((ix = fullVersion.indexOf(';')) != -1) fullVersion = fullVersion.substring(0, ix);
    if ((ix = fullVersion.indexOf(' ')) != -1) fullVersion = fullVersion.substring(0, ix);

    majorVersion = parseInt('' + fullVersion, 10);
    if (isNaN(majorVersion)) {
        fullVersion = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }

    return {
        fullVersion: fullVersion,
        version: majorVersion,
        name: browserName
    };
}