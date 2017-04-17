const $http = function(data) {
    return new Promise(function(resolve, reject) {
        const req = new XMLHttpRequest();
        req.open(data.method || 'GET', data.url || data || location.pathname);
        /* We are using session based tokens, so we generate a secure
        token when generating the session, and store that token in the session.
        When a request comes back to the server, we check that the token is
        included in the request and compare it to what's in the session.
        If it's the same token, we accept the request, if not we reject it.*/
        req.setRequestHeader("X-XSRF-TOKEN", $cookie('XSRF-TOKEN'));
        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        req.onload = function() {
            // This is called even on 404 etc
            // so check the status
            if (req.status === 200) {
                // Resolve the promise with the response text
                resolve(req.response);
            }
            else {
                // Otherwise reject with the status text
                // which will hopefully be a meaningful error
                reject(Error(req.statusText));
            }
        };
        // Handle network errors
        req.onerror = function() {
            reject(Error('Network Error'));
        };
        // Make the request
        req.send(data.params || data);
    });
};