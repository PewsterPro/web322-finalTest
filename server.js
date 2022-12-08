const express = require("express");
const exphbs = require("express-handlebars");
const { INSPECT_MAX_BYTES } = require("buffer");
const clientSessions = require('client-sessions');
const dataService = require("./Module final");

const HTTP_PORT = process.env.PORT || 8080;

const app = express();

app.engine('.hbs', exphbs.engine({ 
    extname: '.hbs',
    helpers: {
        navLink: function(url, options){
            return '<li' +
            ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
            '><a href=" ' + url + ' ">' + options.fn(this) + '</a></li>';
           },
           equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
            return options.inverse(this);
            } else {
            return options.fn(this);
            }
           }
    }
}));
app.set('view engine', '.hbs');

function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
    return new Promise((res, req) => {
        dataService.startDB().then(() => {
        }).catch((err) => {
            console.log(err);
        });
    });
}

app.get("/", (req, res) => {
    res.render('home');
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/signin", (req,res) => {
    res.render("signin");
});

app.get("/register", (req,res) => {
    res.render("register");
});

app.post("/register", (req,res) => {
    dataService.register(req.body)
    .then(() => res.render("register", {successMessage: "User created" } ))
    .catch (err => res.render("register", {errorMessage: err, userName:req.body.userName }) )
});

app.post("/signin", (req,res) => {
    req.body.userAgent = req.get('User-Agent');
    dataService.signin(req.body)
    .then(user => {
        req.session.user = {
            email:user.email,
        }
    })
    .catch(err => {
        res.render("signin", {errorMessage:err, userName:req.body.userName} )
    }) 
});

app.use(express.static('public'));

app.use(function (req, res) {
    res.status(404).sendFile(path.join(__dirname,"/views/error404.html"));});

app.use(clientSessions( {
    cookieName: "session",
    secret: "web_a6_secret",
    duration: 2*60*1000,
    activeDuration: 1000*60
}));

app.use((req,res,next) => {
    res.locals.session = req.session;
    next();
});




app.listen(HTTP_PORT, onHttpStart);