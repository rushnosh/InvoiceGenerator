//Used for database connections
const usersCollection = require('../db').db().collection("users")
const usersProfileCollection = require('../db').db().collection("usersProfile")
//Used to validate emails and text of strings
const validator = require("validator")
//Used to HASH Passwords and performs the matching algorithms
const bcrypt = require('bcryptjs')

//Used to generate a random token figure for the password reset feature
const crypto = require('crypto');
const Email = require('./Email')
const dotenv = require('dotenv')

//MD5 is use to has the eamil address for the gravatar
const md5 = require('md5')

//For Profile Settings mapping
const ObjectID = require('mongodb').ObjectId


//Creating a User class to place in the Business logic for a User
let User = function(data, getAvatar, profileData) {
    this.data = data
    this.errors = []
    if(profileData == undefined) {this.profileData = {}} else {this.profileData = profileData}
    //If no second parameter was sent - then the get avatar function will have to be ran
    //separately - use the getAvatar function only when we just requrie the link
    if (getAvatar == undefined) {getAvatar = false}
    if (getAvatar) {this.getAvatar()}
}

/*We use the Object.prototype to create class methods 
 instead of adding the method from within the constructor
 function.
We do this way so from a computing stand point we're
not duplicating the code into every object being created,
just using the "prototype" as a "refrence" to the mehtod
being called - more info https://www.w3schools.com/js/js_object_prototypes.asp
*/
User.prototype.validate = function(){
    return new Promise(async (resolve, reject) => {
        if (this.data.username == "") {this.errors.push("You must provide a username.")}
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers.")}
        if (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address.")}
        if (this.data.password == "") {this.errors.push("You must provide a password.")}
        
        if (this.data.password.length > 0 && this.data.password.length < 5) {this.errors.push("Password must be at least 6 characters.")}
        if (this.data.password.length > 50) {this.errors.push("Password cannot exceed 50 characters")}
        
        if (this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least 3 characters.")}
        if (this.data.username.length > 30) {this.errors.push("Username cannot exceed 30 characters.")}
    
        //Check if the user name or email is already taken
        if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExsists = await usersCollection.findOne({username: this.data.username})
            if (usernameExsists) {this.errors.push("That username is already taken.")}
        }
        if (validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if (emailExists) {this.errors.push("That email address is already being used")}
        }
        resolve()
    })
}

User.prototype.validateProfileData = function () {
    if (!validator.isNumeric(this.profileData.nextinvoiceno)){this.errors.push("The invoice number must be a number, no characters allowed.")}
    if (!validator.isEmail(this.profileData.emailaddress)){this.errors.push("You must provide a valid email address to update your email.")}
    if (!validator.isNumeric(this.profileData.phonenumber)){this.errors.push("The phone number must be a number, no characters allowed.")}
    if (!validator.isNumeric(this.profileData.abn)){this.errors.push("The abn number must be a number, no characters allowed.")}
    if (!validator.isNumeric(this.profileData.bsb)){this.errors.push("The bsb number must be a number, no characters allowed.")}
    if (!validator.isNumeric(this.profileData.accountno)){this.errors.push("The accountno number must be a number, no characters allowed.")}
}
 
/*
    NOTE the use of the "Arrow function" below - we want the key word 'this' to be pointing to the
    User object and not the GLOBAL SCOPE object
    The arrow key function will ensure that the "this" object will assign back to the user object

    We're also use the bcryptjs package to perform HASH password compares here
    */

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        usersCollection.findOne({username: this.data.username}).then((attemptedUser) => {
                if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                    this.data = attemptedUser
                    this.getAvatar()
                    resolve("Congrats")
                } else {
                    reject("Invalid username or password")
                }
            }
        ).catch(function(error){
            reject("Please try again later.")
            console.log(error)
        })
    })
}

