
/**
 * Linear easing.
 * @class
 * @type {Linear}
 * @description
 * Formula
 * `return x;`
 */
var Linear = function(v) { return v; }

/**
* Class that implements the animation/tweening features of SuitJS.
* @class
* @type Reel
*/
var Reel={};
(function(window,document,body) {

	"use strict";

	console.log("Reel> Init v1.0.0");

	if(window.Servant==null) { console.error("Reel> Servant framework wasn't found!"); return; }
    
    //List of supported units.
    var m_units = ["px","%","em","rem","mm","cm","vw","vh","vmin","vmax","ex","ch","cm","pt","pc"];
    
     /**
     * Function that transforms the animation progress and eases the rate of change of the animated value.
     * @callback Easing
     * @param {Number} p_progress - Animation progress inside the range `[0.0,1.0]`.
     * @returns {Number} - Returns the mapped progress inside the range `[0.0,1.0]`.
     */     
    
     /**
     * Animation node.
     * @typedef {Object} ReelAnimation
     * @property {Object} target - Target object being animated.
     * @property {String} property - Property name.
     * @property {Object} value - Final value.
     * @property {Easing} easing - Animation easing.
     * @property {Number} delay - Delay in seconds.
     * @property {Number} duration - Duration in seconds.
     * @property {Number} elapsed - Elapsed time of execution in seconds.
     * @property {Number} progress - Animation progress in the range `[0.0,1.0]`.
     * @property {?(String|Function)} oncomplete - On complete callback. Can be either a function or `Suit`notification string. 
     * @property {?Boolean} runOnBackground - Flag that indicates this node will keep running when the tab isn't focused.
     * @property {Function} update() - Execution method.    
     */ 
    
	/**
	* List of active animations.
    * @type {ReelAnimation[]}
	*/
	Reel.list = [];

	/**
	* Default duration in seconds when none is specified. Defaults to '0.3' seconds.
    * @type {Number}
	*/
	Reel.defaultDuration = 0.3;

    /**
     * Default easing when none is specified. Defaults to 'Linear'.
     * @type {Easing}
     */
	Reel.defaultEasing = Linear;

    /**
     * Adds an Animation to the execution loop.
	 * @param  {Object} p_target - Target object being animated.
	 * @param  {String} p_property - Property to animate.
	 * @param  {Object} p_value - Final value of the property.
	 * @param  {?Number} p_duration - Duration in seconds. Defaults to `Reel.defaultDuration`.
	 * @param  {?Number} p_delay - Delay before animation. Defaults to `0.0`.
	 * @param  {?Easing} p_easing - Animation easing. Defaults to `Reel.defaultEasing`.
	 * @param  {?Boolean} p_run_on_background - Flag that indicates the loop will keep running when the tab isn't focused.
     * @returns {ReelAnimation} - Reference to the animation node created.
     * @example
     * var b = document.body;
     * b.style.backgroundColor = "#fff";
     * //Will animate with defaultEasing the 'body' background color during 3s but waiting 1s to start.
     * Reel.add(b.style,"backgroundColor","#f00",3.0,1.0,Cubic.out);
	 */    
	Reel.add =	
	function add(p_target,p_property,p_value,p_duration,p_delay,p_easing,p_run_on_background) {  

		var a 		   = Servant;		
		var dl 		   = p_delay    == null ? 0.0 : p_delay;
		var d  		   = p_duration == null ? Reel.defaultDuration : p_duration;
		var fn 		   = p_easing   == null ? Reel.defaultEasing : p_easing;
		var hasStart  = false;
		var hasFinish = false;
		var v0		   = null;		
		var l		   = Reel.list;
		var isString  = typeof(p_target[p_property]) == "string";
		var isNumber  = typeof(p_target[p_property]) == "number";
		var isObject  = typeof(p_target[p_property]) == "object";
		var vf		   = isString ? (p_value+"") : p_value;
		var unit       = "";
		var isColor   = false;
		
		var c		   = {r:0,g:0,b:0};

		if(isString) {

			var v   = vf.toLowerCase();
			unit    = "";
            for(var i=0;i<m_units.length;i++) { if(v.indexOf(m_units[i])  >= 0) { unit = m_units[i]; break; } }             
			isColor = (v.indexOf("rgb") >= 0) ? true : false;			

			if(!isColor) {

				if(v.indexOf("#")>=0) {

					v      = v.replace("#","");
					var cr = parseInt(v.length >= 6 ? v.substr(0,2) : v.substr(0,1)+v.substr(0,1),16);
					var cg = parseInt(v.length >= 6 ? v.substr(2,2) : v.substr(1,1)+v.substr(1,1),16);
					var cb = parseInt(v.length >= 6 ? v.substr(4,2) : v.substr(2,1)+v.substr(2,1),16);
					vf = "rgb("+cr+","+cg+","+cb+")";
					isColor = true;
				}
			}
		}
		
		var res = 
		a.run(function(n) {			

			if(!hasStart) {

				Reel.stop(p_target,p_property,[n]);				

				v0 = p_target[p_property];				
				if(isString) {					

					if(isColor) {

						if(v0 == "") v0 = "rgb(255,255,255)";						
						v0 = v0.replace("rgb","").replace("(","").replace(")","").split(",");									
						vf = vf.replace("rgb","").replace("(","").replace(")","").split(",");						
						v0 = {r: parseInt(v0[0]), g: parseInt(v0[1]), b: parseInt(v0[2])};
						vf = {r: parseInt(vf[0]), g: parseInt(vf[1]), b: parseInt(vf[2])};
					}
					else {

						if(v0 == "") v0 = p_property == "opacity" ? "1.0" : "0.0";
						v0 = v0.replace(unit,"");
						v0 = unit == "" ? parseFloat(v0) : parseInt(v0);					
						vf = vf.replace(unit,"");
						vf = unit == "" ? parseFloat(vf) : parseInt(vf);
					}					
				}										
				hasStart = true;				
			}
			
			var v1 = null;
            
            var r = fn(n.progress);
			
			if(isString) {

				if(isColor) {
                                        
					c.r = Math.floor(v0.r + (vf.r-v0.r) * r);
					c.g = Math.floor(v0.g + (vf.g-v0.g) * r);
					c.b = Math.floor(v0.b + (vf.b-v0.b) * r);
					v1 = "rgb("+c.r+","+c.g+","+c.b+")";

				}
				else {

					var res = v0 + (vf-v0) * r;
					
					if(unit!="") res = Math.floor(res);

					v1 = res+""+unit;
				}
			}
			else {

				v1 = v0 + (vf-v0) * r;

			}	

			p_target[p_property] = v1;
			
			if(n.progress >= 1.0) {

				if(!hasFinish) { 


					if(n.oncomplete != null) {

						if(typeof(n.oncomplete)=="string") {
							if(window.Suit==null) { 
								console.error("Reel> Suit framework not found!"); 
							}
							window.Suit.controller.dispatch(n.oncomplete,n);
						}
						else {
							n.oncomplete(n);
						}
					}

					hasFinish=true; 
					var idx = l.indexOf(n);
					if(idx>=0) l.splice(idx,1);					
				}
			}			
		},d,dl,p_run_on_background);

		res.target   = p_target;
		res.property = p_property;
		res.value    = p_value;
		res.easing   = fn;
		res.delay    = dl;

		l.push(res);

		return res;
	};

    /**
     * Remove Animations that matches the specified criteria.
	 * @param  {Object} p_target - Target object being animated.
	 * @param  {?String} p_property - Property name to match. Defaults to `""` (stop all).
	 * @param  {?ReelAnimation[]} p_ignore_list - List of animation nodes that must be ignored in the query.
     * @example
     * var b = document.body;
     * //Starts animations.
     * Reel.add(b.style,"backgroundColor","#f00",3.0);
     * Reel.add(b.style,"width","50px",3.0);	 
     * 
     * Reel.stop(b,"width"); //Stops only the 'width' animation
     * Reel.stop(b);         //Stops all animations for 'b'
	 */    
	Reel.stop =    
	function stop(p_target,p_property,p_ignore_list) {		

		var l  	   = Reel.list;
		
		var il 	   = p_ignore_list == null ? [] : p_ignore_list;
		p_property = p_property == null ? "" : p_property;

		for(var i=0;i<l.length;i++) {

			var matchTarget = p_target == null ? true : (l[i].target == p_target);

			if(matchTarget) {

				var matchProperty = (l[i].property == p_property) || (p_property == "");

				if(matchProperty) {

					if(il.indexOf(l[i])<0) {

						Servant.remove(l[i]);
						l.splice(i--,1);
					}
				}
			}
		}
	};

})(window,document,document.body);

