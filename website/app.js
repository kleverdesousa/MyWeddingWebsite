const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const redis = require('redis');

const {promisify} = require('util');

var helmet = require('helmet');

var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

var random = require("random-js")();

var S = require('string');

// Set Port
const port = process.env.PORT || 3000;;

// Init app
const app = express();
app.use(express.static('public'));

// Init helmet
app.use(helmet());

// disable X Powered By
app.disable('x-powered-by');

// Create redis client
let client = redis.createClient();
client.on('connect', function () {
    console.log('Connected to redis...');
});
const getAsync = promisify(client.get).bind(client);
const hgetallAsync = promisify(client.hgetall).bind(client);
const hgetAsync = promisify(client.hget).bind(client);
const sscanAsync = promisify(client.sscan).bind(client);
const smembersAsync = promisify(client.smembers).bind(client);

// Session handler
app.use(session({
        secret: process.env.SESS_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: { }
    })
);

// View Engine
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', 'views/layouts/');

// body-parser 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// methodOverride
app.use(methodOverride('_method'));

// main
var sess;
app.get('/', function (req, res, next) {
    sess = req.session;
    if (sess.email) {
        if (client.exists(sess.email) > 0) {
            res.redirect('/pt/home');
        } else
            res.redirect('/pt/login');
    } else
        res.redirect('/pt/login');
});

// login language
app.post('/login/lang', function (req, res, next) {
    let path;
    if (req.body.lang == "pt")
        path = "/pt/login"
    else if (req.body.lang == "fr")
        path = "/fr/login"
    res.send({
        redirect: path
    });
});

// login processing
app.post('/login/users', function (req, res, next) {
    if (sess) {
        let id = S(req.body.id).toLowerCase().s.trim();
        let firstName = S(req.body.firstName).toLowerCase().s.trim();
        let lastName = S(req.body.lastName).toLowerCase().s.trim();

        let phone, infos;
        if (req.body.phone) {
            phone = req.body.phone;
        } else {
            phone = 'no phone';
        }
        if (req.body.infos != undefined) {
            infos = req.body.infos;
        } else {
            infos = 'no infos';
        }

        client.hgetall(id, function (err, obj) {
            if (!obj) {
                firstName = S(firstName).trim().s;
                lastName = S(lastName).trim().s;
                client.hmset(id, [
                    'firstName', firstName,
                    'lastName', lastName,
                    'phone', phone,
                    'infos', infos]);
                client.sadd(process.env.RED_KEY2, id);
                obj = {
                    firstName: firstName,
                    last: lastName,
                    email: id,
                    id: id
                }
            } else {
                obj.id = id;

                // Get/Set Infos
                if (!obj.infos) {
                    client.hset(id, 'infos', obj.infos);
                } else {
                    let newInfos = obj.infos + ',' + infos;
                    client.hset(id, 'infos', newInfos);
                }
            }

            // Set location
            let path;
            if (req.body.lang == "fr")
                path = "/fr/home"
            else
                path = "/pt/home";

            // Session initialization
            sess.email = obj.id;
            sess.firstName = obj.firstName;
            sess.save();

            res.send({
                user: {
                    firstName: obj.firstName,
                    last: obj.lastName,
                    email: obj.id,
                    id: obj.id
                },
                redirect: path
            });
        })
    } else
        res.redirect('/');
});

// login language
app.post('/home/lang', function (req, res, next) {
    let path;
    if (req.body.lang == "pt")
        path = "/pt/home"
    else if (req.body.lang == "fr")
        path = "/fr/home"
    res.send({
        redirect: path
    });
});

app.get('/pt/login', function (req, res, next) {
    res.render('pt-login');
});

app.get('/fr/login', function (req, res, next) {
    res.render('fr-login');
});

app.get('/pt/home', function (req, res, next) {
    sess = req.session;
    if (sess) {
        if (sess.email) {
            if (client.exists(sess.email) > 0) {
                viewsCounter(sess.email, sess, client);
                res.render('pt-content');
            } else {
                res.redirect('pt/login');
            }
        } else {
            res.redirect('/pt/login');
        }
    } else {
        res.redirect('/pt/login');
    };
});

app.get('/fr/home', function (req, res, next) {
    sess = req.session;
    if (sess) {
        if (sess.email) {
            if (client.exists(sess.email) > 0) {
                viewsCounter(sess.email, sess, client);
                res.render('fr-content');
            } else {
                res.redirect('/fr/login');
            }
        } else {
            res.redirect('/fr/login');
        }
    } else {
        res.redirect('/fr/login');
    };
});

app.get('/users/search', function (req, res, next) {
    sess = req.session;
    if (sess.email) {
        // Setting current user search
        client.hget(sess.email, process.env.RED_KEY3, function (err, obj) {
            if (!err) {
                try{                                    
                    if (!obj || obj == "")
                        client.hset(sess.email, process.env.RED_KEY3, JSON.stringify([req.query.id.trim()]))
                    else {
                        let arr = JSON.parse(obj);
                        arr.push(req.query.id.trim());
                        client.hset(sess.email, process.env.RED_KEY3, JSON.stringify(arr));
                    }
                }catch(e){
                    return console.error(e);
                };
            };
        });

        // Getting user by id 
        client.get(req.query.id, function (err, obj) {
            if (!err) {
                if (obj)
                    res.send(obj)
                else
                    res.send('{ "noObj": "No user found" }');
            } else {
                res.send({
                    error: err
                });
            };
        });
    } else {
        res.redirect('/');
    }
});

