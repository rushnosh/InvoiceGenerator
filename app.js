//Creates the Server side express object - assign to app
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizedHTML = require('sanitize-html')
const csrf = require('csurf')

const app = express()

let sessionOptions = session({
    secret: "Rushnosh is amazing at scraaatching",
    store: MongoStore.create({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {
        //Can only set secure to true when there is an SSL cert Prod environment set up
        // see https://stackoverflow.com/questions/44039069/express-session-secure-cookies-not-working
        //secure: process.env.SECURECOOKIE,
        //One day
        //maxAge: 1000 * 60 * 60 * 24,
        //One hour
        maxAge: 1000 * 60 * 60,
        httpOnly: true
    }
})


app.use(sessionOptions)
app.use(flash())

//We use this function so we can add the user object to all EJS template calls
app.use(function(req, res, next ){
    // make our markdown function availabile from within ejs templates
    // cheatsheet for markdowns - https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
    res.locals.filterUserHTML = function(content) {
        //we are "Disallowing LINKS" from the markdown content
        return sanitizedHTML(markdown.parse(content), {allowedTags:[
            'p', 'br', 'ul','ol','li','stong','bold','i','em','h1','h2','h3','h4','h5','h6'
        ], allowedAttributes: {}})
    }
    // make all error and success flash messages available from all templates
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")

    // make current user id available on the req object
    if (req.session.user) {req.visitorId = req.session.user._id} else { req.visitorId = 0}

    // make user session data avaialble from view templates
    res.locals.user = req.session.user
    next()
})

//Importing our router file for all get and post requests
const router = require('./router')

//Enable HTML Form "Submit" - this will be sent within the req.body object
app.use(express.urlencoded({extended: false}))
//Enable the JSON (Javascript Object Notation) for the application
app.use(express.json())
//Let the "public" folder excessable to the client end (browser)
app.use(express.static('public'))

//Create a "Templating engine" option to use the EJS Templating engine
//more information here - https://ejs.co/#install
app.set('views', 'views')
app.set('view engine', 'ejs')

//Using the csurf cross script protection here
app.use(csrf())

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use( function (err, req, res, next) {
    if (err) {
        if (err.code == "EBADCSRFTOKEN") {
            req.flash('errors', "Cross site request forgery detected.")
            req.session.save(() => res.redirect('/'))
        } else {
            res.render("404")
        }
    }
})
/*We are using the ./router.js file which will control
    all of the get and responce requests
*/
app.use('/', router)

module.exports = app