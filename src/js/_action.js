var insertTexts = {
    link: ["[", "](#url#)"],
    image: ["![](", "#url#)"],
    table: ["", "\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text     | Text     |\n\n"],
    horizontalRule: ["", "\n\n-----\n\n"]
};

/**
 * Get the text status at the location of cursor or a given position
 *
 * @param {CodeMirror.Editor} cm
 * @param {CodeMirror.Position} pos
 * @returns {TokenState}
 */
function getCMTextState(cm, pos) {
    pos = (typeof pos === "undefined") ? cm.getCursor("start") : pos;
    var stat = cm.getTokenAt(pos);

    if (!stat.type) return {};

    var types = stat.type.split(" ");
    var ret = {};
    var text;
    for (var i = 0; i < types.length; i++) {
        switch (types[i]) {
            case "strong":
                ret.bold = true;
                break;
            case "variable-2":
                text = cm.getLine(pos.line);
                if (/^\s*\d+\.\s/.test(text)) {
                    ret.orderedList = true;
                } else {
                    ret.unorderedList = true;
                }
                break;
            case "atom":
                ret.quote = true;
                break;
            case "em":
                ret.italic = true;
                break;
            case "quote":
                ret.quote = true;
                break;
            case "strikethrough":
                ret.strikethrough = true;
                break;
            case "comment":
                ret.code = true;
                break;
            case "link":
                ret.link = true;
                break;
            case "tag":
                ret.image = true;
                break;
            default:
                if (types[i].match(/^header(\-[1-6])?$/)) {
                    ret[types[i]] = true;
                }
                break;
        }
    }
    return ret;
}

/**
 * @param {CodeMirror.LineHandle} line
 * @return {boolean}
 */
function _getCMFencingLine(line) {
    /* return true, if this is a ``` or ~~~ line */
    if (typeof line !== "object") {
        throw "_getCMFencingLine() takes a 'line' object (not a line number, or line text).  Got: " + typeof line + ": " + line;
    }
    return line.styles && line.styles[2] && line.styles[2].indexOf("formatting-code-block") !== -1;
}

/**
 * @param {CodeMirror.Token} token
 * @returns
 */
function _getCMTokenState(token) {
    return token.state.base.base || token.state.base;
}

/**
 * Get the "code" type section style - either "single", "indented" or "fenced".
 * @param {CodeMirror.Editor} cm
 * @param {number} line_num
 * @param {CodeMirror.LineHandle} line
 * @param {CodeMirror.Token} firstToken
 * @param {CodeMirror.Token} lastToken
 * @returns {string | boolean} "single", "indented" or "fenced" or false.
 */
function _getCMCodeType(cm, line_num, line, firstToken, lastToken) {
    line = line || cm.getLineHandle(line_num);
    firstToken = firstToken || cm.getTokenAt({
        line: line_num,
        ch: 1
    });
    lastToken = lastToken || cm.getTokenAt({
        line: line_num,
        ch: line.text.length - 1
    });
    var types = firstToken.type ? firstToken.type.split(" ") : [];
    if (lastToken && _getCMTokenState(lastToken).indentedCode) {
        // Check the last char, since first chars of first indented line aren't marked as indented.
        return "indented";
    } else if (types.indexOf("comment") === -1) {
        return false;
    } else if (_getCMTokenState(firstToken).fencedChars ||
        _getCMTokenState(lastToken).fencedChars ||
        _getCMFencingLine(line)) {
        return "fenced";
    } else {
        return "single";
    }
}

/**
 * @param {Editor} editor
 * @param {string} type The type of block to toggle. Valid values are: "bold", "orderedList", "unorderedList",
 *                        "quote", "italic", "strikethrough", "code", "link", "image", "header1-6".
 * @param {string} start_chars The start chars of tagging the given type. e.g. "**" for bold.
 * @param {string} end_chars The end chars of tagging the given type. e.g. "**" for bold.
 */
