const querystring = require("querystring");
const axios = require("axios");
const GoogleToken = require("./googletoken.js");
const tld = "cn";
async function translate (content, from, to) {
  let token = await GoogleToken.get(content, tld);
  let url = "https://translate.google." + tld + "/translate_a/single";
  let data = {
    client: "gtx",
    sl: from,
    tl: to,
    hl: to,
    dt: ["at", "bd", "ex", "ld", "md", "qca", "rw", "rm", "ss", "t"],
    ie: "UTF-8",
    oe: "UTF-8",
    otf: 1,
    ssel: 0,
    tsel: 0,
    kc: 7,
    q: content,
  };
  data[token.name] = token.value;
  url = url + "?" + querystring.stringify(data);
  let res = await axios({
    url: url,
    methods: 'get',
    json: true,
    timeout: 10000,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36",
    },
  });

  //暂时这样能拿到数据
  console.log('进入goole查询了');
  return res.data[0][0][0] ? res.data[0][0][0] : Promise.reject('翻译失败');
}

module.exports.translate = translate;












  // let sentences = res[0];
  // if (!sentences || !(sentences instanceof Array)) {
  //     return '';
  // }
  // let result = sentences
  //     .map(([trans]) => {
  //         if (trans) {
  //             return trans.replace(/((\/|\*|-) )/g, '$2');
  //         }
  //     })
  //     .join('');
  // return result;


