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

app.get('/', function (req, res) {
    res.render('main', { msg: 'Welcome To Express4' });
});

app.get('/top20', function (req, res) {

    request("https://www.naver.com", function (err, response, body) {
        let list = [];
        $ = cheerio.load(body);

        let top20 = $(".ah_roll_area > .ah_l > li > a > .ah_k");

        for (let i = 0; i < top20.length; i++) {
            let msg = $(top20[i]).text();
            list.push(msg);
        }

        res.render('top', { msg: '네이버 실시간 급상승 검색어', list: list });
    });
});


app.get('/search', function (req, res) {
    res.render('search', {});
});

app.post('/search', function (req, res) {
    let word = req.body.word;
    word = qs.escape(word);
    let url = "https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=" + word;
    request(url, function (err, response, body) {
        let list = [];
        $ = cheerio.load(body);

        let result = $(".sp_website .type01 > li dt > a:first-child");

        for (let i = 0; i < result.length; i++) {
            let msg = $(result[i]).text();
            list.push(msg);
        }

        res.render('search', { msg: '검색 결과', list: list });
    });
});

app.get('/dunfa', function (req, res) {
    res.render('dunfa', {});
});

app.post('/dunfa', function (req, res) {
    let word = req.body.word;
    console.log(word);
    let url = "http://dunfa.gondr.net/char/result?server=all&name=" + word;

    request(url, function (err, response, body) {
        let list = [];
        let servers = [];
        $ = cheerio.load(body);

        let result = $(".scroll .chars .char_name");

        for (let i = 0; i < result.length; i++) {
            let chars = $(result[i]).text();
            list.push(chars);
        }

        console.log(list);

        let result2 = $(".chars > img");

        for (let i = 0; i < result2.length; i++) {
            let server = $(result2[i]).attr("src");
            servers.push(server);
        }

        console.log(servers);

        res.render('dunfa', { msg: '검색 결과', list: list, server: servers });
    })

});

app.get('/lunch', function (req, res) {
    res.render('lunch', {});
});

app.post('/lunch', function (req, res) {
    let date = req.body.date;
    console.log(date);
    date = date.split("-").join("");

    const options = {

        url: 'http://y-y.hs.kr/lunch.view?date=' + date,
        headers: {
            'User-Agent': 'Mozilla/5.0'
        },
        encoding: null     //인코딩 값을 널로주어 별도의 인코딩을 하지 않게 한다.
    }

    request(options, function (err, response, body) {
        if (err != null) {
            console.log(err);
            return;
        }

        const enc = charset(response.headers, body);     //사이트의 인코딩을 알아냄. 급식페이지는 euc-kr 임
        const result = iconv.decode(body, enc);

        $ = cheerio.load(result);

        let menu = $(".menuName > span");

        res.render('lunch', { menu: menu.text() });
    })

});

app.get('/board', function (req, res) {

    let sql = "SELECT * FROM board WHERE title LIKE ? ORDER BY id DESC";

    let keyword = "%%";
    if (req.query.key != undefined) {
        keyword = "%" + req.query.key + "%";
    }

    conn.query(sql, [keyword], function (err, result) {

        res.render('board', { list: result });

    });
});

app.get('/board/write', function (req, res) {
    res.render('write', {});
})

app.post('/board/write', function (req, res) {
    let param = [req.body.title, req.body.content, req.body.writer];

    let sql = "INSERT INTO board (title, content, writer) VALUES(?, ?, ?)";
    conn.query(sql, param, function (err, result) {
        if (!err) {
            res.redirect('/board');
        }
    });
})

app.get('/melon', function (req, res) {

    let url = "https://www.melon.com/chart/";

    request(url, function (err, response, body) {

        let sql = "INSERT INTO melon (rank, imgsrc, musicName, singerName, parserDate, parserTime) VALUE(?, ?, ?, ?, curdate(), curtime())";

        let list3 = [];
        $ = cheerio.load(body);

        for (let i = 1; i <= 100; i++) {
            let result = $(".service_list_song > table > tbody tr:nth-child(" + i + ") .t_center .rank").text();
            let result2 = $(".service_list_song > table > tbody tr:nth-child(" + i + ") td:nth-child(4) a img").attr("src");
            let result3 = $(".service_list_song > table > tbody tr:nth-child(" + i + ") td:nth-child(6) .wrap .wrap_song_info .rank01 a").text();
            let result4 = $(".service_list_song > table > tbody tr:nth-child(" + i + ") td:nth-child(6) .wrap .wrap_song_info .rank02 > a").text();

            let list = [result, result2, result3, result4];

            conn.query(sql, list, function (err, result) {});

            let list2 = [result, result3, result4];

            list3[i - 1] = list2;

        }

        res.render('melon', { res: list3, msg: "멜론 top100" });

    });
    // , .service_list_song > table > tbody tr:nth-child(3) td:nth-child(6), .service_list_song > table > tbody tr:nth-child(3) td:nth-child(8)
});

app.get('/melonChart', function(req, res) {
    res.render('melonChart', {});
});

app.post('/melonChart', function(req, res) {

    let key = req.body.word + "%";
    console.log(key);

    let sql = "SELECT * FROM melon WHERE musicName LIKE ? ORDER BY rank, singerName, parserDate, parserTime";

    conn.query(sql, [key], function (err, result) {

        res.render('melonChart', { list: result, msg : "멜론차트 그래프" });

    });

});

let server = http.createServer(app);
server.listen(app.get('port'), function () {
    console.log(`Express 엔진이 ${app.get('port')}에서 실행중`);
});


