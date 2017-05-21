class Submit extends FormHandler {
	constructor() {
		const $scope = document.querySelector('.main-content');
		if(prevRoute) {
			$scope.innerHTML = htmls.submit;
		}
		const $form = document.forms.submit;
		const uploadFile = e => this.changeFile(e);
		const attachListener = $el => $el.addEventListener('change', uploadFile);
		const removeMedia = e => this.removeMedia(e);
		const removeAnswer = e => this.removeAnswer(e);
		const showMediaModal = e => this.showMediaModal(e);
		const hideMediaModal = () => this.hideMediaModal();
		const setVideo = () => this.setVideo();
		const addAnswer = () => this.addAnswer();
		super($scope);
		this.$form = $form;
		this.answer = $form.querySelector('.option-block').outerHTML;
		this.$add = $form.querySelector('.add-option-button');
		this.$mediaModal = $scope.querySelector('.media-modal');
		this.$videoInput = $scope.querySelector('.video-input');
		$live('.video-input-button', 'click', showMediaModal, $form);
		$live('.set-video-button', 'click', setVideo, $scope);
		$live('.media-modal-x', 'click', hideMediaModal, $scope);
		$live('.answer-delete-button', 'click', removeAnswer, $form);
		$live('.media-delete-button', 'click', removeMedia, $scope);
		$live('.add-option-button', 'click', addAnswer, $form);
		Array.from($form.querySelectorAll('.file-input')).forEach(attachListener);
	}
	showMediaModal(e) {
		this.$video = e.target.parentNode.parentNode.querySelector('.uploaded-content .uploaded-video');
		this.$mediaModal.classList.add('show');
	}
	hideMediaModal() {
		this.$mediaModal.classList.remove('show');
	}
	setVideo() {
		const $block = this.$video.parentNode.parentNode;
		const cl = $block.querySelector('.uploaded-title').classList;
		cl.remove('image-file');
		cl.add('video-link');
		$block.querySelector('.media-text').dataset.media = $block.querySelector('.media-input').value =
			this.$video.src ='https://www.youtube.com/embed/' + this.$videoInput.value.split('?v=').pop();
		this.hideMediaModal();
	}
	removeAnswer(e) {
		const $answer = e.target.parentNode.parentNode;
		$answer.parentNode.removeChild($answer);
	}
	removeMedia(e) {
		const $block = e.target.parentNode.parentNode;
		$block.querySelector('.uploaded-title').classList.remove('image-file', 'video-link');
		$block.querySelector('.media-input').value = $block.querySelector('.file-input').value = '';
	}
	addAnswer() {
		const uploadFile = e => this.changeFile(e);
		this.$add.insertAdjacentHTML('beforebegin', this.answer);
		Array.from(this.$form.querySelectorAll('.option-block')).pop().addEventListener('change', uploadFile);
	}
	changeFile(e) {
		const reader = new FileReader();
		const $input = e.target;
		const file = $input.files && $input.files[0];
		reader.onload = e => {
			const $block = $input.parentNode.parentNode.parentNode;
			const cl = $block.querySelector('.uploaded-title').classList;
			cl.add('image-file');
			cl.remove('video-link');
			$block.querySelector('.uploaded-content .uploaded-image').src = e.target.result;
			$block.querySelector('.media-text').dataset.media = $block.querySelector('.media-input').value = file.name;
		};
		file && reader.readAsDataURL(file);
	}
	submit(e) {
		super.submit(e);
		location.hash = 'submitted';
	}
	success(){
	}
}
classes.Submit = Submit;