User.prototype.cleanUp = function() {
    if (typeof(this.data.username) != "string") {this.data.username = ""}
    if (typeof(this.data.email) != "string") {this.data.email = ""}
    if (typeof(this.data.password) != "string") {this.data.password = ""}

    // get rid of any bogus properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.cleanUpForForgetPassword = function() {
    if (typeof(this.data.password) != "string") {this.data.password = ""}
    this.data = {
        forgotEmail: this.data.forgotEmail.trim().toLowerCase()
    }
}

User.prototype.cleanUpProfileData = function() {
    if (typeof(this.profileData.fullname) != "string") {this.profileData.fullname = ""}
    if (typeof(this.profileData.emailaddress) != "string") {this.profileData.emailaddress = ""}
    if (typeof(this.profileData.phonenumber) != "string") {this.profileData.phonenumber = ""}
    if (typeof(this.profileData.abn) != "string") {this.profileData.abn = ""}
    if (typeof(this.profileData.bsb) != "string") {this.profileData.bsb = ""}
    if (typeof(this.profileData.accountno) != "string") {this.profileData.accountno = ""}
    if (typeof(this.profileData.address1) != "string") {this.profileData.address1 = ""}
    if (typeof(this.profileData.address2) != "string") {this.profileData.address2 = ""}
    if (typeof(this.profileData.address3) != "string") {this.profileData.address3 = ""}
    if (typeof(this.profileData.nextinvoiceno) != "string") {this.profileData.nextinvoiceno = ""}

    // get rid of any bogus properties
    this.profileData = {
        userid: new ObjectID(this.data._id),
        fullname: this.profileData.fullname.trim(),
        emailaddress: this.profileData.emailaddress.trim(),
        phonenumber: this.profileData.phonenumber.trim(),
        abn: this.profileData.abn.trim(),
        bsb: this.profileData.bsb.trim(),
        accountno: this.profileData.accountno.trim(),
        address1: this.profileData.address1.trim(),
        address2: this.profileData.address2.trim(),
        address3: this.profileData.address3.trim(),
        nextinvoiceno: this.profileData.nextinvoiceno.trim()
    }
}

User.prototype.hashThePassword = function(password){
    let saltRounds = bcrypt.genSaltSync(10);
    this.data.password = bcrypt.hashSync(password,saltRounds)
}

User.prototype.register = function (){
    return new Promise(async (resolve, reject) => {
        // Step #1 Validate User Data
        this.cleanUp()
        await this.validate()
    
        // Step #2 Only if there are no validation errors then save the user data into a database
        if (!this.errors.length) {
            // First lets HASH the password then apply this within the user.password property
            this.hashThePassword(this.data.password)
            //Then create the new User Object from within the database
            await usersCollection.insertOne(this.data)
            
            /*bcrypt.hash(this.data.password, saltRounds).then((hash) => {
                // Store hash in your password DB.
                this.data.password = hash
                usersCollection.insertOne(this.data)
            });*/
            this.getAvatar()
            resolve()
    
        } else {
            reject(this.errors)
        }
    })
}

User.prototype.getProfileSettings = function () {
    return new Promise( async (resolve, reject) => {
        try {
            let searchedProfileData = await usersProfileCollection.findOne({userid: new ObjectID(this.data._id)})
            if (searchedProfileData) {
                return resolve(searchedProfileData)
            } else {
                return resolve()
            } 
        } catch (error) {
            reject(error)
        }
    })
}

User.getProfileSettingsForInvGen = function (userid) {
    return new Promise( async (resolve, reject) => {
        try {
            let searchedProfileData = await usersProfileCollection.findOne({userid: new ObjectID(userid)})
            if (searchedProfileData) {
                return resolve(searchedProfileData)
            } else {
                return resolve()
            } 
        } catch (error) {
            reject(error)
        }
    })
}