/**
 * Easing Equations by Robert Penner [http://robertpenner.com/easing/]
 * More information [http://easings.net/]
 */

var PI2     = Math.PI*2.0;
var HalfPI  = Math.PI*0.5;
var PI      = Math.PI;

/**
 * Quadratic easings.
 * @class
 * @type {Quad}
 */
var Quad = {};
(function() {
    
    /**
     * Quadratic In.
     * Formula
     * `return x^2;`
     */
    Quad.in = function(v) { return v*v; };
    
    /**
     * Quadratic Out.
     * Formula
     * `return -x*(x-2);`
     */
    Quad.out = function(v) { return -v*(v-2); };
    
    /**
     * Quadratic In-Out
     * Formula
     * ```
     * if ((x*=2.0) < 1.0) return 0.5*x*x;
	 * return -0.5 * ((--x)*(x-2.0) - 1.0);
     * ```
     */
    Quad.inout = function(v) {   
        if ((v*=2.0) < 1.0) return 0.5*v*v;
		return -0.5 * ((--v)*(v-2.0) - 1.0);                
    };
    
})();

/**
 * Cubic easings.
 * @class
 * @type {Cubic}
 */
var Cubic = {};
(function() {
    
    /**
     * Cubic In.
     * Formula
     * `return x^3;`
     */
    Cubic.in = function(v) { return v*v*v; };
    
    /**
     * Cubic Out.
     * Formula
     * `return ((x=x-1)*x*x + 1.0);`
     */
    Cubic.out = function(v) { return ((v=v-1)*v*v + 1.0); };
    
    /**
     * Cubic In-Out
     * Formula
     * ```
     * if ((x*=2.0) < 1.0) return 0.5*(x^3);
     * return 0.5*((x-=2.0)*x*x + 2.0);
     * ```
     */
    Cubic.inout = function(v) {
        if ((v*=2.0) < 1.0) return 0.5*v*v*v;
        return 0.5*((v-=2.0)*v*v + 2.0);                
    };
    
})();

