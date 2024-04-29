const Activity = require('../models/Activity')
const Category = require('../models/Category')
const TimeScheduler = require('../models/TimeScheduler')
//to sanitize the html
const sanitizeHTML = require('sanitize-html')


exports.viewTimeScheduler = async function (req,res) {
    try {
        let activities = await Activity.findByAuthorIdOjectIDSortByCategory(req.session.user._id)
        let selectedSchedules = await TimeScheduler.findTodaysTimeSchedulesByAuthorId(req.visitorId)
        //console.log(todaysSchedules)
        res.render('time-scheduler', {activities: activities, selectedSchedules: selectedSchedules})
    } catch (error) {
        res.render('404')
    }

}

exports.viewPastTimeScheduler = async function (req,res) {
    try {
        let prevDate = {}
        let selectedSchedules = []// = await TimeScheduler.findTodaysTimeSchedulesByAuthorId(req.visitorId)
        res.render('past-time-scheduler', {selectedSchedules: selectedSchedules, prevDate: prevDate})
    } catch (error) {
        res.render('404')
    }
}

exports.queryPastTimeScheduler = async function (req,res) {
    try {
        //Set regex to match YYYY-MM-DD
        let dateRegex = new RegExp("^((19|20)?[0-9]{2}[- /.](0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01]))*$")
        let prevDate = {}
        if (req.params.startDate != undefined) {
            // For returned scheduled updates - using the URL as the paramaters
            prevDate = {
                startDate: req.params.startDate,
                endDate: req.params.endDate
            }
        } else {
            // Using the form data to then query
            prevDate = {
                startDate: req.body.startDate,
                endDate: req.body.endDate
            }
        }
        /*here we want to check a few things - if the dates are in the correct order (Start to end)
            and if there is no fudged up parameter data from the form.
        */
        if (typeof prevDate.startDate != 'string' || typeof prevDate.endDate != 'string') 
        {
            req.flash("errors", "Not correct data types, please try again.")
            req.session.save(function(){
                res.redirect(`/time-scheduler/past`) 
            })
        } else if (!dateRegex.test(prevDate.startDate) || !dateRegex.test(prevDate.endDate)) {
            req.flash("errors", "Enter in valid date values, please")
            req.session.save(function(){
                res.redirect(`/time-scheduler/past`) 
            })
        } else if (new Date(prevDate.startDate) > new Date(prevDate.endDate)) {
            req.flash("errors", "Start Date needs to be a date in past - before the end date.")
            req.session.save(function(){
                res.redirect(`/time-scheduler/past`) 
            })
        } else {
            let selectedSchedules = await TimeScheduler.findCustomTimeSchedulesByAuthorId(prevDate, req.visitorId)
            if (selectedSchedules.length > 0) {
                res.render('past-time-scheduler', {selectedSchedules: selectedSchedules, prevDate: prevDate})
            } else {
                req.flash("errors", "Sorry, no past search results with your chosen dates appeared.")
                req.session.save(function(){
                    res.redirect(`/time-scheduler/past`) 
                })
            }

        }
    } catch (error) {
        req.flash("errors", "Something went wrong with the custom search. " + error)
        req.session.save(function(){
            res.redirect(`/time-scheduler/past`) 
        })
    }
}



exports.createNewTimeActivity = function (req, res) {
    let timeScheduler = new TimeScheduler(req.body, req.session.user._id)
    timeScheduler.startActivity().then(function (info) {
        if (info) {
            req.flash("success", "Time Schedule Actvity Started.")
            req.session.save(function(){
                res.redirect(`/time-scheduler`) 
            })
        } else {
            req.flash("errors", "Time Schedule Actvity did not start, please try again.")
            req.session.save(function(){
                res.redirect(`/time-scheduler`) 
            })   
        }
    }).catch(function () {
        res.render('404')
    })
}

exports.stop = function (req, res) {
    TimeScheduler.stop(req.params.id, req.visitorId).then(() => {
        // the activity was deleted
        req.flash("success", "Schedule successfully stopped")
        req.session.save(() => {res.redirect('/time-scheduler')})
    }).catch(() =>{
        req.flash("errors", "You do not have permission to perform that action")
        req.session.save(() => res.redirect("/"))
    })
}


