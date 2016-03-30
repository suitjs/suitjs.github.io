var Linear = function(v) {
    return v;
};

var Reel = {};

(function(window, document, body) {
    "use strict";
    console.log("Reel> Init v1.0.0");
    if (window.Servant == null) {
        console.error("Reel> Servant framework wasn't found!");
        return;
    }
    var m_units = [ "px", "%", "em", "rem", "mm", "cm", "vw", "vh", "vmin", "vmax", "ex", "ch", "cm", "pt", "pc" ];
    Reel.list = [];
    Reel.defaultDuration = .3;
    Reel.defaultEasing = Linear;
    Reel.add = function add(p_target, p_property, p_value, p_duration, p_delay, p_easing, p_run_on_background) {
        var a = Servant;
        var dl = p_delay == null ? 0 : p_delay;
        var d = p_duration == null ? Reel.defaultDuration : p_duration;
        var fn = p_easing == null ? Reel.defaultEasing : p_easing;
        var hasStart = false;
        var hasFinish = false;
        var v0 = null;
        var l = Reel.list;
        var isString = typeof p_target[p_property] == "string";
        var isNumber = typeof p_target[p_property] == "number";
        var isObject = typeof p_target[p_property] == "object";
        var vf = isString ? p_value + "" : p_value;
        var unit = "";
        var isColor = false;
        var c = {
            r: 0,
            g: 0,
            b: 0
        };
        if (isString) {
            var v = vf.toLowerCase();
            unit = "";
            for (var i = 0; i < m_units.length; i++) {
                if (v.indexOf(m_units[i]) >= 0) {
                    unit = m_units[i];
                    break;
                }
            }
            isColor = v.indexOf("rgb") >= 0 ? true : false;
            if (!isColor) {
                if (v.indexOf("#") >= 0) {
                    v = v.replace("#", "");
                    var cr = parseInt(v.length >= 6 ? v.substr(0, 2) : v.substr(0, 1) + v.substr(0, 1), 16);
                    var cg = parseInt(v.length >= 6 ? v.substr(2, 2) : v.substr(1, 1) + v.substr(1, 1), 16);
                    var cb = parseInt(v.length >= 6 ? v.substr(4, 2) : v.substr(2, 1) + v.substr(2, 1), 16);
                    vf = "rgb(" + cr + "," + cg + "," + cb + ")";
                    isColor = true;
                }
            }
        }
        var res = a.run(function(n) {
            if (!hasStart) {
                Reel.stop(p_target, p_property, [ n ]);
                v0 = p_target[p_property];
                if (isString) {
                    if (isColor) {
                        if (v0 == "") v0 = "rgb(255,255,255)";
                        v0 = v0.replace("rgb", "").replace("(", "").replace(")", "").split(",");
                        vf = vf.replace("rgb", "").replace("(", "").replace(")", "").split(",");
                        v0 = {
                            r: parseInt(v0[0]),
                            g: parseInt(v0[1]),
                            b: parseInt(v0[2])
                        };
                        vf = {
                            r: parseInt(vf[0]),
                            g: parseInt(vf[1]),
                            b: parseInt(vf[2])
                        };
                    } else {
                        if (v0 == "") v0 = p_property == "opacity" ? "1.0" : "0.0";
                        v0 = v0.replace(unit, "");
                        v0 = unit == "" ? parseFloat(v0) : parseInt(v0);
                        vf = vf.replace(unit, "");
                        vf = unit == "" ? parseFloat(vf) : parseInt(vf);
                    }
                }
                hasStart = true;
            }
            var v1 = null;
            var r = fn(n.progress);
            if (isString) {
                if (isColor) {
                    c.r = Math.floor(v0.r + (vf.r - v0.r) * r);
                    c.g = Math.floor(v0.g + (vf.g - v0.g) * r);
                    c.b = Math.floor(v0.b + (vf.b - v0.b) * r);
                    v1 = "rgb(" + c.r + "," + c.g + "," + c.b + ")";
                } else {
                    var res = v0 + (vf - v0) * r;
                    if (unit != "") res = Math.floor(res);
                    v1 = res + "" + unit;
                }
            } else {
                v1 = v0 + (vf - v0) * r;
            }
            p_target[p_property] = v1;
            if (n.progress >= 1) {
                if (!hasFinish) {
                    if (n.oncomplete != null) {
                        if (typeof n.oncomplete == "string") {
                            if (window.Suit == null) {
                                console.error("Reel> Suit framework not found!");
                            }
                            window.Suit.controller.dispatch(n.oncomplete, n);
                        } else {
                            n.oncomplete(n);
                        }
                    }
                    hasFinish = true;
                    var idx = l.indexOf(n);
                    if (idx >= 0) l.splice(idx, 1);
                }
            }
        }, d, dl, p_run_on_background);
        res.target = p_target;
        res.property = p_property;
        res.value = p_value;
        res.easing = fn;
        res.delay = dl;
        l.push(res);
        return res;
    };
    Reel.stop = function stop(p_target, p_property, p_ignore_list) {
        var l = Reel.list;
        var il = p_ignore_list == null ? [] : p_ignore_list;
        p_property = p_property == null ? "" : p_property;
        for (var i = 0; i < l.length; i++) {
            var matchTarget = p_target == null ? true : l[i].target == p_target;
            if (matchTarget) {
                var matchProperty = l[i].property == p_property || p_property == "";
                if (matchProperty) {
                    if (il.indexOf(l[i]) < 0) {
                        Servant.remove(l[i]);
                        l.splice(i--, 1);
                    }
                }
            }
        }
    };
})(window, document, document.body);