function _toggleBlock(editor, type, start_chars, end_chars) {
    // TODO Check if the following check is necessary
    //if (/editor-preview-active/.test(editor.codemirror.getWrapperElement().lastChild.className))
    //    return;

    end_chars = (typeof end_chars === "undefined") ? start_chars : end_chars;
    var cm = editor.codemirror;
    var stat = getCMTextState(cm);

    var text;
    var start = start_chars;
    var end = end_chars;

    var startPoint = cm.getCursor("start");
    var endPoint = cm.getCursor("end");

    if (stat[type]) {
        // The type exists
        text = cm.getLine(startPoint.line);
        start = text.slice(0, startPoint.ch);
        end = text.slice(startPoint.ch);
        if (type === "bold") {
            start = start.replace(/(\*\*|__)(?![\s\S]*(\*\*|__))/, "");
            end = end.replace(/(\*\*|__)/, "");
        } else if (type === "italic") {
            start = start.replace(/(\*|_)(?![\s\S]*(\*|_))/, "");
            end = end.replace(/(\*|_)/, "");
        } else if (type === "strikethrough") {
            start = start.replace(/(\*\*|~~)(?![\s\S]*(\*\*|~~))/, "");
            end = end.replace(/(\*\*|~~)/, "");
        }
        cm.replaceRange(start + end, {
            line: startPoint.line,
            ch: 0
        }, {
                line: startPoint.line,
                ch: 99999999999999
            });

        if (type === "bold" || type === "strikethrough") {
            startPoint.ch -= 2;
            if (startPoint !== endPoint) {
                endPoint.ch -= 2;
            }
        } else if (type === "italic") {
            startPoint.ch -= 1;
            if (startPoint !== endPoint) {
                endPoint.ch -= 1;
            }
        }
    } else {
        text = cm.getSelection();
        if (type === "bold") {
            text = text.split("**").join("");
            text = text.split("__").join("");
        } else if (type === "italic") {
            text = text.split("*").join("");
            text = text.split("_").join("");
        } else if (type === "strikethrough") {
            text = text.split("~~").join("");
        }
        cm.replaceSelection(start + text + end);

        startPoint.ch += start_chars.length;
        endPoint.ch = startPoint.ch + text.length;
    }

    cm.setSelection(startPoint, endPoint);
    cm.focus();
}

/**
 *
 * @param {CodeMirror.Editor} cm
 * @param {string} direction "smaller" or "bigger"
 * @param {number} size by how much, default to 1
 */