/**
 * Quartic easings.
 * @class
 * @type {Quartic}
 */
var Quartic = {};
(function() {
    
    /**
     * Quartic In.
     * Formula
     * `return x^4;`
     */
    Quartic.in = function(v) { return v*v*v*v; };
    
    /**
     * Cubic Out.
     * Formula
     * `return -((x-1)*(x^3))-1;`
     */
    Quartic.out = function(v) { return -(((v=v-1.0)*v*v*v) - 1.0); };
    
    /**
     * Quartic In-Out
     * Formula
     * ```
     * if ((x*=2.0) < 1.0) return 0.5*(x^4);
     * return -0.5 * (((x-=2.0)*(x^3)) - 2.0);
     * ```
     */
    Quartic.inout = function(v) {
        if ((v*=2.0) < 1.0) return 0.5*v*v*v*v;
        return -0.5 * ((v-=2.0)*v*v*v - 2.0);                
    };
    
})();

/**
 * Quintic easings.
 * @class
 * @type {Quintic}
 */
var Quintic = {};
(function() {
    
    /**
     * Quintic In.
     * Formula
     * `return x^5;`
     */
    Quintic.in = function(v) { return v*v*v*v*v; };
    
    /**
     * Quintic Out.
     * Formula
     * `return ((x-1)*(x^4)) + 1;`
     */
    Quintic.out = function(v) { return ((v=v-1)*v*v*v*v + 1); };
    
    /**
     * Quintic In-Out
     * Formula
     * ```
     * if ((x*=2.0) < 1.0) return 0.5*(x^5);
     * return 0.5*((x-=2)*(x^4) + 2);
     * ```
     */
    Quintic.inout = function(v) {
        if ((v*=2.0) < 1.0) return 0.5*v*v*v*v*v;
        return 0.5*((v-=2)*v*v*v*v + 2);                
    };
    
})();

/**
 * Sine easings.
 * @class
 * @type {Sine}
 */