var PI2 = Math.PI * 2;

var HalfPI = Math.PI * .5;

var PI = Math.PI;

var Quad = {};

(function() {
    Quad.in = function(v) {
        return v * v;
    };
    Quad.out = function(v) {
        return -v * (v - 2);
    };
    Quad.inout = function(v) {
        if ((v *= 2) < 1) return .5 * v * v;
        return -.5 * (--v * (v - 2) - 1);
    };
})();

var Cubic = {};

(function() {
    Cubic.in = function(v) {
        return v * v * v;
    };
    Cubic.out = function(v) {
        return (v = v - 1) * v * v + 1;
    };
    Cubic.inout = function(v) {
        if ((v *= 2) < 1) return .5 * v * v * v;
        return .5 * ((v -= 2) * v * v + 2);
    };
})();

var Quartic = {};

(function() {
    Quartic.in = function(v) {
        return v * v * v * v;
    };
    Quartic.out = function(v) {
        return -((v = v - 1) * v * v * v - 1);
    };
    Quartic.inout = function(v) {
        if ((v *= 2) < 1) return .5 * v * v * v * v;
        return -.5 * ((v -= 2) * v * v * v - 2);
    };
})();

var Quintic = {};

(function() {
    Quintic.in = function(v) {
        return v * v * v * v * v;
    };
    Quintic.out = function(v) {
        return (v = v - 1) * v * v * v * v + 1;
    };
    Quintic.inout = function(v) {
        if ((v *= 2) < 1) return .5 * v * v * v * v * v;
        return .5 * ((v -= 2) * v * v * v * v + 2);
    };
})();

var Sine = {};

(function() {
    Sine.in = function(v) {
        return -Math.cos(v * HalfPI) + 1;
    };
    Sine.out = function(v) {
        return Math.sin(v * HalfPI);
    };
    Sine.inout = function(v) {
        return -.5 * (Math.cos(PI * v) - 1);
    };
})();

var Expo = {};

(function() {
    Expo.in = function(v) {
        return Math.abs(v) <= 1e-4 ? 0 : Math.pow(2, 10 * (v - 1));
    };
    Expo.out = function(v) {
        return Math.abs(v - 1) <= 1e-4 ? 1 : -Math.pow(2, -10 * v) + 1;
    };
    Expo.inout = function(v) {
        if (Math.abs(v) <= 1e-4) return 0;
        if (Math.abs(v - 1) <= 1e-4) return 1;
        if ((v *= 2) < 1) return .5 * Math.pow(2, 10 * (v - 1));
        return .5 * (-Math.pow(2, -10 * --v) + 2);
    };
})();

var Circ = {};

(function() {
    Circ.in = function(v) {
        return -(Math.sqrt(1 - v * v) - 1);
    };
    Circ.out = function(v) {
        return Math.sqrt(1 - (v = v - 1) * v);
    };
    Circ.inout = function(v) {
        if ((v *= 2) < 1) return -.5 * (Math.sqrt(1 - v * v) - 1);
        return .5 * (Math.sqrt(1 - (v -= 2) * v) + 1);
    };
})();

var Elastic = {};

(function() {
    Elastic.in = function(v) {
        if (Math.abs(v) <= 1e-4) return 0;
        if (Math.abs(v - 1) <= 1e-4) return 1;
        return -(Math.pow(2, 10 * (v -= 1)) * Math.sin((v - .075) * PI2 * 3.3333));
    };
    Elastic.out = function(v) {
        if (Math.abs(v) <= 1e-4) return 0;
        if (Math.abs(v - 1) <= 1e-4) return 1;
        return Math.pow(2, -10 * v) * Math.sin((v - .075) * PI2 * 3.3333) + 1;
    };
    Elastic.inout = function(v) {
        if (Math.abs(v) <= 1e-4) return 0;
        if (Math.abs(v - 1) <= 1e-4) return 1;
        if (v < 1) return -.5 * (Math.pow(2, 10 * (v -= 1)) * Math.sin((v - .1125) * PI2 * 2.2222));
        return Math.pow(2, -10 * (v -= 1)) * Math.sin((v - .1125) * PI2 * 2.22222) * .5 + 1;
    };
})();

var Back = {};

(function() {
    Back.in = function(v) {
        return v * v * (2.70158 * v - 1.70158);
    };
    Back.out = function(v) {
        return (v = v - 1) * v * (2.70158 * v + 1.70158) + 1;
    };
    Back.inout = function(v) {
        if ((v *= 2) < 1) return .5 * (v * v * (3.5949095 * v - 2.5949095));
        return .5 * ((v -= 2) * v * (3.5949095 * v + 2.5949095) + 2);
    };
})();

var Bounce = {};

(function() {
    Bounce.in = function(v) {
        return 1 - Bounce.out(1 - v);
    };
    Bounce.out = function(v) {
        if (v < .363636) return 7.5625 * v * v; else if (v < .727272) return 7.5625 * (v -= .545454) * v + .75; else if (v < .90909) return 7.5625 * (v -= .818181) * v + .9375; else return 7.5625 * (v -= .954545) * v + .984375;
    };
    Bounce.inout = function(v) {
        if (v < .5) return Bounce.in(v * 2) * .5;
        return Bounce.out(v * 2 - 1) * .5 + .5;
    };
})();