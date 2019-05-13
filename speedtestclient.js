const { performance } = require('perf_hooks');
const fs = require('fs');

const httpVersion = parseInt(process.argv[2]) || 1;
var http = null;
if (httpVersion == 2)
  http = require('http2');
else
  http = require('https');
  
var PORT = process.env.PORT;
if (httpVersion == 2)
  PORT = PORT || 5002;
else
  PORT = PORT || 5000;
  
const HOSTNAME = "localhost";

var index = 0;
var numTests = parseInt(process.argv[3]) || 5;

var aggregatedSpeed = 0;
var testsFinished = 0;

function beginTest() {
    var myIndex = index++;
    var indexString = "[" + myIndex + "] ";
    var packets = 0;
    var sizeDownloaded = 0;
    var timeSinceStart = performance.now();
    var timeSinceLastPacket = timeSinceStart;
    
    function processResponse(response) {
        response.on('data', (data) => {
            // Process the data
            packets++;
            var size = data.length;
            sizeDownloaded += size;
            //~ console.log("Packet: ", packets);
            //~ console.log("Size: ", size);
            //~ console.log("Total downloaded: ", sizeDownloaded);
            
            var timeNow = performance.now();
            var deltaTime = timeNow - timeSinceLastPacket;
            timeSinceLastPacket = timeNow;
            var absoluteTime = timeNow - timeSinceStart;
            
            //~ console.log("TimeLastPacket: ", deltaTime);
            //~ console.log("TimeAbsolute: ", absoluteTime);
            
            var speedNow = size / deltaTime;
            var speedGlobal = sizeDownloaded / absoluteTime;
            
            //~ console.log("Speed now (B/ms): ", speedNow);
            //~ console.log("Speed absolute (B/ms): ", speedGlobal);
        });
        response.on('end', () => {
            var absoluteTime = timeSinceLastPacket - timeSinceStart;
            var speedGlobal = sizeDownloaded / absoluteTime;
            console.log("----------------------------------------------");
            var numberstring = Number.parseFloat(absoluteTime/1000).toFixed(2);
            console.log(indexString, "Time downloaded (s): ", numberstring);
            numberstring = Number.parseFloat(sizeDownloaded/1024/1024).toFixed(2);
            console.log(indexString, "Downloaded (MB): ", numberstring);
            numberstring = Number.parseFloat(speedGlobal).toFixed(2);
            console.log(indexString, "Final download speed (B/ms): ", numberstring);
            numberstring = Number.parseFloat(speedGlobal/125).toFixed(2);
            console.log(indexString, "Final download speed (Mb/s): ", numberstring);
            aggregatedSpeed += speedGlobal;
            
            testsFinished++;
            if (testsFinished == numTests) {
                console.log("----------------------------------------------");
                var numberstring = Number.parseFloat(aggregatedSpeed).toFixed(2);
                console.log("Aggregated download speed (B/ms): ", numberstring);
                numberstring = Number.parseFloat(aggregatedSpeed/125).toFixed(2);
                console.log("Aggregated download speed (Mb/s): ", numberstring);
                
                //~ var toWrite = "" + numTests + ", " + numberstring + "\n";
                
                //~ fs.appendFile('multiples.txt', toWrite, function (err) {
                  //~ if (err) throw err;
                  //~ console.log("Saved!");
                //~ });
            }
            if (httpVersion == 2) {
                client.close();
            }
        });
    }
    
    if (httpVersion == 1) {
        const options = {
          hostname: HOSTNAME,
          port: PORT,
          path: '/testStream',
          method: 'GET',
          ca: fs.readFileSync('localhost-cert.pem')
        };
        options.agent = new http.Agent(options);
        var req = http.get(options, (response)=>{
            processResponse(response);
        });
    }
    else {
        var client = http.connect('https://' + HOSTNAME + ':' + PORT, {
          ca: fs.readFileSync('localhost-cert.pem')
        });
        client.on('error', (err) => console.error(err));

        var req = client.request({ ':path': '/testStream' });
        req.setEncoding('utf8');
        
        processResponse(req);
        
        req.end();
    }
} 

for (var i = 0; i < numTests; i++) {
    beginTest();
}