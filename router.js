const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const qs = require('querystring');
const mysql = require('mysql');
const iconv = require('iconv-lite');    //인코딩 변환도구
const charset = require('charset');

const router = express.Router();

const dbinfo = require('./dbinfo.js');
const Top20 = require('./mymodules/Top20');
const Lunch = require('./mymodules/lunch');
const datalab = require('./mymodules/NaverData');

/* mysql 연결부분 */
const conn = mysql.createConnection(dbinfo);

conn.query("USE yy_30203"); //yy_30203 데이터베이스 사용

router.get('/', function (req, res) {
    res.render('main', { msg: 'Welcome To Express4' });
});

router.get('/top20', function (req, res) {

    Top20(function (list) {

        res.render('top', { msg: '네이버 실시간 급상승 검색어', list: list });

    });  //비동기

});


router.get('/search', function (req, res) {
    res.render('search', {});
});

router.post('/search', function (req, res) {
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

router.get('/dunfa', function (req, res) {
    res.render('dunfa', {});
});

router.post('/dunfa', function (req, res) {
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

router.get('/lunch', function (req, res) {
    res.render('lunch', {});
});

router.post('/lunch', function (req, res) {

    Lunch(req.body.date, function (menu) {
        res.render('lunch', { menu: menu.text() });
    });


});

router.get('/board', function (req, res) {

    let sql = "SELECT * FROM board WHERE title LIKE ? ORDER BY id DESC";

    let keyword = "%%";
    if (req.query.key != undefined) {
        keyword = "%" + req.query.key + "%";
    }

    conn.query(sql, [keyword], function (err, result) {

        res.render('board', { list: result });

    });
});

router.get('/board/write', function (req, res) {
    res.render('write', {});
})

router.post('/board/write', function (req, res) {
    let param = [req.body.title, req.body.content, req.body.writer];

    let sql = "INSERT INTO board (title, content, writer) VALUES(?, ?, ?)";
    conn.query(sql, param, function (err, result) {
        if (!err) {
            res.redirect('/board');
        }
    });
})

router.get('/melon', function (req, res) {

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

            conn.query(sql, list, function (err, result) { });

            let list2 = [result, result3, result4];

            list3[i - 1] = list2;

        }

        res.render('melon', { res: list3, msg: "멜론 top100" });

    });
    // , .service_list_song > table > tbody tr:nth-child(3) td:nth-child(6), .service_list_song > table > tbody tr:nth-child(3) td:nth-child(8)
});

router.get('/melonChart', function (req, res) {
    res.render('melonChart', {});
});

router.post('/melonChart', function (req, res) {

    let key = req.body.word + "%";
    console.log(key);

    let sql = "SELECT * FROM melon WHERE musicName LIKE ? ORDER BY singerName, parserDate, parserTime";

    conn.query(sql, [key], function (err, result) {

        res.render('melonChart', { list: result, msg: "멜론차트 그래프" });

    });

});
router.get("/datalab2", function (req, res) {
    let data = [
        { "groupName": "가수", "keywords": ["이수", "엠씨더맥스"] },
        { "groupName": "걸그룹", "keywords": ["트와이스", "Twice", "아이즈원", "IzOne"] }
    ]

    datalab("2019-02-01", "2019-04-30", "week", data, function (result) {
        let colors = ["rgb(255, 192, 192)", "rgb(75, 192, 192)", "rgb(75, 192, 100)"];

        let gData = { "labels": [], "datasets": [] };
        console.log(result);
        let r = result.results;

        for (let i = 0; i < r.length; i++) {
            let item = {
                "label": r[i].title,
                "borderColor": colors[i],
                "fill": false,
                "lineTension": 0.2,
                "data": []
            };

            for (let j = 0; j < r[i].data.length; j++) {
                item.data.push(r[i].data[j].ratio);

                if (i == 0) {
                    let date = r[i].data[j].period;
                    let arr = date.split("-");
                    gData.labels.push(arr[1] + arr[2]);
                }
            }

            gData.datasets.push(item);
        }

        console.log(gData);

        res.render('datalab2', { g: gData });
    });
});

router.post("/datalab2", function (req, res) {

    let key = req.body.word;
    console.log(key);
    let keywords = req.body.wordTag.split(",");
    console.log(keywords);

    let key2 = req.body.word2;
    console.log(key2);
    let keywords2 = req.body.wordTag2.split(",");
    console.log(keywords2.length);

    let data;

    if (key2 == '' || keywords2[0] == '') {
        data = [
            { "groupName": key, "keywords": keywords }
        ]
    } else {
        data = [
            { "groupName": key, "keywords": keywords },
            { "groupName": key2, "keywords": keywords2 }
        ]
    }

    datalab("2019-02-01", "2019-04-30", "week", data, function (result) {
        let colors = ["rgb(255, 192, 192)", "rgb(75, 192, 192)", "rgb(75, 192, 100)"];

        let gData = { "labels": [], "datasets": [] };
        let r = result.results;

        for (let i = 0; i < r.length; i++) {
            let item = {
                "label": r[i].title,
                "borderColor": colors[i],
                "fill": false,
                "lineTension": 0.2,
                "data": []
            };

            for (let j = 0; j < r[i].data.length; j++) {
                item.data.push(r[i].data[j].ratio);

                if (i == 0) {
                    let date = r[i].data[j].period;
                    let arr = date.split("-");
                    gData.labels.push(arr[1] + arr[2]);
                }
            }

            gData.datasets.push(item);
        }

        console.log(gData);

        res.render('datalab2', { g: gData });
    });
});

module.exports = router;