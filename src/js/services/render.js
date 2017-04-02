/*jshint ignore:start*/
const $render = (c, k, v) => new Function(...k, 'return `' + c + '`;')(...v);
/*jshint ignore:end*/