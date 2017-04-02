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
                const savePage = (err, content, page) => {
                    console.log(123, content)
                    fs.writeFile(`${folder}/html/compiled/${page}.html`, content, err => {
                        if(err) {
                            return console.log(err);
                        }
                        console.log("The file was saved!");
                    });
                };
                const saveHome = (err, content) => savePage(err, content, 'home');
                const saveTags = (err, content) => savePage(err, content, 'tags');
                const tags = {};
                const extractTags = (total, doc) => total.concat(doc.tags);
                const countTags = i => tags[i] = tags[i] + 1 || 1;
                docs.reduce(extractTags, []).forEach(countTags);
                const pageCount = Math.ceil(docs.length / 10);
                const pagination = Array(pageCount).fill({attr: 'rel="next"'});
                pagination[0].attr = '';
                es6Renderer(folder + '/html/home.html', {locals: {docs, pagination}}, saveHome);
                es6Renderer(folder + '/html/tags.html', {locals: {tags}}, saveTags);
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
        poll.save(saveCb);
    });

    const baseRoutes = ['/submit'];
    const getBaseParams = (req, url) => ({
        locals: {
            token: req.csrfToken()
        },
        partials: {main: folder + '/html/' + (url || req.url) + '.html'}
    });
    const baseRender = (req, res) => { console.log(getBaseParams(req), 222); res.render('index', getBaseParams(req)) };
    const pollRender = (req, res) => {
        const sendPage = doc => {
            const checkVotes = option => option.votes.includes(req.sessionID);
            const voted = doc.options.some(checkVotes);
            const dict = {
                locals: {doc},
            };
            const renderPage = (err, content) => {
                dict.locals.questionContent = content;
                dict.partials = {main: folder + '/html/question.html'};
                res.render('index', dict);
            };
            dict.locals.allVotes = doc.options.reduce((t, o) => t + o.votes.length, 0);
            if(voted) {
                return es6Renderer(folder + '/html/question-results.html', dict, renderPage);
            }
            dict.locals.token = req.csrfToken();
            es6Renderer(folder + '/html/question-form.html', dict, renderPage);
        }
        return Poll.findOne({url: req.params.poll}).exec().then(sendPage);
    };
    const vote = (req, res) => {
        const registerAnswer = doc => {
            console.log(req.sessionID)
            const checkVotes = option => option.votes.includes(req.sessionID);
            const voted = doc.options.some(checkVotes);
            if (voted) {
                return redirectHash(req, res, 'back');
            }
            doc.options[req.body.answer].votes.push(req.sessionID);
            doc.save();
            return redirectHash(req, res, 'back');
        };
        Poll.findOne({url: req.params.poll}).exec().then(registerAnswer);
        
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
    app.post('/polls/:poll', vote);
    app.get('/tags', (req, res) => res.render('index', {partials: {main: folder + '/html/compiled/tags.html'}}));
    app.get('/tags/:tag', (req, res) => {
        const renderPage = docs => {
            console.log(222, docs);
            res.render('index', {locals: {docs}, partials: {main: folder + '/html/home.html'}})};
        Poll.find({tags: { $in : [req.params.tag]}}).exec().then(renderPage);
    });
};