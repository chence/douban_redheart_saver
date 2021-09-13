const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const chrome_cookies = require('chrome-cookies-secure');
const shell = require('shelljs');

const _get_douban_cookie = () => {
    const cookie = ""; // 可以自己去浏览器复制一个cookie
    const uri = "https://fm.douban.com/mine/hearts";
    return new Promise((resolve, reject) => {
        if(cookie) {
            resolve(cookie);
        } else {
            chrome_cookies.getCookies(uri, "header", (err, cookies) =>{
                if(err) {
                    reject(err);
                } else {
                    resolve(cookies);
                }
            });
        }
    });
}

const _exec_cmd = (cmd, options={}) => {
    return shell.exec(cmd, Object.assign({}, {
        async: false,
        silent: true
    }, options));
}

const get_basic = async () => {
    const cookie = await _get_douban_cookie();
    const cmd = `
        curl 'https://fm.douban.com/j/v2/redheart/basic?updated_time=2021-09-13+11%3A14%3A19' \
          -H 'Connection: keep-alive' \
          -H 'Pragma: no-cache' \
          -H 'Cache-Control: no-cache' \
          -H 'sec-ch-ua: "Google Chrome";v="93", " Not;A Brand";v="99", "Chromium";v="93"' \
          -H 'Accept: text/javascript, text/html, application/xml, text/xml, */*' \
          -H 'Content-Type: application/x-www-form-urlencoded' \
          -H 'X-Requested-With: XMLHttpRequest' \
          -H 'sec-ch-ua-mobile: ?0' \
          -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36' \
          -H 'sec-ch-ua-platform: "macOS"' \
          -H 'Sec-Fetch-Site: same-origin' \
          -H 'Sec-Fetch-Mode: cors' \
          -H 'Sec-Fetch-Dest: empty' \
          -H 'Referer: https://fm.douban.com/mine/hearts' \
          -H 'Accept-Language: zh-CN,zh;q=0.9,en;q=0.8' \
          -H 'Cookie: ${cookie}' \
          --compressed
    `;
    return _exec_cmd(cmd);
}

const get_songs = async (ids) => {
    const cookie = await _get_douban_cookie();
    const cmd = `
        curl 'https://fm.douban.com/j/v2/redheart/songs' \
          -H 'Connection: keep-alive' \
          -H 'Pragma: no-cache' \
          -H 'Cache-Control: no-cache' \
          -H 'sec-ch-ua: "Google Chrome";v="93", " Not;A Brand";v="99", "Chromium";v="93"' \
          -H 'Accept: text/javascript, text/html, application/xml, text/xml, */*' \
          -H 'Content-Type: application/x-www-form-urlencoded' \
          -H 'X-Requested-With: XMLHttpRequest' \
          -H 'sec-ch-ua-mobile: ?0' \
          -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36' \
          -H 'sec-ch-ua-platform: "macOS"' \
          -H 'Origin: https://fm.douban.com' \
          -H 'Sec-Fetch-Site: same-origin' \
          -H 'Sec-Fetch-Mode: cors' \
          -H 'Sec-Fetch-Dest: empty' \
          -H 'Referer: https://fm.douban.com/mine/hearts' \
          -H 'Accept-Language: zh-CN,zh;q=0.9,en;q=0.8' \
          -H 'Cookie: ${cookie}'  \
          --data-raw 'sids=${ ids.join("%7C") }&kbps=128&ck=GG2l' \
          --compressed
    `;
    return _exec_cmd(cmd);
}

const main = async () => {
    const basic_result = await get_basic();
    const basic = JSON.parse(basic_result);
    const chunk_size = 20;
    const ids = basic.songs.map(s => s.sid);

    await Promise.each(_.chunk(ids, chunk_size), async (chunk_items, index) => {
        const result = await get_songs(chunk_items);
        const items = JSON.parse(result);
        items.forEach(i => {
            console.log(`wget "${i.url}" -O "${i.artist}-${i.title}.${i.file_ext}"`);
        });
        await Promise.delay(100);
    });
}

;(async() => {
    try {
        await main();
    } catch (e) {
        console.error(e);
    }
})();
