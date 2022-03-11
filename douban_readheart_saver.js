const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const chrome_cookies = require('chrome-cookies-secure');
const shell = require('shelljs');

const _get_douban_cookie = () => {
    const cookie = ""; // 可以自己去浏览器复制一个cookie
    return new Promise((resolve, reject) => {
        if(cookie) {
            resolve(cookie);
        } else {
            const uri = "https://fm.douban.com/mine/hearts";
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
    return new Promise((resolve, reject) => {
        shell.exec(cmd, Object.assign({}, {
            async: true,
            silent: true
        }, options), (code, stdout, stderr) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(stderr);
            }
        });
    });
}

const get_basic = async () => {
    const cookie = await _get_douban_cookie();
    const cmd = `
        curl 'https://fm.douban.com/j/v2/redheart/basic' \
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
          --data-raw 'sids=${ ids.join("%7C") }&kbps=192&ck=0PXE' \
          --compressed
    `;
    return _exec_cmd(cmd);
}

const main = async () => {
    const basic_result = await get_basic();
    const basic = JSON.parse(basic_result);
    const chunk_size = 20;
    const ids = basic.songs.map(s => s.sid);

    let cmds = [];
    let count = 0;
    await Promise.each(_.chunk(ids, chunk_size), async (chunk_items, index) => {
        const result = await get_songs(chunk_items);
        const items = JSON.parse(result);

        items.forEach(i => {
            const cmd = `wget "${i.url}" -O "./download/${_.padStart(++count, 4, 0)}-${i.artist}-${i.title.replace(/"/g, "\\\"").replace(/`/g, "\\\`").replace(/\//g, "\\\/")}.${i.file_ext}"`;
            console.log(cmd);
            cmds.push(cmds);
        });
        await Promise.delay(_.random(1000,5000));
    });

    // await Promise.map(cmds, async cmd => {
    //     console.log(cmd);
    //     return _exec_cmd(cmd);
    // }, {concurrency: 50});

}

;(async() => {
    try {
        await main();
    } catch (e) {
        console.error(e);
    }
})();
