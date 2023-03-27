Array.prototype.forEach = function (callback) {
    for (var i = 0; i < this.length; i++) callback(this[i], i, this);
};
Array.prototype.filter = function (callback) {
    var filtered = [];
    for (var i = 0; i < this.length; i++)
        if (callback(this[i], i, this)) filtered.push(this[i]);
    return filtered;
};
Array.prototype.map = function (callback) {
    var mappedParam = [];
    for (var i = 0; i < this.length; i++)
        mappedParam.push(callback(this[i], i, this));
    return mappedParam;
};
Array.prototype.includes = function (item) {
    for (var i = 0; i < this.length; i++) if (this[i] == item) return true;
    return false;
};
Array.prototype.findIndex = function (callback) {
    for (var i = 0; i < this.length; i++)
        if (callback(this[i], i, this)) return i;
    return null;
};
Array.prototype.find = function (callback) {
    for (var i = 0; i < this.length; i++)
        if (callback(this[i], i, this)) return this[i];
    return null;
};
function getCMYKString(color) {
    try {
        return (
            "CMYK" +
            "(" +
            Math.floor(color.cyan) +
            "," +
            Math.floor(color.magenta) +
            "," +
            Math.floor(color.yellow) +
            "," +
            Math.floor(color.black) +
            ")"
        );
    } catch (err) {
        alert('Failed on getCMYKString:')
        alert(err);
    }
};

function getCMYKFromString(string) {
    try {
        var params = string.replace(/^CMYK\(/, '').replace(/\)$/, '').split(',');
        var temp = new CMYKColor();
        var keys = ['cyan', 'magenta', 'yellow', 'black']
        for (var i = 0; i < params.length; i++) {
            var key = keys[i];
            temp[key] = Math.floor(Number(params[i]));
        }
        return temp;
    } catch (err) {
        alert('Failed on getCMYKFromString:')
        alert(err);
    }
}

var colorList = [];
var realColors = [];

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
    try {
        app.selection = null;
        alert('Checking ' + app.activeDocument.pathItems.length + ' items...');
        var list = get('pathItems')
        list.forEach(function (item, index) {
            if (colorFailedSaturation(item.fillColor) && !colorList.includes(getCMYKString(item.fillColor))) {
                colorList.push(getCMYKString(item.fillColor));
                realColors.push(item.fillColor);
            }
            if (colorFailedSaturation(item.strokeColor) && !colorList.includes(getCMYKString(item.strokeColor))) {
                colorList.push(getCMYKString(item.strokeColor));
                realColors.push(item.strokeColor);
            }
        })
        printSwatches(realColors);
        alert('Found ' + realColors.length);
    } catch (err) {
        alert('Failed on getHighSaturation:')
        alert(err);
    }
}

function printSwatches(list) {
    try {
        var newLayer = getLayer('Found Colors') || app.activeDocument.layers.add();
        newLayer.name = 'Found Colors';
        list.forEach(function (item, index) {
            var shape = app.activeDocument.pathItems.rectangle(150, 0 + (index * 50), 40, 40);
            shape.fillColor = item
            shape.move(newLayer, ElementPlacement.PLACEATBEGINNING);
            shape.name = colorList[index];
        });
    } catch (err) {
        alert('Failed on printSwatch:')
        alert(err)
    }
}

function colorFailedSaturation(color) {
    try {
        if (/nocolor/i.test(color.typename)) return false;
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
    } catch (err) {
        alert('Failed on colorSaturation:')
        alert(err);
    }
}

function getLayer(name) {
    return get('layers').find(function (layer) {
        return layer.name == name;
    })
}

getAllHighSaturationColors();