app.post('/user/rsvp', function (req, res, next) {
    sess = req.session;
    if (sess.email) {
        var users = JSON.parse(req.body.users);
        var output = {
            userSave : [],
            msg : ''
        };
        if (users) {
            users.forEach(function (aUser) {
                if (client.exists(aUser.id) > 0) {
                    // Setting users answers
                    try {
                        client.set(aUser.id, JSON.stringify(aUser));
                    } catch(e){
                        return console.error(e);
                    };
                    
                    output.userSave.push(aUser.id);
                    // Setting current user answers
                    client.hget(sess.email, process.env.RED_KEY1, function (err, obj) {
                        if (!err) {
                            try{                                    
                                if (!obj || obj == "")
                                    client.hset(sess.email, process.env.RED_KEY1, JSON.stringify([aUser.id.trim()]))
                                else {
                                    let arr = JSON.parse(obj);
                                    arr.push(aUser.id.trim());
                                    client.hset(sess.email, process.env.RED_KEY1, JSON.stringify(arr));
                                }
                            }catch(e){
                                return console.error(e);
                            };                                
                        } else
                            res.send({
                                error : err
                            });
                    });
                };
            });
        };
        if (req.body.msg) {
            var requestSG = sg.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: {
                    personalizations: [
                      {
                          to: [
                            {
                                email: process.env.ADMINC_EMAIL,
                            }
                          ],
                          subject: 'Email do :' + sess.email,
                      },
                    ],
                    from: {
                        email: process.env.ADMINA_EMAIL,
                    },
                    content: [
                      {
                          type: 'text/plain',
                          value: req.body.msg
                      },
                    ],
                },
            });
            sg.API(requestSG, function (error, response) {
                if (error) {
                    console.log('Error response received');
                    res.send({
                        error : err
                    });
                    output.msg = 'msgError';
                } else {
                    output.msg = 'msgSent';
                }
                res.send(output);
            });
        } else {
            res.send(output);
        }
    } else {
        res.send({
            redirect : '/'
        });
    };
});

app.get('/admin', function (req, res, next) {
    sess = req.session;
    if (sess.email) {
        if (sess.email == process.env.ADMINA_EMAIL || sess.email == process.env.ADMINB_EMAIL) {
            res.render('admin-content');
        } else {
            res.redirect('/');
        }
    } else {
        res.redirect('/');
    }
});

app.get('/admin/data', function (req, res, next) {
    var data = {
        users : [],
        guests : []},
        usersKeys = [];
    return smembersAsync(process.env.RED_KEY2).then(function (obj) {
        if (obj) {
            var getAllAndPushFct = obj.map(function (aIdUser) {
                usersKeys.push(aIdUser);
                if (aIdUser != process.env.ADMINA_EMAIL || process.env.ADMINB_EMAIL) {
                    return hgetallAsync(aIdUser).then(function (hobj) {
                        if (hobj) {
                            if(hobj.infos != "" && hobj.infos != "no infos"){
                                hobj.infos = "["+hobj.infos+"]";
                                var arrInfos;
                                try {
                                    arrInfos = JSON.parse(hobj.infos);
                                } catch (e){
                                    return console.error(e);
                                }
                                hobj.infos = arrInfos;
                            };
                            hobj.id = aIdUser;
                            data.users.push(hobj);
                        } else {
                            res.send(data);
                        }
                    });
                };
            });
            var usersResults = Promise.all(getAllAndPushFct);
            usersResults.then(function(){
                return smembersAsync(process.env.RED_KEY4).then(function (obj) {
                    if (obj) {
                        var getFct = obj.map(function (aIdUser) {
                            if (usersKeys.indexOf(aIdUser) < 0) {
                                return getAsync(aIdUser).then(function (sobj) {
                                    if (sobj) {
                                        var guestValue;
                                        try {
                                            guestValue = JSON.parse(sobj);
                                        } catch (e) {
                                            return console.error(e);
                                        }
                                        data.guests.push(guestValue);
                                    };
                                });
                            };
                        });
                        var guestResults = Promise.all(getFct);
                        guestResults.then(function(){
                            res.send(data);
                        });
                    } else {
                        res.send(data);
                    };
                });
            });
        } else {
            res.send(data);
        }
    });
});

app.get('*', function(req, res, next){    
    sess = req.session;
    if (sess) {
        if (sess.email) {
            res.redirect('/pt/home');
        }else 
            res.redirect('/pt/login');
    } else 
        res.redirect('/pt/login');
});

app.listen(port, function () {
    console.log('Server started on port ' + port);
});

var createPassword = function (aFirstName, aLastName) {
    return S(aFirstName).left(1).toLowerCase() + S(aLastName).left(1).toLowerCase() + random.integer(10, 99);
}

var viewsCounter = function (aId, aSess, aClient) {
    if (aClient.exists(aId) > 0) {
        if (aSess.page_views) {
            aSess.page_views++;
        } else {
            aSess.page_views = 1;
        }
        aClient.hset(aId, 'viewsCounter', aSess.page_views);
    }
    aSess.save();
};