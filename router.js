//Express will return a mini application for the router
const express = require('express')
//Ensure you use the express method of Router() - case is sencitive
//more information here - https://www.tutorialspoint.com/expressjs/expressjs_routing.htm
const router = express.Router()

//Add in the controllers for the router to use
const userController = require('./controllers/userController')
const activityController = require('./controllers/activityController')
const categoryController = require('./controllers/categoryController')
const clientController = require('./controllers/clientController')
const invoiceGeneratorController = require('./controllers/invoiceGeneratorController')
const timeSchedulerController = require('./controllers/timeSchedulerController')

//user related routes
router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

//If someone forgets their password - like me :(
router.get('/forgotpassword', userController.renderForgotPasswordPage)
router.post('/forgotpassword', userController.forgotPassword)
router.get('/forgotpassword/reset/:token', userController.renderResetPasswordPage)
router.post('/forgotpassword/reset/:token', userController.resetUserPassword)

// profile related routes - we're using the profile page to store the BSB and account details for user
router.get('/profile/:username', userController.ifUserExists, userController.profileActivityScreen)
//we're using the profile page to store the BSB and account details for user
router.get('/profile/:id/settings', userController.mustBeLoggedIn, userController.profileSettingsScreen)
router.post('/profile/:id/settings', userController.mustBeLoggedIn, userController.updateProfileSettings)

//For frontend registration form
router.post('/doesUsernameExsist', userController.doesUserNameExsist)
router.post('/doesEmailExsist', userController.doesEmailExsist)

// activity related routes
router.get('/create-activity', userController.mustBeLoggedIn, activityController.viewCreateScreen)
router.post('/create-activity', userController.mustBeLoggedIn, activityController.create)
router.get('/activity/:id', userController.mustBeLoggedIn, activityController.viewSingle)
router.get('/activity/:id/edit', userController.mustBeLoggedIn, activityController.viewEditScreen)
router.post('/activity/:id/edit',userController.mustBeLoggedIn, activityController.edit)
router.post('/activity/:id/delete',userController.mustBeLoggedIn, activityController.delete)
//router.get('/profile/:username', userController.ifUserExists, userController.profileActivityScreen)
router.get('/create-activity/viewall', userController.mustBeLoggedIn, userController.viewAllActivitiesScreen)

// Client related routes
router.get('/view-clients', userController.mustBeLoggedIn, clientController.viewClientsScreen)
router.get('/create-client', userController.mustBeLoggedIn, clientController.createNewClientScreen)
router.post('/create-client', userController.mustBeLoggedIn, clientController.createNewClient)
//We'll use the client details page as an update page as well
router.get('/client/:id/details', userController.mustBeLoggedIn, clientController.viewClientDetailsScreen)

router.post('/client/:id/edit', userController.mustBeLoggedIn, clientController.updateClient)
router.get('/client/:id/delete', userController.mustBeLoggedIn, clientController.viewDeleteScreen)
router.post('/client/:id/delete', userController.mustBeLoggedIn, clientController.delete)


// Create category for activity
router.get('/create-category', userController.mustBeLoggedIn, categoryController.viewOnCreatePage)
router.post('/create-category', userController.mustBeLoggedIn, categoryController.create)
router.get('/category/:id/delete', userController.mustBeLoggedIn, categoryController.viewDeleteScreen)
router.post('/category/:id/delete',userController.mustBeLoggedIn, categoryController.delete)
router.get('/category/:id/edit', userController.mustBeLoggedIn, categoryController.viewEditScreen)
router.post('/category/:id/edit',userController.mustBeLoggedIn, categoryController.edit)

//Time scheduler routes
router.get('/time-scheduler', userController.mustBeLoggedIn, timeSchedulerController.viewTimeScheduler)
router.post('/time-scheduler/create', userController.mustBeLoggedIn, timeSchedulerController.createNewTimeActivity)
router.get('/time-scheduler/:id/edit', userController.mustBeLoggedIn, timeSchedulerController.viewEditScreen)
router.post('/time-scheduler/:id/edit',userController.mustBeLoggedIn, timeSchedulerController.edit)
router.get('/time-scheduler/:id/delete', userController.mustBeLoggedIn, timeSchedulerController.viewDeleteScreen)
router.post('/time-scheduler/:id/delete',userController.mustBeLoggedIn, timeSchedulerController.delete)
router.post('/time-scheduler/:id/stop',userController.mustBeLoggedIn, timeSchedulerController.stop)
router.post('/time-scheduler/test', userController.mustBeLoggedIn, timeSchedulerController.testQuery)

// Include params to reroute to search results
router.get('/time-scheduler/:id/edit/:stime/:etime', userController.mustBeLoggedIn, timeSchedulerController.viewEditScreen)
router.post('/time-scheduler/:id/edit/:stime/:etime', userController.mustBeLoggedIn, timeSchedulerController.edit)
router.get('/time-scheduler/:id/delete/:stime/:etime', userController.mustBeLoggedIn, timeSchedulerController.viewDeleteScreen)
router.post('/time-scheduler/:id/delete/:stime/:etime',userController.mustBeLoggedIn, timeSchedulerController.delete)


// View Past time schedules
router.get('/time-scheduler/past', userController.mustBeLoggedIn, timeSchedulerController.viewPastTimeScheduler)
router.get('/time-scheduler/past/:startDate/:endDate', userController.mustBeLoggedIn, timeSchedulerController.queryPastTimeScheduler)
router.post('/time-scheduler/past/select', userController.mustBeLoggedIn, timeSchedulerController.queryPastTimeScheduler)

// generate invoice related routes
router.get('/generate-invoice', userController.mustBeLoggedIn, invoiceGeneratorController.viewGenerateInvoiceScreen)
router.post('/generate-invoice/date', userController.mustBeLoggedIn, invoiceGeneratorController.generateInvoice)

//Get public holidays - need to improve on this one
router.post('/client/publicholidayfetch', userController.mustBeLoggedIn, clientController.getPublicHolidays)

module.exports = router
