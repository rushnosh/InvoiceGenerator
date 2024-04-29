//Create usable objects via the /models/User.js file
const User = require('../models/User')
const Activity = require('../models/Activity')


//We need this function to check if the user is actually "logged in"
exports.mustBeLoggedIn = function (req, res, next) {
    if (req.session.user) {
        next()
    } else {
        req.flash("errors", "You must be logged to perform that action")
        req.session.save(function(){
            res.redirect('/')
        })
    }
}

exports.login = function(req, res) {
    let user = new User(req.body)
    user.login().then( (result) => {

        req.session.user = {avatar: user.avatar, username:user.data.username, _id: user.data._id, hasAct: false}
        /*We add the req.session.save function below is to ENSURE that the session data
            got saved into the DB - even though the req.session.user would do this normally
            we want to "ensure" that this task is completed before commencing on the next step
        */
        req.session.save(function(){
            res.redirect('/')
        })
    }).catch(function(err) {
        //We use the "Flash package" here to store "temp data" for the next redirect
        //Great to store temp errors for the user account - https://www.npmjs.com/package/connect-flash
        req.flash('errors' , err)
        req.session.save(function() {
            res.redirect('/')
        })
    })
}

exports.logout = function(req, res) {
    //Delete the session within the Mongo DB using the session.destroy method
    //Then redirect the user to the home page via res.send() via callback function
    req.session.destroy(function(){
        res.redirect('/')
    })
}

exports.register = function(req, res) {
    //Create a new User Object - then call the register method to check for validation and update DB
    let user = new User(req.body)
    //The user.registration returns a PROMISE
    user.register().then(() => {
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id, hasAct: false}
        req.session.save(function(){
            res.redirect('/')
        })
    }).catch((regErrors) => {
        //We loop through any Validation errors which was sent as an array from within the User.js
        //class - we then store them within the flash message of regErrors
        regErrors.forEach(function(error){
            req.flash('regErrors', error)
        })
        req.session.save(function(){
            res.redirect('/')
        })
    })
}

exports.renderForgotPasswordPage = function(req, res) {
    res.render('forgot', {regErrors: req.flash('regErrors')})
}

exports.forgotPassword = function(req, res) {
    //Create a new User Object - then call the forgotPassword method to check DB and send forgot email
    let user = new User(req.body)
    //The user.forgotPassword returns a PROMISE
    user.forgotPassword(req.headers.host).then((status) => {
        req.flash('success', "Email sent succesfully to " + user.data.forgotEmail + ". Please check your inbox for the Password Reset URL.")
        req.session.save(function(){
            res.redirect('/forgotpassword')
        })
    }).catch((regErrors) => {
        //We loop through any Validation errors which was sent as an array from within the User.js
        //class - we then store them within the flash message of regErrors
        regErrors.forEach(function(error){
            req.flash('regErrors', error)
        })
        req.session.save(function(){
            res.redirect('/forgotpassword')
        })
    })
}

exports.renderResetPasswordPage = function(req, res) {
       //Create a new User Object - then check the token within user Collection
       let user = new User(req.body)
       //The user.forgotPassword returns a PROMISE
       user.checkForgotPasswordToken(req.params.token).then(() => {
           req.flash('success', "Please entre in a new password.")
           req.session.save(function(){
               res.render('resetpassword', {token: req.params.token,regErrors: req.flash('regErrors')})
           })
       }).catch((regErrors) => {
           //We loop through any Validation errors which was sent as an array from within the User.js
           //class - we then store them within the flash message of regErrors
           regErrors.forEach(function(error){
               req.flash('regErrors', error)
           })
           req.session.save(function(){
               res.redirect('/forgotpassword')
           })
       })
}

exports.resetUserPassword = function(req, res){
    //Create a new User Object - then finally reset the user password
    let user = new User(req.body)
    //The user.forgotPassword returns a PROMISE
    user.resetUserPasswordWithToken(req.params.token).then((recUser) => {
        req.flash('success', "Have sucessfully updated the password for User " + recUser.value.username + ". Please use the new password now.")
        req.session.save(function(){
            res.redirect('/')
        })
    }).catch((regErrors) => {
        //We loop through any Validation errors which was sent as an array from within the User.js
        //class - we then store them within the flash message of regErrors
        regErrors.forEach(function(error){
            req.flash('regErrors', error)
        })
        req.session.save(function(){
            res.redirect('/forgotpassword/')
        })
    })
}

//This is the user/guest Home page
exports.home = async function(req, res) {
    if (req.session.user) {
        if (req.session.user._id != 'undefined') {
            let userActivities = []
            userActivities = await Activity.findByAuthorIdWithOjectID(req.session.user._id)
            if (userActivities.length > 0){
                req.session.user.hasAct = true
            } else {
                req.session.user.hasAct = false
            }
        }
        res.render('home-dashboard', {user: req.session.user})
    } else {
        //If the flash has a current session of errors - the below will pass the 
        // "flash" array of errors and then update the session data to remove the flash
        // messages
        res.render('home-guest', {regErrors: req.flash('regErrors')})
    }
}

//For user regirstion form front end
exports.doesUserNameExsist = function(req, res) {
    User.findByUsername(req.body.username).then(function(){
        res.json(true)
    }).catch(function(){
        res.json(false)
    })
}

exports.doesEmailExsist = async function(req, res) {
    let emailBool = await User.doesEmailExsist(req.body.email)
    res.json(emailBool)
}

//End user registation form functions

exports.ifUserExists = function (req, res, next) {
    User.findByUsername(req.params.username).then(function(userDocument){
        req.profileUser = userDocument
        next()
    }).catch(function(){
        res.render('404')
    })
}

exports.ifUserExistsViaSession = function (req, res, next) {
    User.findByUsername(req.session.user.username).then(function(userDocument){
        req.sessionUser = userDocument
        next()
    }).catch(function(){
        res.render('404')
    })
}

exports.profileActivityScreen = function (req, res) {
    // ask our Activity model for activities by a certain author id
    Activity.findByAuthorId(req.profileUser._id).then(function(activities){
        res.render('profile', {
            activities: activities,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar
        })
    }).catch(function(){
        res.render('404')
    })

}

exports.viewAllActivitiesScreen = function (req, res) {
    // ask our Activity model for activities by a certain author id
    Activity.findByAuthorIdOjectIDSortByCategory(req.session.user._id).then(function(activities){
        res.render('view-all-activities', {
            activities: activities,
            profileUsername: req.session.user.username,
            profileAvatar: req.session.user.avatar
        })
    }).catch(function(){
        res.render('404')
    })

}

exports.profileSettingsScreen = function (req, res) {
    let user = new User(req.session.user)
    user.getProfileSettings().then( function (info) {
        if (info) {
            res.render('profile-settings', {user: req.session.user, profileData: info}) 
        } else {
            res.render('profile-settings', {user: req.session.user})
        }
    }).catch( function (error) {
        req.flash('errors', "There was an error when retrieving profile settings " + error)
        req.session.save(function(){
            res.redirect('/')
        })
    })
}

exports.updateProfileSettings = function (req, res) {
        let user = new User(req.session.user,false,req.body)
        user.setProfileSettings().then( function(){
            req.flash('success', "Profile settings had been updated succesfully.")
            req.session.save(function(){
                res.redirect(`/profile/${req.session.user._id}/settings`)
            })
        }).catch( function(profileErrors ){
            profileErrors.forEach(function(error){
                req.flash('errors', error)
            })
            req.session.save(function(){
                res.redirect(`/profile/${req.session.user._id}/settings`)
            })
        })
}