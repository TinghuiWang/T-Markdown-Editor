"use strict";

var platform = require('./_platform');

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
        action: "togglePreviewScrollLock",
        className: "fa fa-lock",
        title: "Scroll Lock between Editor and Preview",
        toggle: true
    }
};

var toolbarDefaultLayout = [
    "undo", "redo", "|",
    "bold", "italic", "strikethrough", "code", "quote", "unorderedList", "orderedList", "|",
    "headingSmaller", "headingBigger", "cleanBlock", "link", "image", "table", "horizontalRule", "|",
    "fontsizeBigger", "fontsizeSmaller", "|",
    "preview", "sideBySide", "fullscreen", "previewScrollLock", "|", "guide"
];

/**
 * @typedef {Object} TMdToolbarButton
 * @property {string} name the name of the button
 * @property {string} className the class name to render the button
 * @property {string} title the title of the button
 * @property {string} action the name of action the button executes.
 */

/**
 * @typedef {Object} TMdToolbarOptions
 * @property {Object.<string, TMdToolbarButton>} buttons
 * @property {Object.<string, Function>} bindings
 * @property {Array.<string>} layout
 */


/**
 * @param {TMdEditor} editor
 * @param {TMdToolbarOptions} options
 * @returns {TMdToolbar}
 */
function TMdToolbar(editor, options) {
    if (typeof editor === "undefined") {
        console.error("TMdToolbar needs a TMdEditor instance to populate the toolbar");
        return;
    }

    this.editor = editor;

    var i;

    if (typeof options === "undefined")
        options = {}

    // Validate options
    if (!options.buttons) {
        options.buttons = toolbarBuiltInButtons;
    }

    // Check and create custom binding
    options.bindings = {}
    for (var key in options.buttons) {
        var actionName = options.buttons[key].action;
        if (typeof actionName === "undefined") continue;
        if (this.editor[actionName]) {
            options.bindings[actionName] = this.editor[actionName];
        } else {
            delete options.buttons[key];
        }
    }

    // Check options layout
    if (!options.layout) {
        options.layout = toolbarDefaultLayout;
    }
    for (i = options.layout.length - 1; i >= 0; i--) {
        if (options.layout[i] !== '|' && !options.buttons[options.layout[i]]) {
            options.layout.splice(i, 1);
        }
    }

    // Check shortcut options
    if (!options.shortcuts) {
        options.shortcuts = {};
    }

    this.options = options;
}

/** Toolbar rendering function */
TMdToolbar.prototype.render = function () {
    var editor = this.editor;

    function createSeparator() {
        var element = document.createElement('i');
        element.className = "tmd-separator";
        element.innerHTML = "|";
        return element;
    }

    function createIcon(iconClass, tooltip, toggle, action) {
        if (!tooltip || typeof tooltip === "undefined") {
            tooltip = "";
        }

        if (typeof toggle === "undefined") {
            toggle = false;
        }

        var element = document.createElement('div');
        element.setAttribute("data-toogle", "tooltips");
        element.setAttribute("data-placement", "bottom");
        element.setAttribute("title", tooltip);

        var btnElement = document.createElement('button');
        btnElement.className = "btn tmd-toolbar-btn btn-white";
        if (toggle) {
            btnElement.setAttribute("data-toggle", "button");
            btnElement.setAttribute("aria-pressed", "false");
            btnElement.setAttribute("autocomplete", "false");
        }

        if(typeof action === "function") {
            btnElement.onclick = function(e) {
                e.preventDefault();
                action.bind(editor)();
                editor.codemirror.focus();
            }
        } else if (typeof action === "string") {
            btnElement.onclick = function(e) {
                e.preventDefault();
                window.open(action);
            }
        }

        var iconElement = document.createElement('i');
        iconElement.className = iconClass;

        btnElement.appendChild(iconElement);
        element.appendChild(btnElement);

        return element;
    }

    var bar = document.createElement("div");
    bar.className = "tmd-editor-toolbar";
    this.toolbarButtonElements = {};

    var i;
    for (i = 0; i < this.options.layout.length; i++) {
        var key = this.options.layout[i];
        var element;
        if (key === '|') {
            element = createSeparator();
        } else {
            var toolbarButton = this.options.buttons[key];
            var actionShortcut = "";
            
            // Check if shortcut exists
            if (this.options.shortcuts[toolbarButton.action]) {
                actionShortcut = '(' + adaptShortcut(this.options.shortcuts[toolbarButton.action]) + ')';
            }
            element = createIcon(toolbarButton.className,
                toolbarButton.title + ' ' + actionShortcut,
                toolbarButton.toggle,
                this.options.bindings[toolbarButton.action]
            );

            // Save the element reference for faster state update
            this.toolbarButtonElements[key] = element;
        }
        bar.appendChild(element);
    }

    return bar;
}

TMdToolbar.prototype.update = function () {
    var textState = this.editor.getCMTextState();
    textState.previewScrollLock = this.isPreviewScrollLocked;
    for (var key in this.options.buttons) {
        if (this.options.buttons[key].toggle) {
            var btnElement = $(this.toolbarButtonElements[key]).children('button')[0];
            if (textState[key]) {
                if (!btnElement.classList.contains('active'))
                    btnElement.classList.add('active');
            } else {
                if (btnElement.classList.contains('active'))
                    btnElement.classList.remove('active');
            }
        }
    }
}

TMdToolbar.prototype.toggleButtonByAction = function (actionName) {
    for (var key in this.options.buttons) {
        if (this.options.buttons[key].toggle &&
            this.options.buttons[key].action === actionName) {
            var btnElement = $(this.toolbarButtonElements[key]).children('button')[0];
            if (!btnElement.classList.contains('active')) {
                btnElement.classList.add('active');
            } else {
                btnElement.classList.remove('active');
            }
        }
    }
}

function adaptShortcut(shortcut) {
    if (platform.isMac) {
        return platform.adaptShortcutToMac(shortcut);
    } else {
        return shortcut;
    }
}

module.exports = TMdToolbar;