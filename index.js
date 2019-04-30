const express = require('express');
const http = require('http');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');  //여기
const qs = require('querystring');
const iconv = require('iconv-lite');    //인코딩 변환도구
const charset = require('charset');     //캐릭터셋 체크 도구
const mysql = require('mysql');

/* mysql 연결부분 */
const conn = mysql.createConnection({
    user: "yy_30203",
    password: "1234",
    host: "gondr.asuscomm.com"
});

conn.query("USE yy_30203"); //yy_30203 데이터베이스 사용

let app = express();

app.set('port', 12000);

app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json()); //미들웨어로 바디파서를 사용함. //여기
app.use(bodyParser.urlencoded({ extended: true })); //여기

const router = require('./router');
app.use(router);

let server = http.createServer(app);
server.listen(app.get('port'), function () {
    console.log(`Express 엔진이 ${app.get('port')}에서 실행중`);
});


