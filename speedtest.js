//~ var pf = require('performance');
var packets = 0;
var sizeDownloaded = 0;
var timeSinceStart = null;
var timeSinceLastPacket = null;

var chart = null;
var chartConfig = null;

function beginTest() {
    document.getElementById("begin").disabled = true;
    
    packets = 0;
    sizeDownloaded = 0;
    timeSinceStart = performance.now();
    timeSinceLastPacket = timeSinceStart;
    firstPacketReceived = false;
    
    createGraphs();
    
    fetch('/testStream')
    .then(response => response.body)
    .then(rs => {
        const reader = rs.getReader();
        return new ReadableStream({
            async start(controller) {
                while (true) {
                    const { done, value } = await reader.read();
                    //~ console.log("Got another packet");
                    var timeNow = performance.now();
                    var deltaTime = timeNow - timeSinceLastPacket;
                    timeSinceLastPacket = timeNow;
                    var absoluteTime = timeNow - timeSinceStart;
                    
                    if (done || absoluteTime > 10000) {
                        //~ console.log("It was the last packet");
                        break;
                    }
                    
                    // Process the data
                    packets++;
                    var size = value.byteLength;
                    sizeDownloaded += size;
                    //~ console.log("Packet: ", packets);
                    //~ console.log("Size: ", size);
                    //~ console.log("Total downloaded: ", sizeDownloaded);
                    
                    //~ console.log("TimeLastPacket: ", deltaTime);
                    //~ console.log("TimeAbsolute: ", absoluteTime);
                    
                    var speedNow = size / deltaTime;
                    var speedGlobal = sizeDownloaded / absoluteTime;
                    chartConfig.data.datasets[0].data.push({
                        x: absoluteTime,
                        y: speedNow});
                        
                    chartConfig.data.datasets[1].data.push({
                        x: absoluteTime,
                        y: speedGlobal});
                    
                    chart.update();
                    
                    //~ console.log("Speed now (B/ms): ", speedNow);
                    //~ console.log("Speed absolute (B/ms): ", speedGlobal);
                }
                var absoluteTime = timeSinceLastPacket - timeSinceStart;
                var speedGlobal = sizeDownloaded / absoluteTime;
                //~ console.log("Time downloaded (ms): ", absoluteTime);
                //~ console.log("Downloaded bytes: ", sizeDownloaded);
                //~ console.log("Final download speed (B/ms): ", speedGlobal);
                //~ console.log("Final download speed (Mb/s): ", speedGlobal/125);
                var numberstring = Number.parseFloat(absoluteTime/1000).toFixed(2);
                document.getElementById("resultTime").innerHTML = numberstring;
                numberstring = Number.parseFloat(sizeDownloaded/1024/1024).toFixed(2);
                document.getElementById("resultBytes").innerHTML = numberstring;
                numberstring = Number.parseFloat(speedGlobal).toFixed(2);
                document.getElementById("resultSpeed").innerHTML = numberstring;
                numberstring = Number.parseFloat(speedGlobal/125).toFixed(2);
                document.getElementById("resultSpeed2").innerHTML = numberstring;
                
                // Close the stream
                controller.close();
                reader.releaseLock();
                
                document.getElementById("begin").disabled = false;
            }
        })
    })
} 

function createGraphs() {
    if (chart != null) {
        chartConfig.data.datasets[0].data = [];
        chartConfig.data.datasets[1].data = [];
        chart.update();
        return;
    }
    
    var ctx = document.getElementById('chart').getContext('2d');
    chartConfig = {
        // The type of chart we want to create
        type: 'scatter',

        // The data for our dataset
        data: {
            datasets: [{
                label: 'Raw speed',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [{
                    x: 0,
                    y: 0
                }]
            },{
                label: 'Global speed',
                backgroundColor: 'rgb(99, 132, 255)',
                borderColor: 'rgb(99, 132, 255)',
                data: [{
                    x: 0,
                    y: 0
                }]
            }]
        },

        // Configuration options go here
        options: {
        }
    };
    chart = new Chart(ctx, chartConfig);
}