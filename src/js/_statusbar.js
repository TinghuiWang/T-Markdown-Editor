function TMdStatusBar(editor) {
    if (typeof editor === "undefined") {
        console.error("TMdStatusBar needs a TMdEditor instance to populate the status bar");
        return;
    }

    this.editor = editor;
}

TMdStatusBar.prototype.render = function () {
    var cm = this.editor.codemirror;

    var element = document.createElement('div');
    element.className = "tmd-status-bar";

    var positionElement = document.createELement('span');

    cm.on("cursorActivity", function () {
        var position = cm.getCursor();
        positionElement.innerHTML = 'Line: ' + pos.line + '| Column: ' + pos.ch;
    });

    element.appendChild(positionElement);

    return element;
}


module.exports = TMdStatusBar;