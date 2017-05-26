const fs = require('fs');
const a = ['/sr1c/html/about.html', '/s1rc/html/about.html', '/src/html/about.html'];

const b = function(aa) {
    const path = aa.shift();
    const findFile = (resolve, reject) => {
        const getFileContent = (err, content) => {
            if (err) {
                return aa.length ? b(aa) : reject(new Error(err));
            }
            resolve(content);
        }
        fs.readFile(__dirname + path, 'utf-8', getFileContent);
    };
   (new Promise(findFile)).then(function(successMessage) {
        console.log("Yay! " + successMessage);
    }).then((b) => console.log(222, b));
};

b(a);