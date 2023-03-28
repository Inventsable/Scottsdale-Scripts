var CONFIG = {
  dialog: {
    cmykMax: {
      label: "Maximum CMYK value:",
      value: "85",
    },
    layerName: {
      label: "Resulting layer name:",
      value: "Found Colors",
    },
    ignoreHidden: {
      label: "Ignore hidden artwork",
      value: true,
    },
    alerts: {
      label: "Show alerts",
      value: true,
    },
    runBtn: {
      label: "Create",
      closeOnRun: true,
    },
    clearBtn: {
      label: "Remove",
      closeOnRun: false,
    },
    size: {
      width: 200,
      height: 200,
    },
    title: "Collect High Saturation",
  },
  swatches: {
    startPos: [30, 0],
    incrementX: 25,
    size: [20, 20],
    strokeWidth: 3,
  },
};

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
function getCMYKString(color, type) {
  try {
    return (
      "CMYK" +
      type +
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
    alert("Failed on getCMYKString:");
    alert(err);
  }
}

function getCMYKFromString(string) {
  try {
    var params = string
      .replace(/^CMYK\(/, "")
      .replace(/\)$/, "")
      .split(",");
    var temp = new CMYKColor();
    var keys = ["cyan", "magenta", "yellow", "black"];
    for (var i = 0; i < params.length; i++) {
      var key = keys[i];
      temp[key] = Math.floor(Number(params[i]));
    }
    return temp;
  } catch (err) {
    alert("Failed on getCMYKFromString:");
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
  if (!parent[type]) {
    return [];
  }
  for (var i = 0; i < parent[type].length; i++) {
    result.push(parent[type][i]);
    if (parent[type][i][type] && deep) {
      result = [].concat(result, get(type, parent[type][i], deep));
    }
  }
  return result;
}

function getAllHighSaturationColors(options) {
  try {
    app.selection = null;
    if (options.alerts.value) {
      alert("Checking " + app.activeDocument.pathItems.length + " items...");
    }
    var list = get("pathItems");
    // if (options.ignoreHidden.value) {
    //   list = list.filter(function (item) {
    //     return !item.hidden;
    //   });
    // }
    list.forEach(function (item, index) {
      if (
        colorFailedSaturation(item.fillColor, options.max) &&
        !colorList.includes(getCMYKString(item.fillColor, "Fill"))
      ) {
        colorList.push(getCMYKString(item.fillColor, "Fill"));
        realColors.push(item.fillColor);
      }
      if (
        colorFailedSaturation(item.strokeColor, options.max) &&
        !colorList.includes(getCMYKString(item.strokeColor, "Stroke"))
      ) {
        colorList.push(getCMYKString(item.strokeColor, "Stroke"));
        realColors.push(item.strokeColor);
      }
    });
    printSwatches(realColors, options);
    if (options.alerts.value) {
      alert("Found " + realColors.length);
    }
  } catch (err) {
    alert("Failed on getHighSaturation:");
    alert(err);
  }
}

function printSwatches(list, options) {
  try {
    var newLayer =
      findLayerByName(options.layerName) || app.activeDocument.layers.add();
    newLayer.name = options.layerName;
    list.forEach(function (color, index) {
      var shape = app.activeDocument.pathItems.rectangle(
        CONFIG.swatches.startPos[0],
        CONFIG.swatches.startPos[1] + index * CONFIG.swatches.incrementX,
        CONFIG.swatches.size[1],
        CONFIG.swatches.size[0]
      );
      var isFill = /fill/i.test(colorList[index]);
      if (isFill) {
        shape.fillColor = color;
      } else {
        shape.strokeColor = color;
        shape.strokeWidth = CONFIG.swatches.strokeWidth;
      }
      shape.move(newLayer, ElementPlacement.PLACEATBEGINNING);
      shape.name = generateName(color, isFill ? "fill" : "stroke");
    });
  } catch (err) {
    alert("Failed on printSwatch:");
    alert(err);
  }
}

function generateName(color, type) {
  var str = type.toUpperCase() + " ";
  str += "C" + Math.floor(color.cyan) + " ";
  str += "M" + Math.floor(color.magenta) + " ";
  str += "Y" + Math.floor(color.yellow) + " ";
  str += "K" + Math.floor(color.black);
  return str;
}

function colorFailedSaturation(color, max) {
  try {
    if (/nocolor/i.test(color.typename)) return false;
    var fail = false;
    var keys = ["cyan", "magenta", "yellow", "black"];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var thisColor = color[key];
      if (thisColor >= Number(max)) fail = true;
      if (fail) {
        break;
      } else {
        continue;
      }
    }
    return fail;
  } catch (err) {
    alert("Failed on colorSaturation:");
    alert(err);
  }
}

function findLayerByName(name) {
  return get("layers").find(function (layer) {
    return layer.name == name;
  });
}

function init() {
  // DIALOG
  // ======
  var dialog = new Window("dialog");
  dialog.text = CONFIG.dialog.title;
  // dialog.preferredSize.width = CONFIG.dialog.size.width;
  // dialog.preferredSize.height = CONFIG.dialog.size.height;
  dialog.orientation = "column";
  dialog.alignChildren = ["left", "top"];
  dialog.spacing = 10;
  dialog.margins = 16;

  // GROUP1
  // ======
  var group1 = dialog.add("group", undefined, { name: "group1" });
  group1.orientation = "row";
  group1.alignChildren = ["left", "center"];
  group1.spacing = 10;
  group1.margins = 0;

  var statictext1 = group1.add("statictext", undefined, undefined, {
    name: "statictext1",
  });
  statictext1.text = CONFIG.dialog.cmykMax.label;

  var edittext1 = group1.add('edittext {properties: {name: "edittext1"}}');
  edittext1.text = CONFIG.dialog.cmykMax.value;

  // GROUP2
  // ======
  var group2 = dialog.add("group", undefined, { name: "group2" });
  group2.orientation = "row";
  group2.alignChildren = ["left", "center"];
  group2.spacing = 10;
  group2.margins = 0;
  var statictext2 = group2.add("statictext", undefined, undefined, {
    name: "statictext2",
  });
  statictext2.text = CONFIG.dialog.layerName.label;
  var edittext2 = group2.add('edittext {properties: {name: "edittext2"}}');
  edittext2.text = CONFIG.dialog.layerName.value;

  // var checkbox2 = dialog.add("checkbox", undefined, undefined, {
  //   name: "checkbox2",
  // });
  // checkbox2.text = CONFIG.dialog.ignoreHidden.label;
  // checkbox2.value = CONFIG.dialog.ignoreHidden.value;

  var checkbox1 = dialog.add("checkbox", undefined, undefined, {
    name: "checkbox1",
  });
  checkbox1.text = CONFIG.dialog.alerts.label;
  checkbox1.value = CONFIG.dialog.alerts.value;

  // DIALOG
  // ======
  var group3 = dialog.add("group", undefined, { name: "group3" });
  group3.orientation = "row";
  group3.alignChildren = ["right", "center"];
  group3.spacing = 10;
  group3.margins = 0;
  var button2 = group3.add("button", undefined, undefined, { name: "button2" });
  button2.text = CONFIG.dialog.clearBtn.label;
  button2.alignment = ["right", "top"];

  var button1 = group3.add("button", undefined, undefined, { name: "button1" });
  button1.text = CONFIG.dialog.runBtn.label;
  button1.alignment = ["right", "top"];

  button1.onClick = function () {
    getAllHighSaturationColors({
      max: edittext1.text,
      layerName: edittext2.text,
      alerts: checkbox1.value,
      // ignoreHidden: checkbox2.value,
    });
    if (CONFIG.dialog.runBtn.closeOnRun) {
      dialog.close();
    }
  };
  button2.onClick = function () {
    var target = findLayerByName(edittext2.text);
    target.remove();
    dialog.close();
  };
  dialog.show();
}

function reportOpts(opts) {
  alert(opts.max);
  alert(opts.layerName);
  alert(opts.alerts);
}

init();
