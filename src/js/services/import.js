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
	}
	return new Promise(handleImport);
}