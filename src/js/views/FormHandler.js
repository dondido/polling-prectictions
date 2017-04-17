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
			formData = new FormData(f);
		e.preventDefault();
		/*Since we add the token as a request header, we delete
		the csrf value and omit it as a form post parameter */
		formData.delete('_csrf');
		return $http({method: 'POST', url: f.action || location.pathname, params: formData});
	}
	submit(e) {
		this.send(e).then(res => this.success(res), res => this.error(res));
	}
	success(res) {
		if(!res) {
			return;
		}
		try{
			/* Based on request response, this method will determine which
			is the right action to take. If the response is a JSON object all
			of its properties wil be evaluated and if not it will be considered
			as a normal html content and will be inserted into the DOM. */
			const data = JSON.parse(res);
			if(data.path) {
				if(data.path.indexOf('#') === 0) {
					location.hash = data.path;
					return;
				}
				const page = Router.getPage(Router.getRoute(data.path));
				if(page) {
					history[data.path === location.pathname ? 'replaceState' : 'pushState']({}, '', data.path);
					return Router.getFile(page);
				}
			}
		} catch(e) {
			this.$scope.innerHTML = res;
		}
	}
	error(res) {
		this.success(res);
	}
}