"use strict";

// CodeMirror is the main editor here.
var CodeMirror = require("codemirror");
require("codemirror/addon/edit/continuelist.js");
require("codemirror/mode/markdown/markdown.js");
require("codemirror/addon/mode/overlay.js");
require("codemirror/addon/display/placeholder.js");
require("codemirror/addon/selection/mark-selection.js");
require("codemirror/mode/gfm/gfm.js");
require("codemirror/mode/xml/xml.js");

var TMdAction = require('./_action');
var TMdToolbar = require('./_toolbar');
var TMdPreview = require('./_preview');
var TMdOptions = require('./_options');

/**
 * @typedef {Object} Editor
 * @property {CodeMirror.Editor} codemirror
 */

/**
 * The type that encodes the state of the token.
 * @typedef {Object} TokenState
 * @property {boolean} bold
 * @property {boolean} orderedList
 * @property {boolean} unorderedList
 * @property {boolean} quote
 * @property {boolean} italic
 * @property {boolean} strikethrough
 * @property {boolean} code
 * @property {boolean} link
 * @property {boolean} image
 * @property {boolean} header1
 * @property {boolean} header2
 * @property {boolean} header3
 * @property {boolean} header4
 * @property {boolean} header5
 * @property {boolean} header6
 */

/**
 *
 * @param {HTMLBaseElement} documentElement
 * @param {Object} options
 * @param {string} options.name
 * @param {string} initValue
 */
function TMdEditor(documentElement, options, initValue) {
    // Check document element first
    if (documentElement === null) {
        console.error("TMdEditor: Error, no documentElement provided.");
        return;
    }

    this.parentNode = documentElement.parentNode;
    this.nextSibling = documentElement.nextSibling;

    // Add 2 layers of wrapper on top of the input element
    this.wrapperElement = document.createElement('div');
    this.wrapperElement.className = "tmd-editor-wrapper";

    this.borderElement = document.createElement('div');
    this.borderElement.className = "tmd-editor-border";

    this.wrapperElement.appendChild(this.borderElement);
    this.parentNode.insertBefore(this.wrapperElement, documentElement);
    this.borderElement.appendChild(documentElement);

    // Store the element where editor is rendered in.
    this.element = documentElement;

    // Store and Parse options
    this.options = new TMdOptions(this, options);

    // Append functions first
    var editor = this;
    for (var key in this.options.editorFunctions) {
        this.prototype[key] = function () {
            editorFunctions[key](editor);
        };
    } 

    // Initialize toolbar
    if (this.options.toolbarEnable) {
        this.toolbar = new TMdToolbar(this, {
            buttons: this.options.toolbarButtons,
            layout: this.options.toolbarLayout,
            shortcuts: this.options.shortcuts
        });
    }

    // Initialize preview
    this.preview = new TMdPreview(this, {});

    // Render editor
    this.render();

    // CodeMirror component is only available after rendering. So, the initial value
    // is set after the element has been rendered.
    if (initValue) {
        this.value(initValue);
    }
}

TMdEditor.prototype.render = function () {
    if (this._rendered && this._rendered === this.element) {
        // The editor has already been rendered.
        return;
    }

    // Generate the Codemirror element first
    // TODO Make it configurable
    var mode, backdrop;

    mode = {
        highlightFormatting: true // needed for toggleCodeBlock to detect types of code
    };
    mode.name = "gfm";
    mode.gitHubSpice = false;

    this.codemirror = CodeMirror.fromTextArea(this.element, {
        mode: mode,
        backdrop: backdrop,
        lineNumbers: true,
        matchBrackets: true,
        lineWrapping: true,
        tabSize: 4,
        indentUnit: 4,
        indentWithTabs: true,
        autofocus: true,
        styleSelectedText: true,
        theme: 'github-light',
        extraKeys: { 'Enter': "newlineAndIndentContinueMarkdownList" }
    });

    var cm = this.codemirror;
    var cmWrapper = cm.getWrapperElement();

    // Set codemirror fontsize
    cmWrapper.style.fontSize = "1rem";
    // If toolbar will be rendered, set top to be 45px
    cmWrapper.style.top = this.toolbar ? "45px" : "0";
    // If status will be rendered, set bottom to be 40px
    cmWrapper.style.bottom = this.options.statusbarEnable ? "40px" : "5px";
    // Default to have preview on
    cmWrapper.style.right = "calc(50% + 3px)";

    // Force sync with textarea
    this.codemirror.on("change", function () {
        cm.save();
    });

    // Render toolbar if necessary
    if (this.toolbar) {
        // Get toolbar element
        var toolbar = this.toolbar;
        var toolbarElement = this.toolbar.render();
        // Insert toolbar into the editor
        cmWrapper.parentNode.insertBefore(toolbarElement, cmWrapper);

        this.codemirror.on("cursorActivity", function () {
            toolbar.update();
        });

        // Add toolbar element
        this.toolbarElement = toolbarElement;
    }

    // Get Preview element
    var previewElement = this.preview.render();
    previewElement.style.top = this.toolbar ? "45px" : "0";
    previewElement.style.bottom = this.options.statusbarEnable ? "40px" : "5px";
    previewElement.style.left = "50%";
    previewElement.style.display = "hidden";
    // Insert preview
    cmWrapper.parentNode.insertBefore(previewElement, cmWrapper.nextSibling);
    this.previewElement = previewElement;
    // Associate Update function
    var preview = this.preview;
    this.codemirror.on("change", function() {
        preview.update();
    });
    
    preview.update();

    if (this.options.fullScreenModal) {
        // Add Modal at the end of body for full-screen mode
        this.modalElement = document.createElement('div');
        this.modalElement.className = "modal fade tmd-editor-modal";
        this.modalElement.setAttribute("tabindex", "-1");
        this.modalElement.setAttribute("role", "dialog");
        this.modalElement.setAttribute("aria-hidden", "true");
        var modalDialogElement = document.createElement('div');
        modalDialogElement.className = "modal-dialog";
        modalDialogElement.setAttribute("role", "document");
        this.modalContentElement = document.createElement('div');
        this.modalContentElement.className = "modal-content";
        modalDialogElement.appendChild(this.modalContentElement);
        this.modalElement.appendChild(modalDialogElement);
        document.body.appendChild(this.modalElement);
        var editor = this;
        $(this.modalElement).on("hidden.bs.modal", function(e) {
            if (editor.fullScreen) {
                if (editor.toolbar) {
                    editor.toolbar.toggleButtonByAction("toggleFullScreen");
                }
                editor.toggleFullScreen();
            }
        });
    }

    // Create function for scroll lock
    this.scrollHandler = function() {
        var line = cm.getCursor().line + 1;
        var topOffset = cm.cursorCoords("window").top - cmWrapper.getBoundingClientRect().top;
        //var line = cm.lineAtHeight(cm.getScrollInfo().top, 'local') + 1;
        preview.scrollSync(line, topOffset);
        cm.focus();
    };

    this.cursorActivityHandler = function () {
        var line = cm.getCursor().line + 1;
        if (preview.previousLine === line)
            return;
        var topOffset = cm.cursorCoords("window").top - cmWrapper.getBoundingClientRect().top;
        //var line = cm.lineAtHeight(cm.getScrollInfo().top, 'local') + 1;
        preview.scrollSync(line, topOffset);
        cm.focus();
        preview.previousLine = line;
    };

    this._rendered = this.element;
 
    // Fixes CodeMirror bug (#344)
    var temp_cm = this.codemirror;
    setTimeout(function () {
        temp_cm.refresh();
    }.bind(temp_cm), 0);

    this.sideBySide = false;
    this.fullScreen = false;
    this.scrollLock = false;

    // Initial layout update
    if (this.options.sideBySide) {
        if (this.toolbar) {
            this.toolbar.toggleButtonByAction("toggleSideBySide");
        }
        this.toggleSideBySide();
    }

    if (this.options.fullscreen) {
        if (this.toolbar) {
            this.toolbar.toggleButtonByAction("toggleFullScreen");
        }
        this.toggleFullScreen();
    }

    if (this.options.scrollLock) {
        if (this.toolbar) {
            this.toolbar.toggleButtonByAction("toggleScrollLock");
        }
        this.toggleScrollLock();
    }
};

