var hljs = require('highlight.js');

var md = require('markdown-it')({
    html: true,
    linkify: true,
    typographer: true
})
    .use(require('markdown-it-footnote'))
    .use(require('markdown-it-highlightjs'))
    .use(require('markdown-it-texmath').use(require('katex')))
    .use(require('./markdown-it-source-map'))
    .use(require('markdown-it-implicit-figures'), {
        dataType: false,
        figcaption: true
    })
    .use(require('markdown-it-attrs'))
    .use(require('markdown-it-multimd-table'))
    .use(require('markdown-it-mark'))
    .use(require('markdown-it-anchor'))
    .use(require('markdown-it-table-of-contents'))
    .use(require('markdown-it-container'), 'row_col', {
        validate: function(params) {
            return params.trim().match(/^(row|col)\s*(.*)$/);
        },
        render: function(tokens, idx) {
            var m = tokens[idx].info.trim().match(/^(row|col)\s*(.*)$/);

            if(tokens[idx].nesting === 1) {
                var className = "";
                if(m[1] === 'row') {
                    className = "row";
                } else if(m[2]){
                    var classTokens = m[2].split(' ');
                    for(var i = 0; i < classTokens.length; i++){
                        classTokens[i] = "col-" + classTokens[i];
                    }
                    className = classTokens.join(" ");
                }
                // Opening Tag
                return '<div class="' + className + '">';
            } else {
                return '</div>';
            }
        }
    });

/**
 * @param {TMdEditor} editor
 */
function TMdEditorPreview(editor, options) {
    if(typeof editor === 'undefined') {
        console.error("Cannot create TMdEditorPreview as the parent editor is not provided.");
        return;
    }

    this.editor = editor;
    this.previousLine = -1;
}

TMdEditorPreview.prototype.render = function() {
    /** @type {CodeMirror.Editor} */
    var cm = this.editor.codemirror;

    var wrapper = cm.getWrapperElement();

    // Generate preview div
    this.uiPreview = document.createElement('div');
    this.uiPreview.className = "tmd-preview";

    return this.uiPreview;
};

TMdEditorPreview.prototype.update = function(text) {
    if(typeof text === "undefined") {
        text = this.editor.codemirror.getValue();
    }
    this.uiPreview.innerHTML = md.render(text);

    // Update Source Target binding list.
    var blockList = $(this.uiPreview).children('[data-source-line]');

    // Preview to Source Binding
    this.sourcePreviewBinding = new Array();

    var j = 0; // index into block List
    for (var i = 0; i < blockList.length; i++) {
        var sourceLineNo = parseInt(blockList[i].getAttribute('data-source-line'));
        // Store DOM element instead of offsetTop as some image may not loaded yet.
        this.sourcePreviewBinding.push({ source: sourceLineNo, preview: blockList[i] });
    }
    this.sourcePreviewBinding.push({
        source: this.editor.codemirror.lineCount()
    });
};

TMdEditorPreview.prototype.scrollSync = function (line, topOffset) {
    if (typeof this.sourcePreviewBinding === "undefined")
        return;

    if (this.sourcePreviewBinding.length === 0)
        return;

    // If smaller than first block - scroll to top.
    if (line <= this.sourcePreviewBinding[0].source) {
        this.uiPreview.scrollTop = 0;
        return;
    }

    // As editor linecount and preview scrollHeight are appended to the source/preview binding
    // list. We just need to check till last entry.
    for (var i = 0; i < this.sourcePreviewBinding.length - 1; i++) {
        if (line < this.sourcePreviewBinding[i + 1].source) {
            // Found the location. Calculate offset.
            var blockLineCount = this.sourcePreviewBinding[i + 1].source - this.sourcePreviewBinding[i].source;
            var blockPercent = (line - this.sourcePreviewBinding[i].source) / blockLineCount;
            // Get position
            var previousBlockTop = this.sourcePreviewBinding[i].preview.offsetTop;
            var nextBlockTop = this.sourcePreviewBinding[i + 1].preview ? this.sourcePreviewBinding[i + 1].preview.offsetTop : this.uiPreview.scrollHeight;
            var previewBlockHeight = nextBlockTop - previousBlockTop;
            var previewScrollPosition = previousBlockTop + blockPercent * previewBlockHeight;

            var scrollTop = previewScrollPosition - topOffset;
            this.uiPreview.scrollTop = (scrollTop > 0) ? scrollTop : 0;
            return;
        }
    }
};

module.exports = TMdEditorPreview;