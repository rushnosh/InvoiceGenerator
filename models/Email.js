const nodemailer = require("nodemailer")
const dotenv = require('dotenv')

//Constructor for email object - using nodemailer
let Email = function(toEmail,fromEmail,subject,text,html) {
    this.smtpTransport = nodemailer.createTransport({
        pool: true,
        host: process.env.EMAILSERVICEHOST,
        port: 465,
        secure: true, // use TLS
        auth: {
          user: process.env.EMAILUSERNAME,
          pass: process.env.EMAILPASSWORD
        }
    }),
    this.mailOptions = {
        to: toEmail,
        from: fromEmail,
        subject: subject,
        text: text,
        html: html
    }
}

Email.prototype.sendEmail = function () {
    return new Promise((resolve, reject) => {
        this.smtpTransport.sendMail(this.mailOptions, function(err) {
            if (err) {
                reject(error)
            } else {
                resolve("success")
            }
          });
    })

}

Email.prototype.verifyConnection = function () {
    return new Promise((resolve, reject) => {
        this.smtpTransport.verify().then((success) => {
            console.log("Server is ready to send a message " + success)
            resolve(true)    
        }).catch((error)=> {
            console.log(error)
            reject(false)
        })
    })
}

module.exports = Email