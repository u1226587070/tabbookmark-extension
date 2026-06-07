# TabBookmark Switcher

在页面上显示书签栏浮层，键盘全控制。

## 快捷键（需手动绑定）

| 命令 | 按键 | 功能 |
|---|---|---|
| toggle-overlay | `Ctrl+Shift+Space` | 显示/隐藏书签浮层 |
| nav-left | `Ctrl+Shift+,` | 上一个书签 |
| nav-right | `Ctrl+Shift+.` | 下一个书签 |
| nav-open | `Ctrl+Shift+Enter` | 打开当前高亮的书签 |

浮层打开后：`1~9` 直接跳转 · `← →` 移动 · `Enter` 打开 · `Esc` 关闭

## 安装

- 下载 zip 解压，或 `git clone` 本仓库
- 打开 `edge://extensions/` → 开发人员模式 → 加载解压缩的扩展
- 打开 `edge://extensions/shortcuts` 绑定 4 个快捷键

## 更新

```bash
cd tabbookmark-extension
git pull
```
然后在 `edge://extensions/` 点刷新按钮。