var Sine = {};
(function() {
    
    /**
     * Sine In.
     * Formula
     * `return -cos(x*PI*0.5)+1.0;`
     */
    Sine.in = function(v) { return -Math.cos(v * HalfPI) + 1.0; };
    
    /**
     * Sine Out.
     * Formula
     * `return sin(x*PI*0.5);`
     */
    Sine.out = function(v) { return Math.sin(v * HalfPI); };
    
    /**
     * Sine In-Out
     * Formula
     * `return -0.5*(cos(PI*x)-1.0);`
     */
    Sine.inout = function(v) { return -0.5 * (Math.cos(PI*v) - 1.0); };
    
})();

/**
 * Exponential easings.
 * @class
 * @type {Expo}
 */
var Expo = {};
(function() {
    
    /**
     * Expo In.
     * Formula
     * `return x==0.0 ? 0.0 : 2.0^(10.0 * (x-1));`
     */
    Expo.in = function(v) { return (Math.abs(v)<=0.0001) ? 0 : Math.pow(2.0, 10.0 * (v - 1.0)); };
    
    /**
     * Expo Out.
     * Formula
     * `return x==1.0 ? 1.0 : (-2.0^(-10.0*x))+1.0;`
     */
    Expo.out = function(v) { return Math.abs(v-1.0)<=0.0001 ? 1.0 : -Math.pow(2.0, -10.0 * v) + 1; };
    
    /**
     * Expo In-Out
     * Formula
     * ```
     *  if(x==0.0) return 0.0;
     *  if(x==1.0) return 1.0;		
     *	if ((x*=2.0) < 1.0) return 0.5 * Math.pow(2.0, 10.0 * (x - 1));
	 *	return 0.5 * (-Math.pow(2.0, -10.0 * (--x)) + 2.0); 
     * ```
     */
    Expo.inout = function(v) {
        if (Math.abs(v)    <=0.0001) return 0.0;
        if (Math.abs(v-1.0)<=0.0001) return 1.0;		
		if ((v*=2.0) < 1.0) return 0.5 * Math.pow(2.0, 10.0 * (v - 1));
		return 0.5 * (-Math.pow(2.0, -10.0 * (--v)) + 2.0);                
    };
    
})();

/**
 * Circular easings.
 * @class
 * @type {Circ}
 */
var Circ = {};
(function() {
    
    /**
     * Circ In.
     * Formula
     * `return -(sqrt(1.0 - (x^2)) - 1.0);`
     */
    Circ.in = function(v) { return -(Math.sqrt(1.0 - (v*v)) - 1.0); };
    
    /**
     * Circ Out.
     * Formula
     * `return sqrt(1.0 - (x=x-1)*x);`
     */
    Circ.out = function(v) { return Math.sqrt(1.0 - (v=v-1)*v); };
    
    /**
     * Circ In-Out
     * Formula
     * ```
     * if ((x*=2.0) < 1.0) return -0.5 * (sqrt(1.0 - (x^2)) - 1.0);
     * return 0.5 * (sqrt(1.0 - (x-=2.0)*x) + 1.0);
     * ```
     */
    Circ.inout = function(v) {
        if ((v*=2.0) < 1.0) return -0.5 * (Math.sqrt(1.0 - (v*v)) - 1.0);
		return 0.5 * (Math.sqrt(1.0 - (v-=2.0)*v) + 1.0);        
    };
    
})();

/**
 * Elastic easings.
 * @class
 * @type {Elastic}
 */
