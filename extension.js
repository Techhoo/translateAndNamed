const axios = require("axios");
const { translate } = require("./googleapi/google");
const md5 = require("md5");
const vscode = require("vscode");
const appid = vscode.workspace.getConfiguration().get("translate.appid");
const secret = vscode.workspace.getConfiguration().get("translate.secret");
const window = vscode.window;
const commands = vscode.commands;
const StatusBarAlignment = vscode.StatusBarAlignment;
const status = window.createStatusBarItem(StatusBarAlignment.Left);
status.command = "extension.translate";


let isUserId = appid !== "20210101000660696";
isUserId = false
//用户id可以无缝展示 无需手动点击请求网络翻译
function activate(context) {
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(() => updateStatus())
  );
  context.subscriptions.push(
    commands.registerCommand("extension.translateAndNamed", () => {
      updateSelectedText();
    })
  );
  context.subscriptions.push(
    commands.registerCommand("extension.translate", async () => {
      let selectedText = getSelectedText();
      let showText = status.text.slice(12);
      if (status.text.endsWith("网络查询")) {
        showText = await netTranslate(selectedText, "zh");
        showText += "-----来自百度翻译";
      }
      window.showInformationMessage(showText);
    })
  );
}
/* 左侧底部bar的内容完美展示 */
async function updateStatus() {
  let selectedText = getSelectedText();
  //未选择文本时隐藏
  if (!selectedText) return status.hide();
  //检测选择文本类型  中英互译
  const to = /^\w+$/.test(selectedText) ? "zh" : "en";
  selectedText = to === "zh" ? selectedText.toLocaleLowerCase() : selectedText;
  //en->zh时,本地有数据则直接展示，没有才调用api
  if (to === "zh") {
    let localResult = searchLocal(ECDICT, selectedText);
    if (localResult) return showData(localResult);
    //是用户自己的appid并且未查到本地词典
    if (isUserId) {
      let showText = await netTranslate(selectedText, to);
      showData(showText);
      return;
    } else {
      //使用谷歌查询
      translate(selectedText, "en", "zh-CN")
        .then((val) => {
          console.log('使用google查询了');
          showData(val);
        })
        .catch((reason) => showData(reason));
    }
  }
  if (to === "en") {
    if (isUserId) {
      let showText = await netTranslate(selectedText, to);
      showData(showText);
    } else {
      //使用谷歌查询
      translate(selectedText, "en", "zh-CN")
        .then((val) => {
          showData(val);
        })
        .catch((reason) => showData(reason));
    }
  }
}

/* 底部展示 */
function showData(translatedText, icon = "$(megaphone)") {
  status.text = icon + "  " + translatedText;
  status.show();
}

/* 网络翻译 */
async function netTranslate(selectedText, to) {
  const { data } = await translate2(selectedText, "auto", to);
  if (data.hasOwnProperty("error_code")) {
    return showApiError(data["error_code"]);
  } else {
    return data.trans_result[0].dst;
  }
}

/* 百度翻译api对应的错误码展示 */
const errorCodeObj = {
  10000: "查询长字符串,请在插件配置项配置自己的百度翻译appid",
  52001: "请求超时...",
  52003: "请检查您自定义的appid是否正确",
  54003: "服务器繁忙,请稍后再试",
  54005: "请降低长query的发送频率，3s后再试",
};
function showApiError(errorCode) {
  return errorCodeObj[errorCode];
}

/* named */
async function updateSelectedText() {
  const currentEditor = vscode.window.activeTextEditor;
  let selectedText = getSelectedText();
  //只对中文进行命名操作  简单正则判断下
  if (/^\w+$/.test(selectedText)) return;
  status.text = `网络请求中...`;
  status.show();
  const { data } = await translate2(selectedText, "zh", "en");
  if (data.hasOwnProperty("error_code"))
    return showData(showApiError(data["error_code"]));
  const translatedText = data.trans_result[0].dst;
  status.text = translatedText;
  const namedText = await worldSplit(translatedText, selectedText);
  //防止点其他地方取消
  if (!getSelectedText()) return;
  currentEditor.edit((editBuilder) => {
    editBuilder.replace(currentEditor.selection, namedText);
  });
}

/* 单词分割拼接 */
async function worldSplit(translatedText, selectedText) {
  // 基于空格分割
  const list = translatedText.split(" ");
  if (list.length > 1) {
    const arr = [];
    // 小驼峰
    arr.push(
      list
        .map((v, i) => {
          if (i !== 0) {
            return v.charAt(0).toLocaleUpperCase() + v.slice(1);
          }
          return v.toLocaleLowerCase();
        })
        .join("")
    );
    // 大驼峰
    arr.push(
      list.map((v) => v.charAt(0).toLocaleUpperCase() + v.slice(1)).join("")
    );
    // 下划线连接
    arr.push(list.map((v) => v.toLocaleLowerCase()).join("_"));
    // - 号连接
    arr.push(list.map((v) => v.toLocaleLowerCase()).join("-"));
    selectWord = await vscode.window.showQuickPick(arr, {
      placeHolder: "请选择要替换的变量名",
    });
  } else {
    selectWord = list[0];
  }
  //未翻译时 保留原内容
  return selectWord ? selectWord : selectedText;
}

/* 获取选中文本 */
function getSelectedText() {
  const currentEditor = vscode.window.activeTextEditor;
  if (!currentEditor) return;
  const currentSelect = currentEditor.document.getText(currentEditor.selection);
  if (!currentSelect) return;
  return currentSelect.trim();
}

/* 请求api */
function translate2(q, from, to) {
  //没有使用自己appid的,进行查询长度限定
  if (q.length > 30 && !isUserId) {
    return Promise.resolve({ data: { error_code: 10000 } });
  }
  var salt = Math.random();
  return axios({
    method: "get",
    url: "https://fanyi-api.baidu.com/api/trans/vip/translate",
    params: {
      q,
      appid,
      from,
      to,
      salt,
      sign: md5(appid + q + salt + secret),
    },
  });
}

/* 本地搜索 */
let ECDICT = {};
for (let i = 0; i < 16; i++) {
  let data = require("./dict/dict" + i).data;
  for (let key in data) {
    ECDICT[key] = data[key];
  }
}
function searchLocal(ECDICT, selectedText) {
  return ECDICT[selectedText] && ECDICT[selectedText].replace(/\\n/g, " ");
}

exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
