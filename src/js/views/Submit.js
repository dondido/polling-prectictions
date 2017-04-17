class Submit extends FormHandler {
	constructor() {
		const $scope = document.querySelector('.main-content');
		if(prevRoute) {
			$scope.innerHTML = htmls.submit;
		}
		super($scope);
		$scope.querySelector('.file-input')
  			.addEventListener('change', e => this.changeFile(e));
	}
	changeFile(e) {
		const input = e.target;
		if(input.files && input.files[0]) {
			const reader = new FileReader();
			const $avatar = document.querySelector('.user-avatar-img');
			const $img = document.getElementById('img');
			reader.onload = e => $avatar.src = e.target.result;
			reader.readAsDataURL(input.files[0]);
			$img.value = input.value.match(/([^\/\\]+)$/)[1];
		}
	}
	submit(e) {
		super.submit(e);
		location.hash = 'submitted';
	}
}
classes.Submit = Submit;