var Elastic = {};
(function() {
    
    /**
     * Elastic In.
     * Formula
     * ```
     * if(x==0.0) return 0.0;
     * if(x==1.0) return 1.0;
     * return -((2.0^(10.0*(x-=1)) * sin((x-0.075)*PI*2.0*3.3333));
     * ```
     */
    Elastic.in = function(v) {            
		if (Math.abs(v)    <=0.0001) return 0.0;
        if (Math.abs(v-1.0)<=0.0001) return 1.0;
		return -(Math.pow(2.0,10.0*(v-=1)) * Math.sin( (v-0.075)*PI2*3.3333));
    };
    
    /**
     * Elastic Out.
     * Formula
     * ```
     * if(x==0.0) return 0.0;
     * if(x==1.0) return 1.0;
     * return (2.0^(-10.0*x)) * sin((x-0.075)*PI*2.0*3.3333)+1.0);
     * ```

     */
    Elastic.out = function(v) {        
        if (Math.abs(v)    <=0.0001) return 0.0;
        if (Math.abs(v-1.0)<=0.0001) return 1.0;
        return (Math.pow(2.0,-10.0*v) * Math.sin((v-0.075)*PI2*3.3333)+1.0);        
    };
    
    /**
     * Elastic In-Out
     * Formula
     * ```
     * if(x==0.0) return 0.0;
     * if(x==1.0) return 1.0;
     * if (x < 1.0) return -0.5*((2.0^(10.0*(x-=1.0)))*sin((x-0.1125)*PI*2.0*2.2222));
     * return (pow(2.0,-10.0*(x-=1)) * sin((x-0.1125)*PI2*2.22222)*0.5) + 1.0;
     * ```
     */
    Elastic.inout = function(v) {        
        if (Math.abs(v)     <=0.0001) return 0.0;  
        if (Math.abs(v-1.0) <=0.0001) return 1.0;
        if (v < 1.0) return -0.5*(Math.pow(2.0,10.0*(v-=1.0)) * Math.sin((v-0.1125)*PI2*2.2222));
        return (Math.pow(2.0,-10.0*(v-=1)) * Math.sin((v-0.1125)*PI2*2.22222)*0.5) + 1.0;
    };
    
})();

/**
 * Back easings.
 * @class
 * @type {Elastic}
 */
var Back = {};
(function() {
    
    /**
     * Back In.
     * Formula
     * `return  (x^2)*((2.70158*x) - 1.70158);`
     */
    Back.in = function(v) { return v*v*((2.70158*v) - 1.70158); };
    
    /**
     * Back Out.
     * Formula
     * `return ((x-1)*x*((2.70158*x) + 1.70158) + 1.0);`
     */
    Back.out = function(v) { return ((v=v-1.0)*v*((2.70158*v) + 1.70158) + 1.0); };
    
    /**
     * Back In-Out
     * Formula
     * ```
     * if ((x*=2.0) < 1.0) return 0.5*((x^2)*((3.5949095*x) - 2.5949095));
	 * return 0.5*((x-=2.0)*x*((3.5949095)*x + 2.5949095) + 2.0);
     * ```
     */
    Back.inout = function(v) {
        if ((v*=2.0) < 1.0) return 0.5*(v*v*((3.5949095*v) - 2.5949095));
        return 0.5*((v-=2.0)*v*((3.5949095)*v + 2.5949095) + 2.0);        		
    };
    
})();

/**
 * Bounce easings.
 * @class
 * @type {Bounce}
 */
var Bounce = {};
(function() {
    
    /**
     * Bounce In.
     * Formula
     * `return 1.0 - Bounce.out(1.0-x);`
     */
    Bounce.in = function(v) { return 1.0 - Bounce.out(1.0-v); };
    
    /**
     * Bounce Out.
     * Formula
     * ```
     *  if (x < 0.363636) return (7.5625*x*x); else 
     *  if (x < 0.727272) return ((7.5625*(x-=0.545454)*x) + 0.75); else 
     *  if (x < 0.909090) return ((7.5625*(x-=0.818181)*x) + 0.9375); else			
	 *	return ((7.5625*(x-=0.954545)*x) + 0.984375); 
     * ```
     */
    Bounce.out = function(v) {
        if (v < 0.363636) return (7.5625*v*v); else 
        if (v < 0.727272) return ((7.5625*(v-=0.545454)*v) + 0.75); else 
        if (v < 0.909090) return ((7.5625*(v-=0.818181)*v) + 0.9375); else			
		return ((7.5625*(v-=0.954545)*v) + 0.984375); 
    };
    
    /**
     * Bounce In-Out
     * Formula
     * ```
     *  if (x < 0.5) return Bounce.in(x*2) * 0.5;
	 *	return (Bounce.out((x*2.0)-1.0) * 0.5) + 0.5;
     * ```
     */
    Bounce.inout = function(v) {
        if (v < 0.5) return Bounce.in(v*2) * 0.5;
		return (Bounce.out((v*2.0)-1.0) * 0.5) + 0.5;                
    };
    
})();