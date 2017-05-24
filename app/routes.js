const merge = require('merge'),
    fs = require('fs'),
    path1 = require('path'),
    urls = new Map(),
    xhrs = new Map(),
    es6Renderer = require('express-es6-template-engine'),
    perPage = 2,
    exist = require(__dirname + '/../custom_modules/module-exist'),
    multer = require('multer'),
    createPaginaton = require('./components/create-pagination'),
    insertOptionMedia = require('./components/insert-option-media');

module.exports = function (app, Poll) {
    const folder = app.get('folder');
    const redirectHash = function(req, res, path) {
        return req.xhr ? res.json(
            {
                path: path
            }
        ) : res.redirect(path);
    };
    const storage = multer.diskStorage({
        destination(req, file, callback) {
            const {body} = req;
            body.created = body.created || Date.now();
            const uploadPath = `uploads/${body.created}`;
            const setPath = (a, b) => callback(null, uploadPath);
            fs.mkdir(uploadPath, setPath);
        },
        filename(req, file, callback) {
            callback(null, file.originalname);
        },
    });
    const upload = multer({
        storage: storage,
        limits: {fileSize: 1024 * 1024 / 2},
        fileFilter(req, file, cb) {
            if((/\.(gif|jpg|jpeg|svg|png)$/i).test(file.originalname) === true &&
                ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif'].indexOf(file.mimetype) !== -1) {
                return cb(null, true);
            }
            console.log('has failed to upload file:' + file.originalname);
            cb(null, false, new Error());
        }
    });
    app.engine('html', es6Renderer);
    app.set('views', folder + '/html');
    app.set('view engine', 'html');

    const getBaseParams = (req, url) => ({
        locals: {
            token: req.csrfToken()
        },
        partials: {main: url || req.url}
    });
    const renderAjaxForm = (req, res) => fs.readFile(`${folder}/html/${req.path}.html`, 'utf8', res.locals.setContent);
    const renderHttpForm = (req, res) => res.render('index', getBaseParams(req));
    const renderBaseForm = (req, res, next) => req.xhr ? next() : renderHttpForm(req, res);
    const renderVote = (req, res) => {
        const {locals} = res;
        const renderPage = (err, content) => {
            const sendPage = (err, page) => res.send(page);
            locals.questionContent = content;
            if(req.xhr) {
                return app.render('question', {locals}, sendPage);
            }
            res.render('index', {locals, partials: {main: 'question'}});
        };
        locals.allVotes = locals.doc.options.reduce((t, o) => t + o.votes.length, 0);
        locals.insertOptionMedia = insertOptionMedia;
        app.render(locals.page, {locals}, renderPage);
    };
    const renderPoll = (req, res, next) => {
        const {locals} = res;
        const compilePage = doc => {
            const checkVotes = option => option.votes.includes(req.sessionID);
            const voteIndex = doc.options.findIndex(checkVotes);
            locals.doc = doc;
            if(voteIndex !== -1) {
                locals.page = 'question-results';
                locals.voteIndex = voteIndex;
                return next();
            }
            locals.token = req.csrfToken();
            locals.page = 'question-form';
            next();
        }
        return Poll.findOne({url: req.params.poll}).exec().then(compilePage);
    };
    const vote = (req, res, next) => {
        const {locals} = res;
        const registerAnswer = doc => {
            const checkVotes = option => option.votes.includes(req.sessionID);
            const voteIndex = doc.options.findIndex(checkVotes);
            if(voteIndex === -1) {
                doc.options[req.body.answer].votes.push(req.sessionID);
                doc.save();
            }
            locals.voteIndex = + req.body.answer;
            locals.doc = doc;
            locals.page = 'question-results';
            next();
        };
        Poll.findOne({url: req.params.poll}).exec().then(registerAnswer);
    };
    const handleSubmit = (req, res) => {
        const {body, files} = req;
        const {media} = body;
        const setDesc = (desc, idx) => ({
            desc,
            media: media[idx]
        });
        body.thumb = media.shift();
        body.media = media.shift();
        body.options = body.options.map(setDesc);
        body.created = body.created || Date.now();
        body.tags = body.tags.split(',').slice(0, 5);
        console.log(122, JSON.stringify(body))
        fs.writeFile(`uploads/${body.created}/poll.json`, JSON.stringify(body), err => {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
        console.log(111, req.xhr, res.end)
        req.xhr ? res.end() : res.redirect('#submitted');
        //(new Poll(body)).save(saveCb);
    };
    const mapContent = (req, res, next) => {
        const {url} = req;
        const contentMap = req.xhr ? xhrs : urls;
        const urlContent = contentMap.get(url);
        const setContent = (err, content) => {
            // put the latest url last
            contentMap.delete(url);
            contentMap.set(url, content);
            res.send(content);
        };
        const truncateContent = () => {
            if(contentMap.size > 100) {
                contentMap.delete(Array.from(contentMap.keys())[0]);
            };
        };
        if(urlContent) {
            return setContent(null, urlContent);
        }
        res.locals.setContent = (err, content) => {
            setContent(null, content);
            truncateContent();
        };
        next();
    };
    const listTags = (req, res) => {
        const compile = (err, docs) => {
            const savePage = (err, content, page) => {
                fs.writeFile(`${folder}/html/compiled/${page}.html`, content, err => {
                    if(err) {
                        return console.log(err);
                    }
                    console.log("The file was saved!");
                });
            };
            const saveTags = (err, content) => savePage(err, content, 'tags');
            const tags = {};
            const extractTags = (total, doc) => total.concat(doc.tags);
            const countTags = i => tags[i] = tags[i] + 1 || 1;
            docs.reduce(extractTags, []).forEach(countTags);
            return req.xhr ? 
                app.render('tags', {locals: {tags}}, res.locals.setContent) :
                app.render('index', {locals: {tags}, partials: {main: 'tags'}}, res.locals.setContent);
        }
        Poll.find().exec(compile);
    };
    const listPolls = (req, res) => {
        const order = req.query.order || 'most-recent';
        const page = req.query.page || 1;
        const tags = req.params.tag;
        const query = tags ? {tags} : {};
        if('most-recent' === order) {
            const countDocs = n => {
                const renderPage = docs => {
                    const locals = {docs, pagination: createPaginaton(n, + page, order, perPage)};
                    return req.xhr ? 
                        app.render('home', {locals}, res.locals.setContent) :
                        app.render('index', {locals, partials: {main: 'home'}}, res.locals.setContent);
                };
                Poll.find(query).skip(perPage * (page - 1)).limit(perPage).exec().then(renderPage);
            };
            Poll.count(query).exec().then(countDocs);
        }
    };

    app.get(['/poll/:poll'], renderPoll, renderVote);
    app.post('/poll/:poll', upload.array(), vote, renderVote);
    //Beware, you need to match .single() with whatever name="" of your file upload field in html
    app.post('/submit', upload.array('photos'), handleSubmit);
    app.get(['/tags',  '/html/tags.html'], mapContent, listTags);
    app.get(['/', '/tags/:tag'], mapContent, listPolls);
    app.get('/submit', renderBaseForm, mapContent, renderAjaxForm);
};