function _toggleHeading(cm, direction, size) {
    // TODO Check whether the following is needed or not
    //if (/editor-preview-active/.test(cm.getWrapperElement().lastChild.className))
    //    return;

    /** @type {CodeMirror.Position} */
    var startPoint = cm.getCursor("start");
    /** @type {CodeMirror.Position} */
    var endPoint = cm.getCursor("end");
    for (var i = startPoint.line; i <= endPoint.line; i++) {
        (function (i) {
            /** @type {CodeMirror.LineHandle} */
            var text = cm.getLine(i);
            var currHeadingLevel = text.search(/[^#]/);

            if (direction !== undefined) {
                if (currHeadingLevel <= 0) {
                    if (direction === "bigger") {
                        text = "###### " + text;
                    } else {
                        text = "# " + text;
                    }
                } else if (currHeadingLevel === 6 && direction === "smaller") {
                    text = text.substr(7);
                } else if (currHeadingLevel === 1 && direction === "bigger") {
                    text = text.substr(2);
                } else {
                    if (direction === "bigger") {
                        text = text.substr(1);
                    } else {
                        text = "#" + text;
                    }
                }
            } else {
                if (size === 1) {
                    if (currHeadingLevel <= 0) {
                        text = "# " + text;
                    } else if (currHeadingLevel === size) {
                        text = text.substr(currHeadingLevel + 1);
                    } else {
                        text = "# " + text.substr(currHeadingLevel + 1);
                    }
                } else if (size === 2) {
                    if (currHeadingLevel <= 0) {
                        text = "## " + text;
                    } else if (currHeadingLevel === size) {
                        text = text.substr(currHeadingLevel + 1);
                    } else {
                        text = "## " + text.substr(currHeadingLevel + 1);
                    }
                } else {
                    if (currHeadingLevel <= 0) {
                        text = "### " + text;
                    } else if (currHeadingLevel === size) {
                        text = text.substr(currHeadingLevel + 1);
                    } else {
                        text = "### " + text.substr(currHeadingLevel + 1);
                    }
                }
            }
            cm.replaceRange(text, {
                line: i,
                ch: 0
            }, {
                    line: i,
                    ch: 99999999999999
                });
        })(i);
    }
    cm.focus();
}

/**
 *
 * @param {CodeMirror.Editor} cm
 * @param {boolean} active
 * @param {[string, string]} startEnd
 * @param {string} url
 */
function _replaceSelection(cm, active, startEnd, url) {
    // TODO Check if the following is needed
    //if (/editor-preview-active/.test(cm.getWrapperElement().lastChild.className))
    //    return;

    var text;
    var start = startEnd[0];
    var end = startEnd[1];
    var startPoint = cm.getCursor("start");
    var endPoint = cm.getCursor("end");
    if (url) {
        end = end.replace("#url#", url);
    }
    if (active) {
        text = cm.getLine(startPoint.line);
        start = text.slice(0, startPoint.ch);
        end = text.slice(startPoint.ch);
        cm.replaceRange(start + end, {
            line: startPoint.line,
            ch: 0
        });
    } else {
        text = cm.getSelection();
        cm.replaceSelection(start + text + end);

        startPoint.ch += start.length;
        if (startPoint !== endPoint) {
            endPoint.ch += start.length;
        }
    }
    cm.setSelection(startPoint, endPoint);
    cm.focus();
}

/**
 * @param {CodeMirror.Editor} cm
 * @param {string} type "quote", "orderedList" or "unorderedList"
 */
function _toggleLine(cm, type) {
    var stat = getCMTextState(cm);
    var startPoint = cm.getCursor("start");
    var endPoint = cm.getCursor("end");
    var repl = {
        "quote": /^(\s*)\>\s+/,
        "unorderedList": /^(\s*)(\*|\-|\+)\s+/,
        "orderedList": /^(\s*)\d+\.\s+/
    };
    var map = {
        "quote": "> ",
        "unorderedList": "- ",
        "orderedList": "1. "
    };
    for (var i = startPoint.line; i <= endPoint.line; i++) {
        (function (i) {
            var text = cm.getLine(i);
            if (stat[type]) {
                text = text.replace(repl[type], "$1");
            } else {
                text = map[type] + text;
            }
            cm.replaceRange(text, {
                line: i,
                ch: 0
            }, {
                    line: i,
                    ch: 99999999999999
                });
        })(i);
    }
    cm.focus();
}

/**
 * Remove all format in selected area.
 * @param {CodeMirror.Editor} cm
 */
function _cleanBlock(cm) {
    var startPoint = cm.getCursor("start");
    var endPoint = cm.getCursor("end");
    var text;

    for (var line = startPoint.line; line <= endPoint.line; line++) {
        text = cm.getLine(line);
        text = text.replace(/^[ ]*([# ]+|\*|\-|[> ]+|[0-9]+(.|\)))[ ]*/, "");

        cm.replaceRange(text, {
            line: line,
            ch: 0
        }, {
                line: line,
                ch: 99999999999999
            });
    }
}

/**
 * Action for toggling bold.
 */
function toggleBold(editor) {
    _toggleBlock(editor, "bold", "**");
}

/**
 * Action for toggling italic.
 */
function toggleItalic(editor) {
    _toggleBlock(editor, "italic", "*");
}

/**
 * Action for drawing a link.
 */
function drawLink(editor) {
    var cm = editor.codemirror;
    var stat = editor.getCMTextState(cm);
    //var options = editor.options;
    var url = "http://";
    _replaceSelection(cm, stat.link, insertTexts.link, url);
}

/**
 * Action for toggling heading size: normal -> h1 -> h2 -> h3 -> h4 -> h5 -> h6 -> normal
 */
function toggleHeadingSmaller(editor) {
    var cm = editor.codemirror;
    _toggleHeading(cm, "smaller");
}

/**
 * Action for toggling heading size: normal -> h6 -> h5 -> h4 -> h3 -> h2 -> h1 -> normal
 */
function toggleHeadingBigger(editor) {
    var cm = editor.codemirror;
    _toggleHeading(cm, "bigger");
}

/**
 * Action for toggling blockquote.
 */
function toggleBlockquote(editor) {
    var cm = editor.codemirror;
    _toggleLine(cm, "quote");
}

/**
 * Action for toggling ol.
 */
function toggleOrderedList(editor) {
    var cm = editor.codemirror;
    _toggleLine(cm, "orderedList");
}

/**
 * Action for toggling ul.
 */
function toggleUnorderedList(editor) {
    var cm = editor.codemirror;
    _toggleLine(cm, "unorderedList");
}

/**
 * Action for toggling code block.
 * @param {Editor} editor
 */
function toggleCodeBlock(editor) {
    var cm = editor.codemirror;
    var cur_start = cm.getCursor("start");
    var cur_end = cm.getCursor("end");
    var tok = cm.getTokenAt({
        line: cur_start.line,
        ch: cur_start.ch || 1
    }); // avoid ch 0 which is a cursor pos but not token
    var line = cm.getLineHandle(cur_start.line);
    var is_code = _getCMCodeType(cm, cur_start.line, line, tok);
    var block_start, block_end, lineCount;
    if (is_code === "single") {
        // similar to _toggleBlock logic
        var start = line.text.slice(0, cur_start.ch).replace("`", ""),
            end = line.text.slice(cur_start.ch).replace("`", "");
        cm.replaceRange(start + end, {
            line: cur_start.line,
            ch: 0
        }, {
                line: cur_start.line,
                ch: 99999999999999
            });
        cur_start.ch--;
        if (cur_start !== cur_end) {
            cur_end.ch--;
        }
        cm.setSelection(cur_start, cur_end);
        cm.focus();
    } else if (is_code === "fenced") {
        if (cur_start.line !== cur_end.line || cur_start.ch !== cur_end.ch) {
            // use selection

            // find the fenced line so we know what type it is (tilde, backticks, number of them)
            for (block_start = cur_start.line; block_start >= 0; block_start--) {
                line = cm.getLineHandle(block_start);
                if (_getCMFencingLine(line)) {
                    break;
                }
            }
            var fencedTok = cm.getTokenAt({
                line: block_start,
                ch: 1
            });
            var fence_chars = _getCMTokenState(fencedTok).fencedChars;
            var start_text, start_line;
            var end_text, end_line;
            // check for selection going up against fenced lines, in which case we don't want to add more fencing
            if (_getCMFencingLine(cm.getLineHandle(cur_start.line))) {
                start_text = "";
                start_line = cur_start.line;
            } else if (_getCMFencingLine(cm.getLineHandle(cur_start.line - 1))) {
                start_text = "";
                start_line = cur_start.line - 1;
            } else {
                start_text = fence_chars + "\n";
                start_line = cur_start.line;
            }
            if (_getCMFencingLine(cm.getLineHandle(cur_end.line))) {
                end_text = "";
                end_line = cur_end.line;
                if (cur_end.ch === 0) {
                    end_line += 1;
                }
            } else if (cur_end.ch !== 0 && _getCMFencingLine(cm.getLineHandle(cur_end.line + 1))) {
                end_text = "";
                end_line = cur_end.line + 1;
            } else {
                end_text = fence_chars + "\n";
                end_line = cur_end.line + 1;
            }
            if (cur_end.ch === 0) {
                // full last line selected, putting cursor at beginning of next
                end_line -= 1;
            }
            cm.operation(function () {
                // end line first, so that line numbers don't change
                cm.replaceRange(end_text, {
                    line: end_line,
                    ch: 0
                }, {
                        line: end_line + (end_text ? 0 : 1),
                        ch: 0
                    });
                cm.replaceRange(start_text, {
                    line: start_line,
                    ch: 0
                }, {
                        line: start_line + (start_text ? 0 : 1),
                        ch: 0
                    });
            });
            cm.setSelection({
                line: start_line + (start_text ? 1 : 0),
                ch: 0
            }, {
                    line: end_line + (start_text ? 1 : -1),
                    ch: 0
                });
            cm.focus();
        } else {
            // no selection, search for ends of this fenced block
            var search_from = cur_start.line;
            if (_getCMFencingLine(cm.getLineHandle(cur_start.line))) { // gets a little tricky if cursor is right on a fenced line
                if (_getCMCodeType(cm, cur_start.line + 1) === "fenced") {
                    block_start = cur_start.line;
                    search_from = cur_start.line + 1; // for searching for "end"
                } else {
                    block_end = cur_start.line;
                    search_from = cur_start.line - 1; // for searching for "start"
                }
            }
            if (block_start === undefined) {
                for (block_start = search_from; block_start >= 0; block_start--) {
                    line = cm.getLineHandle(block_start);
                    if (_getCMFencingLine(line)) {
                        break;
                    }
                }
            }
            if (block_end === undefined) {
                lineCount = cm.lineCount();
                for (block_end = search_from; block_end < lineCount; block_end++) {
                    line = cm.getLineHandle(block_end);
                    if (_getCMFencingLine(line)) {
                        break;
                    }
                }
            }
            cm.operation(function () {
                cm.replaceRange("", {
                    line: block_start,
                    ch: 0
                }, {
                        line: block_start + 1,
                        ch: 0
                    });
                cm.replaceRange("", {
                    line: block_end - 1,
                    ch: 0
                }, {
                        line: block_end,
                        ch: 0
                    });
            });
            cm.focus();
        }
    } else if (is_code === "indented") {
        if (cur_start.line !== cur_end.line || cur_start.ch !== cur_end.ch) {
            // use selection
            block_start = cur_start.line;
            block_end = cur_end.line;
            if (cur_end.ch === 0) {
                block_end--;
            }
        } else {
            // no selection, search for ends of this indented block
            for (block_start = cur_start.line; block_start >= 0; block_start--) {
                line = cm.getLineHandle(block_start);
                if (line.text.match(/^\s*$/)) {
                    // empty or all whitespace - keep going
                    continue;
                } else {
                    if (_getCMCodeType(cm, block_start, line) !== "indented") {
                        block_start += 1;
                        break;
                    }
                }
            }
            lineCount = cm.lineCount();
            for (block_end = cur_start.line; block_end < lineCount; block_end++) {
                line = cm.getLineHandle(block_end);
                if (line.text.match(/^\s*$/)) {
                    // empty or all whitespace - keep going
                    continue;
                } else {
                    if (_getCMCodeType(cm, block_end, line) !== "indented") {
                        block_end -= 1;
                        break;
                    }
                }
            }
        }
        // if we are going to un-indent based on a selected set of lines, and the next line is indented too, we need to
        // insert a blank line so that the next line(s) continue to be indented code
        var next_line = cm.getLineHandle(block_end + 1),
            next_line_last_tok = next_line && cm.getTokenAt({
                line: block_end + 1,
                ch: next_line.text.length - 1
            }),
            next_line_indented = next_line_last_tok && _getCMTokenState(next_line_last_tok).indentedCode;
        if (next_line_indented) {
            cm.replaceRange("\n", {
                line: block_end + 1,
                ch: 0
            });
        }
        for (var i = block_start; i <= block_end; i++) {
            cm.indentLine(i, "subtract"); // TODO: this doesn't get tracked in the history, so can't be undone :(
        }
        cm.focus();
    } else {
        // insert code formatting
        var no_sel_and_starting_of_line = (cur_start.line === cur_end.line && cur_start.ch === cur_end.ch && cur_start.ch === 0);
        var sel_multi = cur_start.line !== cur_end.line;
        if (no_sel_and_starting_of_line || sel_multi) {
            insertFencingAtSelection(cm, cur_start, cur_end, fenceCharsToInsert);
        } else {
            _replaceSelection(cm, false, ["`", "`"]);
        }
    }
}

/**
 * Action for toggling strikethrough.
 */
function toggleStrikethrough(editor) {
    _toggleBlock(editor, "strikethrough", "~~");
}

/**
 * Action for clean block (remove headline, list, blockquote code, markers)
 */
function cleanBlock(editor) {
    var cm = editor.codemirror;
    _cleanBlock(cm);
}

/**
 * Action for drawing a horizontal rule.
 */
function drawHorizontalRule(editor) {
    var cm = editor.codemirror;
    var stat = getState(cm);
    var options = editor.options;
    _replaceSelection(cm, stat.image, insertTexts.horizontalRule);
}

/**
 * Undo action.
 */
function undo(editor) {
    var cm = editor.codemirror;
    cm.undo();
    cm.focus();
}

/**
 * Redo action.
 */
function redo(editor) {
    var cm = editor.codemirror;
    cm.redo();
    cm.focus();
}

/**
 * Preview action.
 */
function togglePreview(editor) {
}

/**
 * Action for drawing an img.
 */
function drawImage(editor) {
    // TODO Rework the full logic of draw image
    var cm = editor.codemirror;
    var stat = getCMTextState(cm);
    //var options = editor.options;
    var url = "http://";
    _replaceSelection(cm, stat.image, insertTexts.image, url);
}

/**
 * Toggle side by side preview
 */
function toggleSideBySide(editor) {
    if (editor.sideBySide) {
        editor.previewElement.style.display = "none";
        editor.codemirror.getWrapperElement().style.right = "0%";
    } else {
        editor.previewElement.style.display = "block";
        editor.codemirror.getWrapperElement().style.right = "calc(50% + 3px)";
    }
    editor.sideBySide = !editor.sideBySide;
}

/**
 * Toggle full screen of the editor.
 */
function toggleFullScreen(editor, useModal) {
    var editor_border = editor.codemirror.getWrapperElement().parentElement;
    var editor_wrapper = editor_border.parentElement;
    if (editor.fullScreen) {
        editor.fullScreen = !editor.fullScreen;
        editor_border.style.margin = null;
        editor_border.style.resize = null;
        editor_border.style.height = null;
        editor_border.style.width = null;
        editor_border.style.height = editor.borderHeight;
        if (useModal) {
            editor_wrapper.style.height = null;
            if (editor.modalElement.classList.contains('show')) {
                $(editor.modalElement).modal('hide');
            }
            editor.parentNode.insertBefore(editor.wrapperElement, editor.nextSibling);
        } else {
            editor_wrapper.style.position = null;
            editor_wrapper.style.left = null;
            editor_wrapper.style.right = null;
            editor_wrapper.style.top = null;
            editor_wrapper.style.bottom = null;
        }
    } else {
        editor.fullScreen = !editor.fullScreen;
        editor.borderHeight = editor_border.style.height;
        // Disable auto resizing
        editor_border.style.margin = "10px";
        editor_border.style.resize = "none";
        editor_border.style.height = "calc(100% - 20px)";
        editor_border.style.width = "calc(100% - 20px)";
        if (useModal) {
            editor_wrapper.style.height = "100%";
            editor.modalContentElement.appendChild(editor.wrapperElement);
            $(editor.modalElement).modal('show');
        } else {
            // Position Wrapper
            editor_wrapper.style.position = "fixed";
            editor_wrapper.style.left = 0;
            editor_wrapper.style.right = 0;
            editor_wrapper.style.top = 0;
            editor_wrapper.style.bottom = 0;
        }
    }
 }

function toggleScrollLock(editor) {
    var cm = editor.codemirror;

    if (editor.scrollLock) {
        cm.off("scroll", editor.scrollHandler);
        cm.off("cursorActivity", editor.cursorActivityHandler);
    } else {
        editor.preview.previousLine = -1;
        // Associate Scroll Sync
        cm.on("scroll", editor.scrollHandler);
        cm.on("cursorActivity", editor.cursorActivityHandler);
    }

    editor.scrollLock = !editor.scrollLock;
}
// #endregion


/**
 * Maps between function name string and actual function.
 */
var TMdEditorActions = {
    "toggleBold": toggleBold,
    "toggleItalic": toggleItalic,
    "drawLink": drawLink,
    "toggleHeadingSmaller": toggleHeadingSmaller,
    "toggleHeadingBigger": toggleHeadingBigger,
    "drawImage": drawImage,
    "toggleBlockquote": toggleBlockquote,
    "toggleOrderedList": toggleOrderedList,
    "toggleUnorderedList": toggleUnorderedList,
    "toggleCodeBlock": toggleCodeBlock,
    "togglePreview": togglePreview,
    "toggleStrikethrough": toggleStrikethrough,
    //"toggleHeading1": toggleHeading1,
    //"toggleHeading2": toggleHeading2,
    //"toggleHeading3": toggleHeading3,
    "cleanBlock": cleanBlock,
    //"drawTable": drawTable,
    "drawHorizontalRule": drawHorizontalRule,
    "undo": undo,
    "redo": redo,
    "toggleSideBySide": toggleSideBySide,
    "toggleFullScreen": toggleFullScreen,
    "getCMTextState": getCMTextState,
    "toggleScrollLock": toggleScrollLock
};

module.exports = TMdEditorActions;