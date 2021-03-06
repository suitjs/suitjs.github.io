var Time = {};

(function(window, document, body) {
    "use strict";
    if (Date.now == null) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }
    var m_hasPerfTime = window.performance != null;
    Time.hasPerfTime = m_hasPerfTime;
    Time.elapsed = 0;
    Time.delta = 0;
    Time.clock = function timeClock() {
        return m_hasPerfTime ? window.performance.now() : Date.now();
    };
})(window, document, document.body);

var Servant = {};

(function(window, document, body) {
    "use strict";
    console.log("Servant> Init v1.0.0");
    Servant.hasReqAnimFrame = window.requestAnimationFrame != null;
    var RAFId = -1;
    var itvId = -1;
    var m_stepClock = -1;
    var m_rafOffset = 0;
    var m_itvOffsetClock = 0;
    var m_rafOffsetClock = 0;
    var m_itvOffset = 0;
    var m_list = [];
    var m_perfOffset = 0;
    Servant.list = m_list;
    var m_timeLast = -1;
    var m_timeUpdate = function timeUpdate(t) {
        t *= .001;
        if (m_timeLast < 0) m_timeLast = t;
        Time.delta = Math.max(.01, t - m_timeLast);
        m_timeLast = t;
        Time.elapsed += Time.delta;
    };
    var m_step = function step(p_time, p_visible) {
        var a = Servant;
        if (m_stepClock < 0) m_stepClock = p_time;
        var t = p_time;
        var dt = Math.max(1, t - m_stepClock);
        m_stepClock = t;
        var steps = p_visible ? 1 : Math.min(62, Math.max(1, Math.floor(dt / 16)));
        for (var i = 0; i < steps; i++) {
            m_timeUpdate(t);
            for (var j = 0; j < m_list.length; j++) {
                var enabled = p_visible ? true : m_list[j].runOnBackground == true;
                if (enabled) m_list[j].update();
            }
            if (!Time.hasPerfTime) t += 1e3 / 60;
        }
    };
    var m_rafLoop = function rafLoop(p_time) {
        var a = Servant;
        RAFId = window.requestAnimationFrame(m_rafLoop);
        var t = Time.hasPerfTime ? window.performance.now() : p_time;
        m_step(t - m_rafOffsetClock, true);
        return true;
    };
    var m_itvLoop = function itvLoop() {
        var a = Servant;
        var v = document.visibilityState != null ? document.visibilityState != "hidden" : true;
        if (a.hasReqAnimFrame) if (v) return;
        var t = Time.clock();
        a.step(t - m_itvOffsetClock, v);
    };
    var m_cancelRAF = function cancelRAF() {
        if (RAFId >= 0) window.cancelAnimationFrame(RAFId);
        RAFId = -1;
    };
    var m_cancelItv = function cancelItv() {
        if (itvId >= 0) window.clearInterval(itvId);
        itvId = -1;
    };
    Servant.start = function start() {
        var a = Servant;
        a.stop();
        m_stepClock = -1;
        m_itvOffsetClock = Time.clock();
        itvId = window.setInterval(a.itvLoop, 16);
        m_rafOffsetClock = Time.hasPerfTime ? window.performance.now() : 0;
        if (a.hasReqAnimFrame) a.RAFId = window.requestAnimationFrame(m_rafLoop);
    };
    Servant.stop = function stop() {
        var a = Servant;
        m_cancelItv();
        if (a.hasReqAnimFrame) m_cancelRAF();
    };
    Servant.clear = function clear() {
        var a = Servant;
        a.list = m_list = [];
    };
    Servant.add = function add(p_node, p_run_on_background) {
        var a = Servant;
        if (a.list.indexOf(p_node) >= 0) return;
        p_node.runOnBackground = p_run_on_background == true;
        a.list.push(p_node);
    };
    Servant.remove = function remove(p_node) {
        var a = Servant;
        var idx = a.list.indexOf(p_node);
        if (idx < 0) return null;
        var n = a.list.splice(idx, 1);
        return n;
    };
    var m_invokeCallback = function invokeCallback(p_callback, p_is_str, p_complete, p_task) {
        if (p_is_str) {
            var type = p_complete ? "complete" : "update";
            window.Suit.controller.dispatch(p_callback + "@" + type, p_task);
        } else {
            p_callback(p_task);
        }
    };
    Servant.run = function run(p_callback, p_duration, p_delay, p_run_on_background) {
        var isString = typeof p_callback == "string";
        if (window.Suit == null) if (isString) {
            console.error("Servant> Suit framework not found!");
            return null;
        }
        var n = {};
        n.progress = 0;
        n.duration = p_duration != null ? p_duration : 16777215;
        n.elapsed = p_delay != null ? -p_delay : 0;
        n.update = function() {
            if (n.elapsed >= 0) m_invokeCallback(p_callback, isString, false, n);
            n.elapsed = Math.min(n.duration, n.elapsed + Time.delta);
            n.progress = Math.min(1, n.duration <= 0 ? 1 : n.elapsed / n.duration);
            if (n.elapsed >= n.duration) {
                m_invokeCallback(p_callback, isString, true, n);
                Servant.remove(n);
                return;
            }
        };
        Servant.add(n, p_run_on_background);
        return n;
    };
    Servant.delay = function delay(p_callback, p_delay, p_args, p_run_on_background) {
        var isString = typeof p_callback == "string";
        if (window.Suit == null) if (isString) {
            console.error("Servant> Suit framework not found!");
            return;
        }
        var al = p_args == null ? [] : p_args;
        return Servant.run(function(n) {
            if (isString) {
                window.Suit.controller.dispatch(p_callback + "@complete", p_args);
            } else {
                p_callback.apply(window, al);
            }
        }, 0, p_delay ? p_delay : 0, p_run_on_background);
    };
    Servant.set = function set(p_target, p_property, p_value, p_delay, p_run_on_background) {
        return Servant.run(function(n) {
            p_target[p_property] = p_value;
        }, 0, p_delay == null ? 0 : p_delay, p_run_on_background);
    };
    Servant.iterate = function iterate(p_callback, p_list, p_step, p_timeout, p_run_on_background) {
        var k = 0;
        var stp = p_step == null ? 1 : p_step;
        var d = p_timeout != null ? p_timeout : 16777215;
        return Servant.run(function(n) {
            for (var i = 0; i < stp; i++) {
                if (k >= p_list.length) {
                    Servant.remove(n);
                    break;
                }
                p_callback(p_list[k], k, p_list.length);
                k++;
            }
        }, d, 0, p_run_on_background);
    };
})(window, document, document.body);

Servant.start();