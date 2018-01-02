var isMac = /Mac/.test(navigator.platform);

/**
 * @param {string} shortcut
 */
function adaptShortcutToMac(shortcut) {
    var shortcutMac;
    shortcutMac = shortcut.replace("Ctrl", "?");
    shortcutMac = shortcutMac.replace("Alt", "?");
    return shortcutMac;
}

module.exports = {
    isMac: isMac,
    adaptShortcutToMac: adaptShortcutToMac
};
