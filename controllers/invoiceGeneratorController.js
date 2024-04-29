const fs = require("fs")
const docx = require("docx")
// Require the Invoice Generator class
const InvoiceGenerator = require('../models/InvoiceGenerator')
const Client = require('../models/Client')
const packer = new docx.Packer();


exports.viewGenerateInvoiceScreen = function(req, res) {
    //Retrive all of the Clients - then show the site
    //res.render('generate-invoice')
    Client.findByAuthorId(req.session.user._id)
    .then((clients) => {
            if (clients.length > 0) {
                res.render('generate-invoice', {clients: clients})
            } else {

            }
        }
    ).catch(()=>{
        res.render('404')
        }  
    )

}

exports.generateInvoice = function (req, res) {
    let invGen = new InvoiceGenerator(req.body, req.session.user._id)
    //initiallise the profile data
    invGen.profileDataObtain().then(() => {
    //Gain Invoice number
    let invNumb = parseInt(invGen.getInvoiceNumber()).toLocaleString('en', {minimumIntegerDigits:4,useGrouping:false})
    invGen.generateInvoice().then(function (b64bitString) {       
        if (b64bitString == "clientUpdate") {
            // Client validation errors
            invGen.errors.forEach(function(error){
                req.flash("errors", error)
            })
            req.session.save(function(){
                res.redirect(`/view-clients`)
            })
        } else if (b64bitString == "fgbtps") {
            // Profile validation errors
            invGen.errors.forEach(function(error){
                req.flash("errors", error)
            })
            req.session.save(function(){
                res.redirect(`/profile/${req.session.user._id}/settings`)
            })
        } else if (b64bitString == 'fail') {
            // Validation errors
            invGen.errors.forEach(function(error){
                req.flash("errors", error)
            })
            req.session.save(function(){
                res.redirect(`/generate-invoice`)
            })
        } else {
            //The array of documents was returned - send them!
            res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invNumb}.docx`);
            res.send(Buffer.from(b64bitString, 'base64'));

        } 
    })}).catch(function (error) {
        req.flash("errors", error)
        req.session.save(function(){
            res.redirect(`/generate-invoice`)
        })
    })
}