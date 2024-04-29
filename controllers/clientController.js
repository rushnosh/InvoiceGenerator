// Client Controller
const Client = require('../models/Client')

exports.viewClientsScreen = function (req,res) {
    //View all clients in list
    //View current categories within the create page
    Client.findByAuthorId(req.session.user._id).then(function(clients){
        res.render('view-clients',{
            clients: clients,
            username: req.session.user.username,
            avatar: req.session.user.avatar
        })
    }).catch(function(){
        res.render('404')
    })
}

exports.viewClientDetailsScreen = async function (req,res) {
    /*Here we need to create the client object to obtain all of its data, then popluate it
    to the client details screen*/
    let clientData = await Client.getClientDataById(req.params.id, req.visitorId)
    if (clientData.isVisitorOwner) {
        //Details of the client
        res.render("client-details", {clientData: clientData})
    } else {
        req.flash("errors", "You dont have permission to perform that action.")
        req.session.save(()=> res.redirect("/"))
    }
}

exports.createNewClientScreen = function (req,res) {
    // Create a new client
    res.render('create-client')
}

exports.createNewClient = function (req,res) {
    let client = new Client(req.body, req.session.user._id)
    client.create().then(function (clientId) {
        req.flash("success", "New Client successfully created")
        req.session.save(()=> res.redirect(`/client/${clientId}/details`))
    }).catch(function (errors) {
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("view-clients"))
    })
}


// Delete Client
exports.delete = function (req, res) {
    Client.delete(req.params.id, req.visitorId).then(() => {
        // the activity was deleted
        req.flash("success", "Client successfully deleted")
        req.session.save(() => {res.redirect('/view-clients')})
    }).catch(() =>{
        req.flash("errors", "You do not have permission to perform that action")
        req.session.save(() => res.redirect("/"))
    })
}

// Delete Client Screen
exports.viewDeleteScreen = async function(req, res) {
    try {
        let deleteClientData = await Client.getClientDataById(req.params.id, req.visitorId)
        if (deleteClientData.isVisitorOwner) {
            //res.send("Success")
            res.render("delete-client", {deleteClient: deleteClientData})
        } else {
            req.flash("errors", "You dont have permission to perform that action.")
            req.session.save(()=> res.redirect("/"))
        }
    } catch {
        res.render("404")
    }
}

exports.updateClient = function (req,res) {
    // Perform updates to client
    let client = new Client(req.body, req.visitorId, req.params.id)
    client.update().then((status) => {
        // the client was successfully updated in the database
        if (status == "success") {
            // client was updated in DB
            req.flash("success", "Client was successfully updated.")
            req.session.save(function(){
                res.redirect(`/client/${req.params.id}/details`) 
            })
        } else {
            // Validation errors
            client.errors.forEach(function(error){
                req.flash("errors", error)
            })
            req.session.save(function(){
                res.redirect(`/client/${req.params.id}/details`)
            })
        }
    }).catch(() => {
        // a category with the requested id does not exsists
        // or if the current visitor is not the owner of the requested category
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(function() {
            res.redirect("/")
        })
    })
}

exports.deleteClient = function (req,res) {
    // Perform updates to client
    console.log("update client later")
}

exports.getPublicHolidays = function (req,res) {
    let client = new Client(req.body)
    client.populatePublicHolidays().then(()=>{
        req.flash("seccess", "Public holiday data updated.")
        req.session.save(function() {
            res.redirect("/")
        })
    }).catch(function (errors) {
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/"))
    })
}