exports.viewEditScreen = async function(req, res) {
    try {
        let editSchedule = await TimeScheduler.findSingleById(req.params.id, req.visitorId)
        if (req.params.stime != undefined && editSchedule.isVisitorOwner) {
            let timeSearch = {
                startDate: req.params.stime,
                endDate: req.params.etime
            }
            res.render("edit-schedule", {editSchedule: editSchedule, timeSearch: timeSearch})
        } else if (editSchedule.isVisitorOwner) {
            let timeSearch = {}
            //res.send("Success")
            res.render("edit-schedule", {editSchedule: editSchedule, timeSearch: timeSearch})
        } else {
            req.flash("errors", "You dont have permission to perform that action.")
            req.session.save(()=> res.redirect("/"))
        }
    } catch {
        res.render("404")
    }
}

exports.edit = function (req, res) {
    //console.log(req.params.stime)
    let timeSchedule = new TimeScheduler(req.body, req.visitorId, req.params.id)
    timeSchedule.update().then((status) => {
        if (status == "success" && req.params.stime != undefined) {
            // timeSchedule was updated in DB
            // return back to search results with longer flash message
            req.flash("success", "Time Schedule successfully updated. You can go back to your search results with the Cancel button or back button")
            req.session.save(function(){
                res.redirect(`/time-scheduler/${req.params.id}/edit/${req.params.stime}/${req.params.etime}`) 
            })
        } else
        // the timeSchedule was successfully updated in the database
        // or user did have permission but there where validation errors
        if (status == "success") {
            // timeSchedule was updated in DB
            req.flash("success", "Time Schedule successfully updated.")
            req.session.save(function(){
                res.redirect(`/time-scheduler/${req.params.id}/edit`) 
            })
        } else {
            // Validation errors
            timeSchedule.errors.forEach(function(error){
                req.flash("errors", error)
            })
            req.session.save(function(){
                res.redirect(`/time-scheduler/${req.params.id}/edit`)
            })
        }
    }).catch(() => {
        // a timeSchedule with the requested id does not exsists
        // or if the current visitor is not the owner of the requested timeSchedule
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(function() {
            res.redirect("/")
        })
    })
}

// Delete time schedules
exports.viewDeleteScreen = async function(req, res) {
    try {
        let deleteSchedule = await TimeScheduler.findSingleById(req.params.id, req.visitorId)
        if (req.params.stime != undefined && deleteSchedule.isVisitorOwner) {
            let timeSearch = {
                startDate: req.params.stime,
                endDate: req.params.etime
            }
            res.render("delete-schedule", {deleteSchedule: deleteSchedule, timeSearch: timeSearch})
        } else
        if (deleteSchedule.isVisitorOwner) {
            let timeSearch = {}
            //res.send("Success")
            res.render("delete-schedule", {deleteSchedule: deleteSchedule, timeSearch: timeSearch})
        } else {
            req.flash("errors", "You dont have permission to perform that action.")
            req.session.save(()=> res.redirect("/"))
        }
    } catch {
        res.render("404")
    }
}

exports.delete = function (req, res) {
    TimeScheduler.delete(req.params.id, req.visitorId).then((status) => {
        if (status == "success" && req.params.stime != undefined) {
            // timeSchedule was updated in DB
            // return back to search results with longer flash message
            req.flash("success", "Time Schedule successfully deleted. Here are your results now.")
            req.session.save(function(){
                res.redirect(`/time-scheduler/past/${req.params.stime}/${req.params.etime}`) 
            })
        } else if (status == "success") {
            // the activity was deleted
            req.flash("success", "Schedule successfully deleted")
            req.session.save(() => {res.redirect('/time-scheduler')})
        }

    }).catch(() =>{
        req.flash("errors", "You do not have permission to perform that action")
        req.session.save(() => res.redirect("/"))
    })
}

exports.testQuery = async function(req, res) {
    try {
        let a = await TimeScheduler.findTodaysTimeSchedulesByAuthorId(req.visitorId)

        res.send("Success")
    } catch {
        res.render("404")
    }
}