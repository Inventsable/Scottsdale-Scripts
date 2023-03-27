Array.prototype.forEach = function (callback) {
    for (var i = 0; i < this.length; i++) callback(this[i], i, this);
};
Array.prototype.filter = function (callback) {
    var filtered = [];
    for (var i = 0; i < this.length; i++)
        if (callback(this[i], i, this)) filtered.push(this[i]);
    return filtered;
};
function get(type, parent, deep) {
    if (arguments.length == 1 || !parent) {
        parent = app.activeDocument;
        deep = true;
    }
    var result = [];
    if (!parent[type]) return [];
    for (var i = 0; i < parent[type].length; i++) {
        result.push(parent[type][i]);
        if (parent[type][i][type] && deep)
            result = [].concat(result, get(type, parent[type][i], deep));
    }
    return result;
}

function getAllHighSaturationColors() {
    app.selection = null;
    alert('Checking ' + app.activeDocument.pathItems.length + ' items...');
    var list = get('pathItems')
        .filter(function (item) {
            return (item.filled || item.stroked) && (item.fillColor.typename == 'CMYKColor' || item.strokeColor.typename == 'CMYKColor')
        })
    list.forEach(function (item, index) {
        if (!checkColor(item.fillColor) || !checkColor(item.strokeColor))
            item.selected = true;
    })
    alert('Done');
}

function checkColor(color) {
    var fail = false;
    var keys = ['cyan', 'magenta', 'yellow', 'black']
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var thisColor = color[key];
        if (thisColor > 90)
            fail = true;
        if (fail) break
        else continue;
    }
    return fail;
}

getAllHighSaturationColors();