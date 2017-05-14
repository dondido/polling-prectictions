class Question extends FormHandler {
	constructor() {
		const $scope = document.querySelector('.main-content');
		if(prevRoute) {
			$scope.innerHTML = htmls[location.pathname.match(/([^/]*?)(?:\..*)?$/)[1] || 'home'];
		}
		super($scope)
	}
}
classes.Question = Question;