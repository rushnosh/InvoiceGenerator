const Activity = require('../models/Activity')
const Category = require('../models/Category')

exports.viewCreateScreen = async function (req,res) {
    try {
        let categories = await Category.findByAuthorId(req.session.user._id)
        res.render('create-activity', {categories: categories})
    } catch (error) {
        res.render('404')
    }

}

exports.create = function (req, res) {
    let activity = new Activity(req.body, req.session.user._id)
    activity.create().then(function (newId) {
        req.flash("success", "New Activity successfully created")
        req.session.save(()=> res.redirect(`activity/${newId}`))
    }).catch(function (errors) {
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/create-activity"))
    })
}

exports.viewSingle = async function(req, res) {
    try {
        let activity = await Activity.findSingleById(req.params.id, req.visitorId)
        res.render('single-activity-screen', {activity: activity})
    } catch {
        res.render('404')
    }
}

exports.viewEditScreen = async function(req, res) {
    try {
        let activity = await Activity.findSingleById(req.params.id, req.visitorId)
        activity.categories = categories = await Category.findByAuthorId(req.session.user._id)

        if (activity.isVisitorOwner) {
            res.render("edit-activity", {activity: activity})
        } else {
            req.flash("errors", "You dont have permission to perform that action.")
            req.session.save(()=> res.redirect("/"))
        }
    } catch {
        res.render("404")
    }
}

exports.edit = function (req, res) {
    let activity = new Activity(req.body, req.visitorId, req.params.id)
    activity.update().then((status) => {
        // the activity was successfully updated in the database
        // or user did have permission but there where validation errors
        if (status == "success") {
            // activity was updated in DB
            req.flash("success", "Activity successfully updated.")
            req.session.save(function(){
                res.redirect(`/activity/${req.params.id}/edit`) 
            })
        } else {
            // Validation errors
            activity.errors.forEach(function(error){
                req.flash("errors", error)
            })
            req.session.save(function(){
                res.redirect(`/activity/${req.params.id}/edit`)
            })
        }
    }).catch(() => {
        // a activity with the requested id does not exsists
        // or if the current visitor is not the owner of the requested activity
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(function() {
            res.redirect("/")
        })
    })
}

exports.delete = function (req, res) {
    Activity.delete(req.params.id, req.visitorId).then(() => {
        // the activity was deleted
        req.flash("success", "Activity successfully deleted")
        //req.session.save(() => {res.redirect(`/profile/${req.session.user.username}`)})
        req.session.save(() => {res.redirect(`/create-activity/viewall`)})
    }).catch(() =>{
        req.flash("errors", "You do not have permission to perform that action")
        req.session.save(() => res.redirect("/"))
    })
}