TMdEditor.prototype._RenderShortcuts = function () {

};

TMdEditor.prototype.getCMTextState = function () {
    return TMdAction.getCMTextState(this.codemirror);
};

TMdEditor.prototype.value = function (val) {
    if (val === undefined) {
        return this.codemirror.getValue();
    } else {
        this.codemirror.getDoc().setValue(val);
        return this;
    }
};

TMdEditor.prototype.toggleBold = function() {
    TMdAction.toggleBold(this);
};

TMdEditor.prototype.toggleItalic = function() {
    TMdAction.toggleItalic(this);
};

TMdEditor.prototype.drawLink = function() {
    TMdAction.drawLink(this);
};

TMdEditor.prototype.toggleHeadingSmaller = function() {
    TMdAction.toggleHeadingSmaller(this);
};

TMdEditor.prototype.toggleHeadingBigger = function() {
    TMdAction.toggleHeadingBigger(this);
};

TMdEditor.prototype.drawImage = function() {
    TMdAction.drawImage(this);
};

TMdEditor.prototype.toggleBlockquote = function() {
    TMdAction.toggleBlockquote(this);
};

TMdEditor.prototype.toggleOrderedList = function() {
    TMdAction.toggleOrderedList(this);
};

TMdEditor.prototype.toggleUnorderedList = function() {
    TMdAction.toggleUnorderedList(this);
};

TMdEditor.prototype.toggleCodeBlock = function() {
    TMdAction.toggleCodeBlock(this);
};

TMdEditor.prototype.togglePreview = function() {
    TMdAction.togglePreview(this);
};

TMdEditor.prototype.toggleStrikethrough = function() {
    TMdAction.toggleStrikethrough(this);
};

TMdEditor.prototype.cleanBlock = function() {
    TMdAction.cleanBlock(this);
};

TMdEditor.prototype.drawHorizontalRule = function() {
    TMdAction.drawHorizontalRule(this);
};

TMdEditor.prototype.undo = function() {
    TMdAction.undo(this);
};

TMdEditor.prototype.redo = function() {
    TMdAction.redo(this);
};

TMdEditor.prototype.toggleSideBySide = function() {
    TMdAction.toggleSideBySide(this);
};

TMdEditor.prototype.toggleFullScreen = function() {
    TMdAction.toggleFullScreen(this, this.options.fullScreenModal);
};

TMdEditor.prototype.toggleScrollLock = function () {
    TMdAction.toggleScrollLock(this);
};

TMdEditor.prototype.toggleFontsizeBigger = function () {
    var wrapper = this.codemirror.getWrapperElement();
    var fontSize = parseFloat(wrapper.style.fontSize.replace("rem", ""));
    wrapper.style.fontSize = (fontSize + 0.1) + "rem";
    this.codemirror.refresh();
    this.codemirror.focus(); 
};

TMdEditor.prototype.toggleFontsizeSmaller = function () {
    var wrapper = this.codemirror.getWrapperElement();
    var fontSize = parseFloat(wrapper.style.fontSize.replace("rem", ""));
    if (fontSize > 0.2) {
        wrapper.style.fontSize = (fontSize - 0.1) + "rem";
        this.codemirror.refresh();
        this.codemirror.focus();
    }
};

module.exports = TMdEditor;