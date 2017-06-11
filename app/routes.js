const fs = require('fs');
const urls = new Map();
const xhrs = new Map();
const templates = {};
const es6Renderer = require('express-es6-template-engine');
const perPage = 3;
const multer = require('multer');
const createPaginaton = require('./components/create-pagination');
const insertOptionMedia = require('./components/insert-option-media');

module.exports = function (app, Poll) {
    const folder = app.get('folder');
    const views = folder + '/html';
    const storage = multer.diskStorage({
        destination(req, file, callback) {
            const {body} = req;
            body.created = body.created || Date.now();
            const uploadPath = `uploads/${body.created}`;
            const setPath = () => callback(null, uploadPath);
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
    const getContent = (err, filenames) => {
        const readFile = filename => {
            const setTemplate = (err, content) => templates[filename.replace('.html', '')] = es6Renderer(content);
            fs.readFile(views + '/' + filename, setTemplate);
        };
        filenames.forEach(readFile);
    };
    fs.readdir(views, getContent);
    app.engine('html', es6Renderer);
    app.set('views', views);
    app.set('view engine', 'html');
    const renderBase = (req, res) => {
        const main = templates[req.path.slice(1)]();
        res.locals.send(req.xhr ? main : templates.index({main}));
    };
    const setToken = req => templates[req.path.slice(1)]({token: req.csrfToken()});
    const renderAjaxForm = (req, res) => res.locals.send(setToken(req));
    const renderHttpForm = (req, res) => res.send(templates.index({main: setToken(req)}));
    const renderBaseForm = (req, res, next) => req.xhr ? next() : renderHttpForm(req, res);
    const renderVote = (req, res) => {
        const {locals} = res;
        locals.allVotes = locals.doc.options.reduce((t, o) => t + o.votes.length, 0);
        locals.insertOptionMedia = insertOptionMedia;
        locals.questionContent = templates[locals.page](locals);
        const main = templates.question(locals);
        res.send(req.xhr ? main : templates.index({main}));
    };
    const findVote = (options, sessionID) => {
        const compareSessions = vote => sessionID === vote.sessionID;
        const checkVotes = option => option.votes.some(compareSessions);
        return options.findIndex(checkVotes);
    };
    const renderPoll = (req, res, next) => {
        const {locals} = res;
        const compilePage = doc => {
            const {sessionID} = req;
            const voteIndex = findVote(doc.options, sessionID);
            locals.doc = doc;
            if(voteIndex !== -1) {
                locals.page = 'question-results';
                locals.voteIndex = voteIndex;
                return next();
            }
            locals.token = req.csrfToken();
            locals.page = 'question-form';
            next();
        };
        return Poll.findOne({url: req.params.poll}).exec().then(compilePage);
    };
    const vote = (req, res, next) => {
        const {locals} = res;
        const registerAnswer = doc => {
            const {sessionID} = req;
            const voteIndex = findVote(doc.options, sessionID);
            if(voteIndex === -1) {
                doc.options[req.body.answer].votes.push({sessionID, ip: req.ip});
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
        const {body} = req;
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
        fs.writeFile(`uploads/${body.created}/poll.json`, JSON.stringify(body), err => {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
        req.xhr ? res.end() : res.redirect('#submitted');
    };
    const mapContent = (req, res, next) => {
        const {url} = req;
        const contentMap = req.xhr ? xhrs : urls;
        const urlContent = contentMap.get(url);
        const send = content => {
            // put the latest url last
            contentMap.delete(url);
            contentMap.set(url, content);
            res.send(content);
        };
        const truncateContent = () => {
            if(contentMap.size > 100) {
                contentMap.delete(Array.from(contentMap.keys())[0]);
            }
        };
        if(urlContent) {
            return send(urlContent);
        }
        res.locals.send = content => {
            send(content);
            truncateContent();
        };
        next();
    };
    const listTags = (req, res) => {
        const compile = (err, docs) => {
            const tags = {};
            const extractTags = (total, doc) => total.concat(doc.tags);
            const countTags = i => tags[i] = tags[i] + 1 || 1;
            docs.reduce(extractTags, []).forEach(countTags);
            const main = templates.tags({tags});
            res.locals.send(req.xhr ? main : templates.index({main}));
        };
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
                    const main = templates.home({docs, pagination: createPaginaton(n, + page, order, perPage)});
                    res.locals.send(req.xhr ? main : templates.index({main}));
                };
                Poll.find(query).skip(perPage * (page - 1)).limit(perPage).exec().then(renderPage);
            };
            Poll.count(query).exec().then(countDocs);
        }
    };
    app.get(['/about', '/terms', '/privacy', '/contact'], mapContent, renderBase);
    app.get(['/poll/:poll'], renderPoll, renderVote);
    app.post('/poll/:poll', upload.array(), vote, renderVote);
    //Beware, you need to match .single() with whatever name="" of your file upload field in html
    app.post('/submit', upload.array('photos'), handleSubmit);
    app.get(['/tags',  '/html/tags.html'], mapContent, listTags);
    app.get(['/', '/tags/:tag'], mapContent, listPolls);
    app.get('/submit', renderBaseForm, mapContent, renderAjaxForm);
};