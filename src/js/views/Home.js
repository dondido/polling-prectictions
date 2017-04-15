class Home {
	constructor() {
		if(prevRoute) {
			document.querySelector('.main-content').innerHTML = htmls.home;
		}
	}
}
classes.Home = Home;