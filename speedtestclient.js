const { performance } = require('perf_hooks');

const http = require('https');
const fs = require('fs');

var index = 0;
var numTests = parseInt(process.argv[2]) || 5;

var aggregatedSpeed = 0;
var testsFinished = 0;

function beginTest() {
    var myIndex = index++;
    var indexString = "[" + myIndex + "] ";
    var packets = 0;
    var sizeDownloaded = 0;
    var timeSinceStart = performance.now();
    var timeSinceLastPacket = timeSinceStart;
    
    const file = fs.createWriteStream("stream.txt");
    const request = http.get("https://serene-gorge-69729.herokuapp.com/testStream", function(response) {
    //~ const request = http.get("http://0.0.0.0:5000/testStream", function(response) {
        response.pipe(file);
        response.on("data", function(data) {
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
        response.on("end", function(data) {
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
                
                var toWrite = "" + numTests + ", " + numberstring + "\n";
                
                fs.appendFile('multiples.txt', toWrite, function (err) {
                  if (err) throw err;
                  console.log('Saved!');
                });
            }
        });
    });
} 

for (var i = 0; i < numTests; i++) {
    beginTest();
}