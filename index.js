let http = require('http');
let fs = require('fs');

let server = http.createServer( function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 200;

    let file = fs.createReadStream("./index.html");
    file.on("open", function() {
        file.pipe(res);
    });
} );

server.listen(12000, function() {
    console.log("서버가 12000번 포트에서 실행중입니다.");
});