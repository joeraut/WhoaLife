var express = require('express'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    busboy = require('connect-busboy'),
    db = require('monk')(process.env.MONGOHQ_URL),
    entries = db.get('entries'),
    jwt = require('jsonwebtoken'),
    expressJwt = require('express-jwt'),
    sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(busboy({
    immediate : true,
    limits : {
        files : -1,
        fileSize : -1
    }
}));

app.get('/entries', function(req, res, next) {
    entries.find({}, function(err, docs) {
        if (err) {
            return next(err);
        }
        return res.send(docs);
    });
});

app.post('/emails', function(req, res, next) {
    var fields = {};
    req.busboy.on('field', function(field, value) {
        fields[field] = value;
    });
    req.busboy.on('finish', function() {
        var doc = {
            createdAt : new Date(),
            text : fields.plain
        };
        entries.insert(doc);
        res.status(200).end();
    });
});

sendgrid.send({
    to:       '"Jason von Nieda" <jason@vonnieda.org>',
    from:     '"WhoaLife" <' + process.env.CLOUDMAILIN_FORWARD_ADDRESS + '>',
    subject:  'It\'s Friday, Sep 19 - How did your day go?',
    text:     'Just reply to this email with your entry.'
}, function(err, json) {
    if (err) {
        return console.error(err);
    }
    console.log(json);
});

module.exports = app;
