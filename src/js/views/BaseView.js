class BaseView {
	constructor() {
		if(prevRoute) {
			document.querySelector('.main-content').innerHTML = htmls[getFilename(location.pathname)];
		}
	}
}
var classes = classes || {};
classes.BaseView = BaseView;