var default_toolbar = [];

var toolbarDefaultLayout = [
    "fullscreen", "|", "undo", "redo", "|",
    "bold", "italic", "strikethrough", "code", "quote", "unorderedList", "orderedList", "|",
    "headingSmaller", "headingBigger", "cleanBlock", "link", "image", "table", "horizontalRule", "|",
    "fontsizeBigger", "fontsizeSmaller", "|",
    "preview", "sideBySide", "previewScrollLock", "|", "guide"
];

var toolbarBuiltInButtons = {
    "bold": {
        name: "bold",
        action: "toggleBold",
        className: "fa fa-bold",
        title: "Bold",
        toggle: true
    },
    "italic": {
        name: "italic",
        action: "toggleItalic",
        className: "fa fa-italic",
        title: "Italic",
        toggle: true
    },
    "strikethrough": {
        name: "strikethrough",
        action: "toggleStrikethrough",
        className: "fa fa-strikethrough",
        title: "StrikeThrough",
        toggle: true
    },
    "headingSmaller": {
        name: "headingSmaller",
        action: "toggleHeadingSmaller",
        className: "fa fa-header tmd-superscript-down",
        title: "Smaller Heading",
        toggle: false
    },
    "headingBigger": {
        name: "headingBigger",
        action: "toggleHeadingBigger",
        className: "fa fa-header tmd-superscript-up",
        title: "Bigger Heading",
        toggle: false
    },
    "code": {
        name: "code",
        action: "toggleCodeBlock",
        className: "fa fa-code",
        title: "Code",
        toggle: false
    },
    "quote": {
        name: "quote",
        action: "toggleBlockquote",
        className: "fa fa-quote-left",
        title: "Quote",
        toggle: true
    },
    "unorderedList": {
        name: "unorderedList",
        action: "toggleUnorderedList",
        className: "fa fa-list-ul",
        title: "Generic List",
        toggle: true
    },
    "orderedList": {
        name: "orderedList",
        action: "toggleOrderedList",
        className: "fa fa-list-ol",
        title: "Numbered List",
        toggle: true
    },
    "cleanBlock": {
        name: "cleanBlock",
        action: "cleanBlock",
        className: "fa fa-eraser fa-clean-block",
        title: "Clean block",
        toggle: false
    },
    "link": {
        name: "link",
        action: "drawLink",
        className: "fa fa-link",
        title: "Create Link",
        toggle: false
    },
    "image": {
        name: "image",
        action: "drawImage",
        className: "fa fa-picture-o",
        title: "Insert Image",
        toggle: false
    },
    "table": {
        name: "table",
        action: "drawTable",
        className: "fa fa-table",
        title: "Insert Table",
        toggle: false
    },
    "horizontalRule": {
        name: "horizontalRule",
        action: "drawHorizontalRule",
        className: "fa fa-minus",
        title: "Insert Horizontal Line",
        toggle: false
    },
    "preview": {
        name: "preview",
        action: "togglePreview",
        className: "fa fa-eye no-disable",
        title: "Toggle Preview",
        toggle: true
    },
    "sideBySide": {
        name: "sideBySide",
        action: "toggleSideBySide",
        className: "fa fa-columns no-disable no-mobile",
        title: "Toggle Side by Side",
        toggle: true
    },
    "fullscreen": {
        name: "fullscreen",
        action: "toggleFullScreen",
        className: "fa fa-arrows-alt no-disable no-mobile",
        title: "Toggle Fullscreen",
        toggle: true
    },
    "guide": {
        name: "guide",
        action: "https://simplemde.com/markdown-guide",
        className: "fa fa-question-circle",
        title: "Markdown Guide",
        toggle: false
    },
    "undo": {
        name: "undo",
        action: "undo",
        className: "fa fa-undo no-disable",
        title: "Undo",
        toggle: false
    },
    "redo": {
        name: "redo",
        action: "redo",
        className: "fa fa-repeat no-disable",
        title: "Redo",
        toggle: false
    },
    "fontsizeBigger": {
        name: "fontsizeBigger",
        action: "toggleFontsizeBigger",
        className: "fa fa-font tmd-superscript-up",
        title: "Bigger Text in Editor",
        toggle: false
    },
    "fontsizeSmaller": {
        name: "fontsizeSmaller",
        action: "toggleFontsizeSmaller",
        className: "fa fa-font tmd-superscript-down",
        title: "Smaller Text in Editor",
        toggle: false
    },
    "previewScrollLock": {
        name: "previewScrollLock",
        action: "toggleScrollLock",
        className: "fa fa-lock",
        title: "Scroll Lock between Editor and Preview",
        toggle: true
    }
};

var defaultShortcuts = {
    "toggleBold": "Cmd-B",
    "toggleItalic": "Cmd-I",
    "drawLink": "Cmd-K",
    "toggleHeadingSmaller": "Cmd-H",
    "toggleHeadingBigger": "Shift-Cmd-H",
    "cleanBlock": "Cmd-E",
    "drawImage": "Cmd-Alt-I",
    "toggleBlockquote": "Cmd-'",
    "toggleOrderedList": "Cmd-Alt-L",
    "toggleUnorderedList": "Cmd-L",
    "toggleCodeBlock": "Cmd-Alt-C",
    "togglePreview": "Cmd-P",
    "toggleSideBySide": "F9",
    "toggleFullScreen": "F11"
};

/**
 * Parse and initialize editor options.
 * @param {TMdEditor} editor
 * @param {Object} options
 */
function TMdOptions(editor, options) {
    // Default to enable toolbar
    if (typeof (options.toolbarEnable) === "undefined") {
        this.toolbarEnable = true;
    } else {
        this.toolbarEnable = options.toolbarEnable;
    }

    // Default to enable status bar
    if (typeof (options.statusbarEnable) === "undefined") {
        this.statusbarEnable = true;
    } else {
        this.statusbarEnable = options.statusbarEnable;
    }

    // If toolbar buttons not defined, use default buttons list
    if (!options.toolbarButtons) {
        this.toolbarButtons = toolbarBuiltInButtons;
    } else {
        this.toolbarButtons = options.toolbarButtons;
    }
    
    // If toolbar layout not defined, use default layout
    // Note: Checking of validity of toolbars are left to TmdToolbar Class.
    if (!options.toolbarLayout) {
        this.toolbarLayout = toolbarDefaultLayout;
    } else {
        this.toolbarLayout = options.toolbarLayout;
    }

    // Shortcut
    if (!options.shortcuts) {
        this.shortcuts = defaultShortcuts;
    } else {
        this.shortcuts = options.shortcuts;
    }

    // Add additional custom functions to the editor
    if (!options.editorFunctions) {
        this.editorFunctions = {}
    } else {
        this.editorFunctions = options.editorFunctions;
    }

    // Initial Condition of preview and full-screen mode
    if (typeof (options.sideBySide) === "undefined") {
        this.sideBySide = true;
    } else {
        this.sideBySide = options.sideBySide;
    }

    // Pick the mode for full-screen render
    if (typeof (options.fullScreenModal) === "undefined") {
        this.fullScreenModal = true;
    } else {
        this.fullScreenModal = options.fullScreenModal;
    }

    if (!options.fullscreen) {
        this.fullscreen = false;
    } else {
        this.fullscreen = true;
    }

    if (typeof (options.scrollLock) === "undefined") {
        this.scrollLock = true;
    } else {
        this.scrollLock = options.scrollLock;
    }
}

module.exports = TMdOptions;