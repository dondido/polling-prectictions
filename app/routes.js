const merge = require('merge'),
    fs = require('fs'),
    path1 = require('path'),
    es6Renderer = require('express-es6-template-engine'),
    perPage = 2,
    exist = require(__dirname + '/../custom_modules/module-exist'),
    multer = require('multer'),
    createPaginaton = (total, page = 1, order) => {
        const pages = 3;
        const last = Math.ceil( total / perPage );
        const prev = page - pages - Math.max(page + pages - last, 0);
        const start = prev > 1 ? prev : 1;
        const next = page + pages + Math.max(pages - page + 1, 0);
        const end = next < last ? next : last;
        const params = `href=/?order=${order}&page=`;
        let html = `<li class="pagination-prev">${page !== 1 ? `<a rel="prev" ${params + (page - 1)}></a>` : ''}</li>`;
        if (start > 1) {
            html += `<li class="pagination-item"><a ${params + 1} rel="prev">1</a>`;
            if(start !== 2) {
                html += '<li class="pagination-period">'
            }
        }
        for ( let i = start; i < page; i ++) {
            html += `<li class="pagination-item"><a rel="prev" ${params + i}>${i}</a>`;
        }
        html += `<li class="pagination-current">${page}`;
        for (let i = page + 1 ; i <= end; i ++) {
            html += `<li class="pagination-item"><a rel="next" ${params + i}>${i}</a>`;
        }
        if (end < last) {
            if(end !== last - 1) {
                html += '<li class="pagination-period">'
            }
            html += `<li class="pagination-item"><a ${params + last} rel="next">${last}</a>`;
        }
        html += `<li class="pagination-next">${page !== last ? `<a ${params + (page + 1)} rel="next"></a>` : ''}</li>`;
        return html;
    };

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
            req.body.folder = req.body.folder || Date.now();
            const uploadPath = `${folder}/uploads/${req.body.folder}`;
            const setPath = () => callback(null, uploadPath);
            fs.mkdir(uploadPath, setPath);
        },
        filename(req, file, cb) {
            cb(null, file.originalname);
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
    app.set('views', folder);
    app.set('view engine', 'html');

    const baseRoutes = ['/submit'];
    const getBaseParams = (req, url) => ({
        locals: {
            token: req.csrfToken()
        },
        partials: {main: folder + '/html/' + (url || req.url) + '.html'}
    });
    const getFileName = path => path.split("/").pop().split(".")[0];
    const renderSubmitComponent = (req, res) => {
        const dict = {
            locals: {
                token: req.csrfToken()
            }
        };
        const sendContent = (err, content) => res.send(content);
        return es6Renderer(folder + req.url, dict, sendContent);
    };
    const baseRender = (req, res) => res.render('index', getBaseParams(req));
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
        console.log('req.params.poll', req.params.poll)
        return Poll.findOne({url: req.params.poll}).exec().then(sendPage);
    };
    const vote = (req, res) => {
        const registerAnswer = doc => {
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
        
        /*const query = Poll.find({'options.votes': { "in" : [req.user.email]}});
        return query.exec().then(doc => console.log(123, doc));*/
    };
    const handleSubmit = (req, res) => {
        console.log(req.files, res.files)
        const {body, files} = req;
        const {media} = body;
        /*const saveCb = error => {
            console.log("Your poll has been saved!");
            const compile = (err, docs) => {
                const savePage = (err, content, page) => {
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
                es6Renderer(folder + '/html/home.html', {locals: {docs, pagination: createPaginaton(docs.length)}}, saveHome);
                es6Renderer(folder + '/html/tags.html', {locals: {tags}}, saveTags);
            }
            if (error) {
                console.error(error);
            }
            Poll.find().limit(10).exec(compile);
            req.xhr ? res.end() : res.redirect('#submitted');
        };*/
        const setDesc = (desc, idx) => ({
            desc,
            media: media[idx]
        });
        body.thumb = media.shift();
        body.media = media.shift();
        body.options = body.options.map(setDesc);
        fs.writeFile(`${folder}/uploads/${body.folder}/poll.json`, JSON.stringify(body), err => {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
        //(new Poll(body)).save(saveCb);
    };
    const listPolls = (req, res) => {
        const order = req.query.order || 'most-recent';
        const page = req.query.page || 1;
        const tags = req.params.tag;
        const query = tags ? {tags} : {};
        if('most-recent' === order) {
            const countDocs = n => {
                const renderPage = docs => {
                    const locals = {docs, pagination: createPaginaton(n, + page, order)};
                    const sendContent = (err, content) => res.send(content);
                    return req.xhr ? 
                        es6Renderer(folder + '/html/home.html', {locals}, sendContent) :
                        res.render('index', {locals, partials: {main: folder + '/html/home.html'}});
                };
                Poll.find(query).skip(perPage * (page - 1)).limit(perPage).exec().then(renderPage);
            };
            Poll.count(query).exec().then(countDocs);
        }
    };

    app.get(baseRoutes, baseRender);
    app.get('/poll/:poll', pollRender);
    app.post('/poll/:poll', vote);
    //Beware, you need to match .single() with whatever name="" of your file upload field in html
    app.post('/submit', upload.array('photos'), handleSubmit);
    app.get('/tags', (req, res) => res.render('index', {partials: {main: folder + '/html/compiled/tags.html'}}));
    app.get(['/', '/tags/:tag'], listPolls);
    app.get('/html/submit.html', renderSubmitComponent);
    app.get('/html/home.html', listPolls);
};