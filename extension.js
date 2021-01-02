const axios = require("axios");
const md5 = require("md5");
const vscode = require("vscode");
const appid = vscode.workspace.getConfiguration().get("translate.appid");
const secret = vscode.workspace.getConfiguration().get("translate.secret");
function activate(context) {
  const window = vscode.window;
  const StatusBarAlignment = vscode.StatusBarAlignment;
  const commands = vscode.commands;

  const status = window.createStatusBarItem(StatusBarAlignment.Left);
  status.command = "extension.translateAndNamed";
  // context.subscriptions.push(status);
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(() => updateStatus(status))
  );

  context.subscriptions.push(
    commands.registerCommand("extension.translateAndNamed", () => {
      updateSelectedText();
    })
  );
}

//底部bar的内容展示
async function updateStatus(status) {
  const selectedText = getSelectedText();
  if (!selectedText) return status.hide();
  const to = /^\w+$/.test(selectedText) ? "zh" : "en";
  const { data } = await translate(selectedText, "auto", to);
  if (data.hasOwnProperty("error_code"))
    return (status.text = "$(megaphone) " + "查询错误/(ㄒoㄒ)/~~");
  const translatedText = data.trans_result[0].dst;
  status.text = "$(megaphone) " + translatedText;
  status.show();
}

//named
async function updateSelectedText() {
  const currentEditor = vscode.window.activeTextEditor;
  let selectedText = getSelectedText();
  //只对中文进行命名操作
  if (/^\w+$/.test(selectedText)) return;
  const { data } = await translate(selectedText, "zh", "en");
  if (data.hasOwnProperty("error_code")) return;
  const translatedText = data.trans_result[0].dst;
  const namedText = await worldSplit(translatedText, selectedText);
  currentEditor.edit((editBuilder) => {
    editBuilder.replace(currentEditor.selection, namedText);
  });
}

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

function getSelectedText() {
  const currentEditor = vscode.window.activeTextEditor;
  if (!currentEditor) return;
  const currentSelect = currentEditor.document.getText(currentEditor.selection);
  if (!currentSelect) return;
  return currentSelect;
}

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

exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
