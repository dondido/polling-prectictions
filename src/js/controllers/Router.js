/*import {$http} from 'js/services/http.js';
import {$import} from 'js/services/import.js';
import Page from 'js/views/page.js';
import User from 'js/models/user.js';*/
let prevRoute;
var classes = classes || {};
const htmls = {};
/*let firstRender = true;*/
const getFilename = path => path.match(/([^/]*?)(?:\..*)?$/)[1] || 'home';
class Router {
  getFile(files) {
    const names = [];
    const imports = [];
    const contents = [];
    const scripts = [];
    const assignContent = (content, idx) => {
      const path = names[idx];
      const filename = getFilename(path);
      if(path.slice(-3) === '.js'){
        new classes[filename]();
      }
      else {
        htmls[filename] = content;
      }
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
      imports.push($http(url + location.search));
    };
    const split = url => (url.slice(-3) === '.js' ? scripts.push(url) : contents).push(url);
    files.forEach(split);
    if(prevRoute) {
      contents.push(location.pathname);
      contents.forEach(importContent);
      scripts.forEach(importScript);
      if(scripts.length === 0) {
        importScript('BaseView.js');
      }
    }
    else {
      scripts.forEach(importScript);
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
    do {
      if(el.nodeName === 'A') {
        const href = el.getAttribute('href');
        const page = this.getPage(href.split('?')[0] || '/');
        if(page) {
          //history.pushState({account: User.account}, page.files, href);
          history.pushState({}, page, href);
          this.getFile(page);
          e.preventDefault();
          return 
        }
      }
      el = el.parentNode;
    } while(el !== document.body);
  }
  get prevRoute() {
    return prevRoute;
  }
  set prevRoute(route) {
    prevRoute = route;
  }
  getPage(ref) {
    // new RegExp('^account\/os\/.*\/call_back$').test("1account/os/1234567/call_back")
    const matchPath = path => new RegExp(`^${path}$`).test(ref);
    return this.routeMap[this.routePaths.find(matchPath)];
  }
  /* Determines the current route by mathcing current location pathname to
  routes map, and returning the route entry with all of its properties. */
  handleRouteChange() {
    var page = this.getPage(location.pathname);
    if(page) {
      /*if(history.state && history.state.account !== User.account) {
        history.replaceState({account: User.account}, '', '/');
      }
      else if(!prevRoute || !history.state) {
        history.replaceState({account: User.account}, '');
      } 
      if(prevRoute === page.files) {
        return;
      }*/
      this.getFile(page);
    }
  }
  // Starts the SPA app router and processes the  view initialisation
  init() {
    var success = routes => {
        this.routeMap = JSON.parse(routes);
        this.routePaths = Object.keys(this.routeMap);
        /* As we don't want to make an extra Ajax request to check
        whether the user is logged in or not we set this data as
        part of a document body classList. */
        // User.account = document.body.classList.contains('account');
        this.handleRouteChange();
      },
      error = res => console.log('error', res);
    window.addEventListener('popstate', e => this.handleRouteChange(e));  
    document.addEventListener('click', e => this.handleClick(e));
    $http({
      method: 'GET', 
      url: '/js/config/routes.json'
    }).then(success, error);
  }
}
