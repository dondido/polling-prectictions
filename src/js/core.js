const $cookie = k => decodeURIComponent((document.cookie.match('(^|; )' + k + '=([^;]*)') || 0)[2] || '');
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
};
const $import = url => {
    const handleImport = (resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            resolve(script.module);
            script.remove();
        };
        script.onerror = () => {
            reject(new Error('Failed to load module script with URL ' + url));
            script.remove();
        };
        document.documentElement.appendChild(script);
    };
    return new Promise(handleImport);
};
let prevRoute;
var classes = classes || {};
const htmls = {};
const getHeader = {
  'X-Requested-With': 'XMLHttpRequest'
};
const postHeader = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-XSRF-TOKEN': $cookie('XSRF-TOKEN')
};
const getFilename = path => path.match(/([^/]*?)(?:\..*)?$/)[1] || 'home';
const toText = res => res.text();
class Router {
    getFile(files) {
        const names = [];
        const imports = [];
        const contents = [];
        const scripts = [];
        const assignContent = (content, idx) => {
            const path = names[idx];
            const filename = getFilename(path);
            path.slice(-3) === '.js' ? new classes[filename]() : htmls[filename] = content;
        };
        const createView = contents => {
            contents.forEach(assignContent);
            prevRoute = files;
        };
        const importScript = url => {
            names.push(url);
            imports.push(getFilename(url) in classes ? Promise.resolve() : $import(url));
        };
        const importContent = url => {
            names.push(url);
            const urlParams = new URLSearchParams(location.search);
            urlParams.append('ajax', 1);
            imports.push(fetch(url + '?' + urlParams.toString(), {headers: getHeader}).then(toText));
        };
        const split = url => url.slice(-3) === '.js' ? scripts.push(url) : contents.push(url);
        files.forEach(split);
        if(prevRoute) {
            contents.push(location.pathname);
            contents.forEach(importContent);
        }
        scripts.forEach(importScript);
        if(scripts.length === 0) {
            importScript('BaseView.js');
        }
        return Promise.all(imports).then(createView);
    }
    
    /* Sometimes we have a hyperlink that needs to be a hyperlink but we don’t want it
    to process and open the link but only call a javascript function. Fortunately here
    comes a little sassy function to stop the hyperlink and trigger a function call.
    This could be very useful for changing the view of the page or adding information
    to it when making AJAX requests or asynchronous module loading instead of preserving
    the link natural behaviour and redirecting. This architecture help us provide
    graceful degradation functionality and provides key driver of SEO goodnes. */
    handleClick(e) {
        let el = e.target;
        /* Event delegation allows us to avoid adding event listeners to specific nodes; 
        instead, the event listener is added to one parent. That event listener analyses
        bubbled events to find a match on child elements. */
        while (el && el !== document.body) {
            if(el.nodeName === 'A') {
            const href = el.getAttribute('href');
            const page = this.getPage(href.split('?')[0] || '/');
                if(page) {
                    history.pushState({}, page, href);
                    this.getFile(page);
                    e.preventDefault();
                    return;
                }
            }
            el = el.parentNode;
        }
    }
    getPage(ref) {
        // new RegExp('^account\/os\/.*\/call_back$').test("1account/os/1234567/call_back")
        const matchPath = path => new RegExp(`^${path}$`).test(ref);
        return this.routeMap[this.routePaths.find(matchPath)];
    }
    /* Determines the current route by mathcing current location pathname to
    routes map, and returning the route entry with all of its properties. */
    handleRouteChange(e) {
        const page = this.getPage(location.pathname);
        if(page && window.location.hash === '') {
            this.getFile(page);
        }
    }
    // Starts the SPA app router and processes the  view initialisation
    init() {
        this.routeMap = {
            '/': [],
            '/tags': [],
            '/tags/.*': [],
            '/about': [],
            '/terms': [],
            '/privacy': [],
            '/contact': [],
            '/submit': ['js/views/Submit.js'],
            '/poll/.*': ['/js/views/Question.js']
        };
        this.routePaths = Object.keys(this.routeMap);
        window.addEventListener('popstate', e => this.handleRouteChange(e));  
        document.addEventListener('click', e => this.handleClick(e));
        this.handleRouteChange();
    }
}
class FormHandler {
    constructor($scope) {
        const onSubmit = form => {
            form.classList.remove('form');
            form.addEventListener('submit', e => this.submit(e));
        };
        this.$scope = $scope;
        /* NodeLists are array-like but don't feature many of the methods
        provided by the Array, like forEach. However, there is a simple
        way to convert nodelist to array. */
        [].slice.call($scope.querySelectorAll('.form')).forEach(onSubmit);
    }
    send(e) {
        const f = e.target,
            body = new FormData(f);
        e.preventDefault();
        /*Since we add the token as a request header, we delete
        the csrf value and omit it as a form post parameter */
        body.delete('_csrf');
        return fetch(f.action || location.pathname, {method: 'post', body, credentials: 'include', headers: postHeader})
            .then(toText);
    }
    submit(e) {
        this.send(e).then(res => this.success(res)).catch(res => this.error(res));
    }
    success(res) {
        this.$scope.innerHTML = res;
    }
    error(res) {
        this.success(res);
    }
}
class BaseView {
    constructor() {
        if(prevRoute) {
            document.querySelector('.main-content').innerHTML = htmls[getFilename(location.pathname)];
        }
    }
}
classes.BaseView = BaseView;
(new Router).init();