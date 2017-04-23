// live binding helper using matches selector
Element.prototype.matches = Element.prototype.matches ||
    Element.prototype.webkitMatchesSelector ||
    Element.prototype.msMatchesSelector;
/* Event delegation allows us to avoid adding event listeners to specific nodes; 
instead, the event listener is added to one parent. That event listener analyses
bubbled events to find a match on child elements. */
const $live = (selector, event, callback, parent = document.body) => {
    const handler = e => {
        let found,
            el = e.target;
        while (el && el !== parent && !(found = el.matches(selector))) {
            el = el.parentNode;
        }
        if(found) {
            callback.call(el, e);
        }
    };
    parent.addEventListener(event, handler);
    return () => parent.removeEventListener(event, handler);
}