const merge = require('merge'),
    fs = require('fs'),
    path1 = require('path'),
    es6Renderer = require('express-es6-template-engine'),
    /*routes = require(__dirname + '/../dist/routes.json'),*/
    exist = require(__dirname + '/../custom_modules/module-exist');

module.exports = function (app, Poll) {
    var folder = app.get('folder'),
        redirectHash = function(req, res, path) {
            return req.xhr ? res.json(
                {
                    path: path
                }
            ) : res.redirect(path);
        };
    app.engine('html', es6Renderer);
    app.set('views', folder);
    app.set('view engine', 'html');


    app.post('/submit', function(req, res) {
        const rb = req.body;
        
        const saveCb = error => {
            console.log("Your poll has been saved!");
            const compile = (err, docs) => {
                const render = (err, content) => {
                    console.log(123, content)
                    fs.writeFile(folder + '/html/compiled/home.html', content, err => {
                        if(err) {
                            return console.log(err);
                        }
                        console.log("The file was saved!");
                    });
                };
                console.log(122, docs)
                es6Renderer(folder + '/html/home.html', {locals: {docs}, template: true}, render);
            }
            if (error) {
                console.error(error);
            }
            Poll.
              find().
              limit(10).
              exec(compile);
            req.xhr ? res.end() : res.redirect('#password-updated');
        };
        const setDesc = desc => ({desc});
        rb.options = rb.options.map(setDesc);
        const poll = new Poll(rb);
        console.log(111, rb);
        poll.save(saveCb);
    });

    const baseRoutes = ['/submit'];
    const getBaseParams = (req, url) => ({
        locals: {
            token: req.csrfToken()
        },
        partials: {main: folder + '/html/' + (url || req.url) + '.html'}
    });
    const baseRender = (req, res) => res.render('index', getBaseParams(req));
    const pollRender = (req, res) => {
        const sendPage = doc => {
            console.log(111, req.isAuthenticated())
            const dict = getBaseParams(req, 'question');
            dict.locals.doc = doc;
            res.render('index', dict);
        }
        return Poll.findOne({url: req.params.poll}).exec().then(sendPage);
    };
    const vote = (req, res) => {
        if(req.isAuthenticated()) {
            const registerAnswer = doc => {
                const checkVotes = option => option.votes.includes(req.user.email);
                const voted = doc.options.some(checkVotes);
                if (voted) {
                    return redirectHash(req, res, '#voted');
                }
                doc.options[req.body.answer].votes.push(req.user.email);
                doc.save();
                return redirectHash(req, res, '#show-votes');
            };
            Poll.findOne({url: req.params.poll}).exec().then(registerAnswer);
        }
        /*const query = Poll.find({'options.votes': { "$in" : [req.user.email]}});
        return query.exec().then(doc => console.log(123, doc));*/
    };
    app.get('/', (req, res) => {
        const dict = {
            locals: {
                token: req.csrfToken()
            },
            partials: {main: folder + '/html/compiled/home.html'}
        };
        return res.render('index', dict);
    });
    app.get(baseRoutes, baseRender);
    app.get('/polls/:poll', pollRender);
    app.post('/polls/:poll', vote)
};