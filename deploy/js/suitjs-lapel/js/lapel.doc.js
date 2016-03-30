/**
* Class that implements the feature of webcomponents and extends the functionalities of Suit.
* @class
* @type Lapel
*/
var Lapel = {};
(function(window,document,body) {

"use strict";

console.log("Lapel> Init v1.0.0");

//Blocks the mutation handling while components are parsed.
var m_mutationLock = false;

//Reference to the first parse.
var m_schedulerId = -1;

//Flag that indicates Lapel has made the first setup.
var m_booted = false;

//Flag that indicates the Suit core framework exists in the page.
var m_hasSuit = window.Suit != null;

/**
 * Container for added components. 
 * @type {LapelComponent[]}
 */
Lapel.components = [];

//Helper function to validate if a variable is null or the wrong type and return a default result.
function assert(v,d,t) { return t==null ? (v==null ? d : v) : ((typeof(v)==t) ? v : d);	}

/**
 * Lapel Web Component.
 * @typedef {Object} LapelComponent
 * @property {String} tag - HTML tag that defines this component. Lapel will either replace or insert the 'src' contents based on this tag.
 * @property {String} src - HTML content that will either replace or fill the Element.
 * @property {?Boolean} inner - Flag that tells if 'src' will replace the tag or fill it. Defaults to true.
 * @property {LapelComponentCallback} init - Method that handles this component initialization. Setup your logic on this callback.     
 */

/**
 * Lapel Component Init Callback.
 * @typedef {Object} LapelComponentCallback
 * @property {Element|Element[]} element - Created DOM Element. Allows to do extra operations using the new created component reference. If the 'src' of the component is made of several tags an Array is returned.       
 */

/**
 * Finds a LapelComponent template based on its tag name. If none is found, null is returned.
 * @param	{String} p_tag - HTML tag of the template. 
 * @returns {LapelComponent} - Reference to the lapel component template.
 * @example
 * //Define a simple component. 
 * Lapel.add({
 *  tag: "my-component",
 *  src: "<div class='my-component'></div>"
 * });
 * 
 * var c = Lapel.find("my-component");
 * console.log(c); //{ tag: 'my-component', src: "<div class='my-component'></div>" }
 */
Lapel.find = 
function find(p_tag) {

    var l = Lapel.components;
    for (var i=0;i<l.length;i++) if (l[i].tag == p_tag) return l[i];
    return null;
};

/**
 * Creates a new instance of a LapelComponent.
 * @param  {String|LapelComponent} p_tag - Name of the template's tag or reference to the component itself.
 * @param  {?Object} p_attribs - Table of attributes for the created Element.
 * @param  {?String} p_src - String that can fill the 'textContent' variable of the created Element. Defaults to empty.
 * @returns {Element} - Reference to the created Element with features of the component.
 * @example
 * //Define a simple component.
 * ```js 
 * Lapel.add({
 *  tag: "custom-button",
 *  src: "<button class='custom'></button>"
 * });
 * 
 * var bt = Lapel.create("custom-button",{name: "cbutton"},"Click Me!");
 * console.log(bt); //<button class='custom' name="cbutton">Click Me!</button>
 * ```
 */
Lapel.create =
function create(p_tag,p_attribs,p_src) {

    var c = (typeof(p_tag)=="string") ? Lapel.find(p_tag) : p_tag;

    if (c == null) { console.error("Lapel> Component ["+p_tag+"] not found"); return null; }
    
    var it = document.createElement(c.tag);
    
    if (p_attribs != null) for(var s in p_attribs) it.setAttribute(s,p_attribs[s]);
    
    if (p_src != null) it.textContent = p_src;

    return it;
};

/**
 * Register a new component to the component pool.
 * @param  {LapelComponent} p_component - Reference to the Lapel component.
 * @returns {LapelComponent} - Reference to the added component.
 * @example
 * In the page javascript.
 * ```js
 * var c = {
 *  tag: "custom-component",
 *  src: "<div class='custom'></div>",
 *  init: function(p_element) {`
 *      p_element.textContent = "I'm Here.";
 *  },
 *  inner: false
 * };
 * Lapel.add(c);
 * ```
 * The original HTML have the custom tag. 
 * ```html 
 * <custom-component>Original Text</custom-component>
 * ```
 * Then after init.
 * ```html
 * <div class='custom'>I'm Here.</div>
 * ```
 * If `inner` is true, then the result would be.
 * ```html
 * <custom-component><div class='custom'>I'm Here.</div></component>
 * ```
 */
Lapel.add =	
function add(p_component) {		

    var l = Lapel.components;
    if (l.indexOf(p_component) >= 0) return p_component;
    
    var fn  = null;
    var evt = m_hasSuit ? "component" : "load";
    window.addEventListener(evt,
    fn = function lapelOnInit(ev) {

        if (m_schedulerId >= 0) window.clearInterval(m_schedulerId);
        m_schedulerId = window.setTimeout(function() { m_lapelBoot(); }, 1);			
        l.push(p_component);
        window.removeEventListener(evt,fn);
    });		

    if(p_component.inner==null) p_component.inner = true;
    if(p_component.init==null)  p_component.init  = null;

    return p_component;
};

//Startup Lapel after the first components.
var m_lapelBoot = 
function boot() {		

    if (!m_booted) {			

        m_mutationLock = false;
        if (window.MutationObserver != null) {

            var mo = new MutationObserver(m_lapelOnMutation);
            mo.observe(body, { subtree:true, childList:true } );
        }
        else {

            console.warn("Lapel> MutationObserver not found!");
        }
    }
    
    m_lapelSchedule();
    
    m_booted = true;
};

//Sweeps the DOM and insert components where they should appear.
var m_lapelParse =
function parse() {		

    var cl = Lapel.components;
    
    for (var i=0;i<cl.length;i++) {

        var c = cl[i];
        var l = body.querySelectorAll(c.tag);

        for (var j=0;j<l.length;j++) {				

            var v 		= l[j];
            var attribs = v.attributes;				
            var text    = v.textContent;

            if (v.isParsed != null) if (v.isParsed) continue;

            v.isParsed  = true;				
            v.innerHTML = c.src.replace("$text", text);

            m_lapelParseElement(c,v);
        }
    }		
};

//Finishes parsing the component element.
var m_lapelParseElement =
function parseElement(p_component,p_target) 	{

    var v = p_target;
    var c = p_component;

    window.setTimeout(
    function() {

        var p = v.parentElement;					
        for (var i=0; i<v.children.length;i++) {	

            var vc = v.children[i];
            for (var j=0;j<v.classList.length;j++) { 					

                if(!vc.classList.contains(v.classList[j])) vc.classList.add(v.classList[j]);
            }
            
            for (var j=0;j<v.attributes.length;j++) { 

                var a = v.attributes[j]; 
                if (a.name == "class") continue;
                vc.setAttribute(a.name, a.value);
            }
        }
        
        var is_inner = c.inner == null ? true : c.inner;

        if (is_inner) { if (c.init != null) c.init(v); return; }

        var l = [];

        var p = v.parentElement;					
        for (var i=0;i<v.children.length;i++) {	

            var vc = v.children[i];	
            l.push(vc);			
            if (v.nextSibling != null) { p.insertBefore(vc,v); } else { p.appendChild(vc); }
        }
        	
        if(l.length==1) { if (c.init != null) c.init(l[0]); } else
        if(l.length>1)  { if (c.init != null) c.init(l);	} else 
        if (c.init != null) c.init();	
        
        if(p!=null)p.removeChild(v);					

    }, 1);
};

//Callback that handles DOM changes.
var m_lapelOnMutation =
function onMutation(p_records,p_observer) {
    m_lapelSchedule();
};


//Schedules an atomic callback.
var m_lapelSchedule =
function schedule() {

    if (m_mutationLock) return;

    m_mutationLock = true;		
    m_lapelParse();
    window.setTimeout(function() { m_mutationLock = false; }, 2);
};

})(window,document,document.body);