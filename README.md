# 翻译and命名

# 功能

+ 选中词语会自动进行翻译，翻译结果在底部状态栏左侧

+ 选中 中文 文本时，右键选择中文翻译成变量名或者快捷键<kbd>ctrl+m</kbd> 进行变量命名，你也可以点击左下角的翻译结果进行设置变量名

  ![example.gif](https://i.loli.net/2021/01/03/lf8uG9Xq6rCcS47.gif)



**注意**：目前，由于百度api的使用次数和并发数限制。在需要联网查询的地方还需要手动点击查询。

想要像上图一样无感切换本地和联网请求需要在该插件的扩展设置中配置自己申请的百度翻译appid和secret。 

申请链接：https://fanyi-api.baidu.com/product/11 

申请个人版本即可，不需要认证 而且 免费

## 0.0.3

- 用户自定义配置百度翻译appid，未配置的用户在联网查询时需要手动点击，配置用户无感切换
- 命名快捷键变为ctrl+n

## 0.0.2

- 新增本地查询，英译中时，先在本地词典查询。未查询到结果在进行联网查询。

## 0.0.1

- 中英文翻译
- 中文翻译成英文变量（支持小驼峰，帕斯卡(大驼峰)，下划线，中划线命名）

# 使用

- 如需进行翻译，选中文本即可在左下角看到翻译结果

- 如需变量命名，需选中对应的 中文 文本，然后使用下面三种方式之一进行命名
  	
   + 右键选择  中文翻译成变量名
   
   + 快捷键  ctrl+m 进行变量命名
   
   + 点击左下角的翻译结果进行设置变量名