User.updateInvoiceNumberForInvGen = function (userid) {
    return new Promise( async (resolve, reject) => {
        try {
            let searchedProfileData = await usersProfileCollection.findOne({userid: new ObjectID(userid)})
            if (searchedProfileData) {
                let newInvoiceNumber = Number(searchedProfileData.nextinvoiceno) + 1
                //perform the update to the invoice number
                let returnUpdate = await usersProfileCollection.findOneAndUpdate({userid: new ObjectID(userid)}, 
                    {$set: {nextinvoiceno: newInvoiceNumber.toString()}})
                if (returnUpdate.ok == '1') {
                    return resolve("success")
                }

            } else {
                return resolve()
            } 
        } catch (error) {
            reject(error)
        }
    })
}

User.prototype.setProfileSettings = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let grabUser  = await usersCollection.findOne({username: this.data.username})
            this.data = grabUser
            /*console.log(this.data.username)
            console.log(this.data.email)
            console.log(this.data._id)
            console.log(dataform)*/
            this.cleanUpProfileData()
            this.validateProfileData()
            //if validation fails - do not update
            if (!this.errors.length) {
                let searchedProfileData = await usersProfileCollection.findOne({userid: this.profileData.userid})
                if (searchedProfileData) {
                    let returnProfileData = await usersProfileCollection.findOneAndUpdate({userid: this.profileData.userid}, {$set: {
                        fullname: this.profileData.fullname,
                        emailaddress: this.profileData.emailaddress,
                        phonenumber: this.profileData.phonenumber,
                        abn: this.profileData.abn,
                        bsb: this.profileData.bsb,
                        accountno: this.profileData.accountno,
                        address1: this.profileData.address1,
                        address2: this.profileData.address2,
                        address3: this.profileData.address3,
                        nextinvoiceno: this.profileData.nextinvoiceno
                    }})
                    resolve(returnProfileData.value)
                } else {
                    let returnProfileData = await usersProfileCollection.insertOne(this.profileData)
                    resolve(returnProfileData.ops[0])
                }
            } else {
                reject(this.errors)
            }
        } catch (error) {
            this.errors.push("Issue updating profile " + error)
            reject(this.errors)
        }           
    })
}

User.prototype.validateForgetEmailOnly = function(){
    return new Promise(async (resolve, reject) => {
        if (!validator.isEmail(this.data.forgotEmail)) {this.errors.push("You must provide a valid email address.")}
        if (validator.isEmail(this.data.forgotEmail)) {
            let emailExists = await usersCollection.findOne({email: this.data.forgotEmail})
            if (!emailExists) {this.errors.push("That email address is not found.")}
        }
        resolve()
    })
}

// Forgot password feature - used the "idea" from site http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/
User.prototype.forgotPassword = function(host) {
    return new Promise(async (resolve, reject) => {
        //Perform usual validation checks
        this.cleanUpForForgetPassword()
        await this.validateForgetEmailOnly()
        // Only if there are no validation errors 
        if (!this.errors.length) {
            try {
                //First create a new crypto token to use for the reset url parameter address
                // More information here - https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback
                let token = crypto.randomBytes(20).toString('hex');
                //Now set the resetPasswordToken and resetPasswordExpires fields on the User Collection
                let updateWithCryptoToken = await usersCollection.findOneAndUpdate({email: this.data.forgotEmail}, {$set:{
                    resetPasswordToken: token,
                    resetPasswordExpires: Date.now() + 3600000, // 1 hour
                }})
                if (updateWithCryptoToken) {
                    //Now send the email with the URL + Token for password reset

                    //Here we set up what we want to do with the email to send
                    let theTo = this.data.forgotEmail
                    let theFrom = process.env.EMAILUSERNAME
                    let theSubject = 'From Inv Gen Password reset' // We can make this dynamic later
                    let theText = 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + host + '/forgotpassword/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'

                    let sendEmail = new Email(theTo,theFrom,theSubject,theText)
                    let verifyCheck = await sendEmail.verifyConnection()
                    if (verifyCheck){
                        //Actually send the forgot password email with URL Link Now
                        let checkSend = await sendEmail.sendEmail()
                        if (checkSend == "success") {
                            //Confirmed sent
                            resolve("success")
                        } else {
                            this.errors.push('Could not send the email to address ' + this.data.forgotEmail + '.')
                            reject(this.errors) 
                        }
                    } else {
                        this.errors.push('Could not connect to the email MX server via TLS. Contact Administrator.')
                        reject(this.errors)  
                    }
                } else {
                    this.errors.push('Could not update reset token, please try again later.')
                    reject(this.errors)
                }
            } catch (error) {
                this.errors.push("Server error at forgot email method " + error)
                reject(this.errors)
            }
        } else {
            //Validation errors
            reject(this.errors)
        }
    })
}

