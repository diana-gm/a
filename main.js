var http = require('http2');
var url = require('url');
var fs = require('fs');
const PORT = process.env.OPENSHIFT_NODEJS_PORT || 5000;

var fillString = "";
for (var i = 0; i < 20; i++) {
  fillString += "fillfillfillfillfillfill";
}

const ALOT = 1e6;
const TESTTIME = 5000;

http.createSecureServer({
  key: fs.readFileSync('localhost-privkey.pem'),
  cert: fs.readFileSync('localhost-cert.pem')
}, function (req, res) {
  var q = url.parse(req.url, true);
  console.log("Requested ", q.pathname);
  if (q.pathname == "/testStream") {
    setTimeout(function(){
      //~ console.log("closing");
      res.writable = false;
      res.end(function(){res.destroy();});
    }, TESTTIME);
    
    // Return stream
    res.writeHead(200, {'Content-Type': 'text/plain'});
    // Initial write
    for (i = 0; i < ALOT && res.writable; i++) {
      if (!res.write(fillString)) {
        //~ console.log("Initially filled with n ", i);
        break;
      }
    }
    // Every time it's drained, we send more
    res.on("drain", function() {
      for (i = 0; i < ALOT && res.writable; i++) {
        if (!res.write(fillString)) {
          //~ console.log("Filled with n ", i);
          break;
        }
      }
    });
    return true;
  }
  else {
    var filename = "." + q.pathname;
    if (q.pathname == "/") filename = "./speedtest.html";
    fs.readFile(filename, function(err, data) {
      if (err) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        return res.end("404 Not Found");
      }  
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      return res.end();
    });
  }
}).listen(PORT);

console.log("Listening on port ", PORT);
