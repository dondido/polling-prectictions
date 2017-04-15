class Submit {
	constructor() {
		if(prevRoute) {
			document.querySelector('.main-content').innerHTML = htmls.submit;
		}
	}
}
classes.Submit = Submit;