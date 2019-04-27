const request = require('request');
const cheerio = require('cheerio');

const options = {

    url: 'http://y-y.hs.kr/lunch.view?date=20190429',
    headers: {
        'User-Agent' : 'Mozilla/5.0',
        'Content-Type' : 'text/html; charset=utf-8'
    },
}

request(options, function(err, res, body) {
    if(err != null) {
        console.log(err);
        return;
    }

    console.log(body);
    $ = cheerio.load(body);

    let menu = $(".menuName > span");

    console.log(menu);
    console.log(menu.text());
})