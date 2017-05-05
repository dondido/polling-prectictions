class Question {
	constructor() {
		if(prevRoute) {
			document.querySelector('.main-content').innerHTML = htmls[location.pathname.match(/([^/]*?)(?:\..*)?$/)[1] || 'home'];
		}
	}
}
classes.Question = Question;