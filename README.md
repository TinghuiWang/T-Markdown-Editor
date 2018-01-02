# T-Markdwon-Editor (TMdEditor)

TMdEditor is a javascript markdown editor designed to be used in webpages to
render textarea for easy editing.
The project started with the source code of [SimpleMDE](https://simplemde.com/).
A few improvements have been made so that I would like to share the source codes
under a new name.

## Features

- Support CommonMark and Github-flavored Markdown(GFM).
- Fast real-time preview with markdown-it.
- Scroll sync between editor and preview with external loaded images.
- Styled with Bootstrap 4.
- Support TeX mathematic equations (using Katex library).
- Configurable toolbar and status bar.
- Callback support for image upload function.
- Editor text resize for accessibility.
- Additional packages for CodeMirror and Markdown-it can be loaded for feature extension.

## Dependency

### Javascript dependency
- [CodeMirror](https://codemirror.net/)
- [Markdown-it](https://github.com/markdown-it/markdown-it)
- [Markdown-it-source-map](https://github.com/tylingsoft/markdown-it-source-map)
- [Markdown-it-footnote](https://github.com/markdown-it/markdown-it-footnote)
- [Markdown-it-highlightjs](https://github.com/valeriangalliat/markdown-it-highlightjs)
- [Markdown-it-texmath](https://github.com/goessner/markdown-it-texmath)
- [Markdown-it-container](https://github.com/markdown-it/markdown-it-container)
- [Markdown-it-multimd-table](https://github.com/RedBug312/markdown-it-multimd-table)
- [Markdown-it-attrs](https://github.com/arve0/markdown-it-attrs)
- [Markdown-it-mark](https://github.com/markdown-it/markdown-it-mark)
- [katex](https://github.com/Khan/KaTeX)

### CSS Style dependency

- [Bootstrap 4](https://getbootstrap.com/)
- [Material Design for Bootstrap 4](https://mdbootstrap.com/)
- [Font Awesome](http://fontawesome.io/)
- CodeMirror github theme from [code-mirror-themes](https://github.com/FarhadG/code-mirror-themes)

## Useage

### Basic Useage

```javascript
new TMdEditor(document.getElementById("markdownTextEditor"), {}, "");
```

### Configuration

- **toolbarLayout**: Array of strings representing the layout of toolbar buttons.
  The strings within the array should corresponds to the keys in ``toolbarButtons``
  dictionary or ``|`` to insert a separator.
  The default layout is
```javascript
  options.toolbarLayout = [
    "fullscreen", "|", "undo", "redo", "|",
    "bold", "italic", "strikethrough", "code", "quote", "unorderedList", "orderedList", "|",
    "headingSmaller", "headingBigger", "cleanBlock", "link", "image", "table", "horizontalRule", "|",
    "fontsizeBigger", "fontsizeSmaller", "|",
    "preview", "sideBySide", "previewScrollLock", "|", "guide"
  ];
```

- **toolbarButtons**: Array of toolbar buttons indexed by the name.
  Each button is described as an object with following keys:
  
  - *name*: name of the toolbar button.
  - *action*: name of the action when button is clicked.
  - *className*: class name when the button is rendered. e.g. ``fa fa-bold`` for toggling selected text bold.
  - *title*: string to be rendered in tool-tip.
  - *toggle*: if ``true``, the button is rendered as a toggle button.  

  The default array of toolbar buttons can be found in class ``TMdToolbar`` in file ``_toolbar.js``.

- **toolbarEnable**: If ``true``, the toolbar is rendered at the top of the editor area. Default to ``true``.

- **statusbarEnable**: If ``true``, the status bar is rendered at the bottom of the editor. Default to ``true``.

- **editorFunctions**: Additional editor functions to be added.
  This option is an object indexed by the name of the editor function and the function itself as values.
  The function should take the TMdEditor object as parameter. 