/*This checks if the fetch for the reset password page and page parameter "token" meet the 
 password reset criteria.
   * matching token string
   * must used before the "expiry date/time"
*/
User.prototype.checkForgotPasswordToken = function (token) {
    return new Promise((resolve, reject) => {
        usersCollection.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() }}).then((user) => {
            if (user) {
                //Found a match with the token and expiry - show reset password page
                resolve("success") 
            } else {
                this.errors.push("Could not process the password reset feature, please try again.")
                reject(this.errors)
            }
        }).catch((err) => {
            this.errors.push("Server error at token match method " + err)
            reject(this.errors)
        })
    })
}

User.prototype.resetUserPasswordWithToken = function(token) {
    return new Promise((resolve, reject) => {
        //perform password clean ups and confirm the two passwords
        this.resetPasswordValidate()
        if (this.errors.length) {
            reject(this.errors)
        }
        //Check the token again - just in case the user took too long to reset password
        this.checkForgotPasswordToken(token)
            .then(() => {
            //Hash the new password
            this.hashThePassword(this.data.newPassword)
            //Perform an update to the database with the new hashed password
            usersCollection.findOneAndUpdate({resetPasswordToken: token}, {$set: {
                password: this.data.password,
                resetPasswordToken: undefined,
                resetPasswordExpires: undefined
            }})
            .then((user) => {
                if (user) {
                    resolve(user) 
                }
            })
        }).catch((error) => {
            //Token expired or something else went wrong
            this.errors.push("Server error when updating new password " + error)
            reject(this.errors)
        })
    })
}

User.prototype.resetPasswordValidate = function () {
    if (typeof(this.data.newPassword) != "string") {this.data.newPassword = ""}
    if (typeof(this.data.confirmNewPassword) != "string") {this.data.confirmNewPassword = ""}
    if (this.data.newPassword.length > 0 && this.data.newPassword.length < 5) {this.errors.push("Password must be at least 6 characters")}
    if (this.data.newPassword.length > 50) {this.errors.push("Password cannot exceed 50 characters")}
    if (this.data.newPassword.localeCompare(this.data.confirmNewPassword) != 0) {this.errors.push("Your passwords do not match. Please try again.")}  
}

//Gravatar - profile pic change
//We use the Md5 to hash the email address to gain the GRAVATAR from the website
User.prototype.getAvatar = function () {
    /*console.log("This is the md5 hash " + md5(this.data.email))
    console.log(this)*/
    this.avatar = `https://s.gravatar.com/avatar/${md5(this.data.email)}}?s=128`
}

//Not part of the user object - but can be run anywhere else
//
User.findByUsername = function (username) {
    return new Promise(function(resolve, reject) {
        if (typeof(username) != "string") {
            reject()
            return
        }
        usersCollection.findOne({username: username}).then(function(userDoc) {
            if (userDoc) {
                userDoc = new User(userDoc, true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }
                resolve(userDoc)
            } else {
                reject()
            }
        }).catch(function(){
            reject()
        })
    })
}

User.doesEmailExsist = function(email) {
    return new Promise(async function (resolve, reject){
        //First check if the sent data is an actual "String of text" - if not - do NOT check the DB
        if (typeof(email) != "string") {
            resolve(false)
            return
        }

        //After validation check, then perform a check onto the database
        let user = await usersCollection.findOne({email: email})
        if (user) {
            resolve(true)
        } else {
            resolve(false)
        }
    })
}

module.exports = User