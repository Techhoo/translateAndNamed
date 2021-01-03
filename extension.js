const axios = require("axios");
const md5 = require("md5");
const vscode = require("vscode");
const appid = vscode.workspace.getConfiguration().get("translate.appid");
const secret = vscode.workspace.getConfiguration().get("translate.secret");
const window = vscode.window;
const commands = vscode.commands;
const StatusBarAlignment = vscode.StatusBarAlignment;
const status = window.createStatusBarItem(StatusBarAlignment.Left);
status.command = "extension.translateAndNamed";


function activate(context) {
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(() => updateStatus())
  );
  context.subscriptions.push(
    commands.registerCommand("extension.translateAndNamed", () => {
      updateSelectedText();
    })
  );
}


/* 底部bar的内容展示 */
async function updateStatus() {
  let selectedText = getSelectedText();
  //未选择文本时隐藏
  if (!selectedText) return status.hide();
  //检测选择文本类型  中英互译
  const to = /^\w+$/.test(selectedText) ? "zh" : "en";
  selectedText =  to === 'zh' ? selectedText.toLocaleLowerCase() : selectedText;
  //本地有数据则直接展示，不调用api
  const localResult = searchLocal(ECDICT, selectedText);
  if (localResult) return showData(localResult);
  //调用api查询
  const { data } = await translate(selectedText, "auto", to);
  if (data.hasOwnProperty("error_code")) return showData(showApiError(data['error_code']));
  const translatedText = data.trans_result[0].dst;
  showData(translatedText);
}

/* 底部展示 */
function showData(translatedText) {
  status.text = "$(megaphone) " + translatedText;
  status.show();
}

/* 百度翻译api对应的错误码展示 */
const errorCodeObj = {
  '52001': "请求超时...",
  '52003': "请检查您自定义的appid是否正确",
  '54003': "服务器繁忙,请稍后再试",
  '54005': "请降低长query的发送频率，3s后再试",
};
function showApiError(errorCode){
  return errorCodeObj[errorCode]
}

/* named */
async function updateSelectedText() {
  const currentEditor = vscode.window.activeTextEditor;
  let selectedText = getSelectedText();
  //只对中文进行命名操作  简单正则判断下
  if (/^\w+$/.test(selectedText)) return;
  const { data } = await translate(selectedText, "zh", "en");
  if (data.hasOwnProperty("error_code")) return showData(showApiError(data['error_code']));
  const translatedText = data.trans_result[0].dst;
  const namedText = await worldSplit(translatedText, selectedText);
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
function translate(q, from, to) {
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
  console.log(selectedText);
  return ECDICT[selectedText] && ECDICT[selectedText].replace(/\\n/g, ' ');
}


exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
