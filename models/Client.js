//Used for database connections
const clientCollection = require('../db').db().collection("clients")
const publicHolidayCollection = require('../db').db().collection("publicholiday")
const ObjectID = require('mongodb').ObjectId
//to sanitize the html
const sanitizeHTML = require('sanitize-html')
//user model to grab the gravatar
const User = require('./User')
//Used to validate emails and text of strings
const validator = require("validator")

//Only using AXIOS to fetch the public holiday times
var axios = require('axios');

//Constructor
let Client = function(data, userid, requestedClientId) {
    this.data = data,
    this.errors = [],
    this.userid = userid,
    this.requestedClientId = requestedClientId
}

//NEED TO COMPLETE
Client.prototype.cleanUp = function(forCreate = true) {
    if (typeof(this.data.baserate) != "string") {this.data.baserate =""}
    if (typeof(this.data.baseRateEndTime) != "string") {this.data.baseRateEndTime =""}
    if (typeof(this.data.baseRateStartTime) != "string") {this.data.baseRateStartTime =""}
    if (typeof(this.data.saturdayRate) != "string") {this.data.saturdayRate =""}
    if (typeof(this.data.sundayRate) != "string") {this.data.sundayRate =""}
    if (typeof(this.data.publicHolidayRate) != "string") {this.data.publicHolidayRate =""}
    if (typeof(this.data.clientTitle) != "string") {this.data.clientTitle =""}
    if (typeof(this.data.foraddress1) != "string") {this.data.foraddress1 =""}
    if (typeof(this.data.foraddress2) != "string") {this.data.foraddress2 =""}
    if (typeof(this.data.foraddress3) != "string") {this.data.foraddress3 =""}
    if (typeof(this.data.penaltyrate) != "string") {this.data.penaltyrate =""}
    if (typeof(this.data.toaddress1) != "string") {this.data.toaddress1 =""}
    if (typeof(this.data.toaddress2) != "string") {this.data.toaddress2 =""}
    if (typeof(this.data.toaddress3) != "string") {this.data.toaddress3 =""}
    if (typeof(this.data.footerNote) != "string") {this.data.footerNote =""}
    // get rid of any bogus properties
    this.data = {
        createdDate: (forCreate) ? new Date() : this.data.createdDate,
        baserate: sanitizeHTML(this.data.baserate.trim(), {allowedTags: [], allowedAttributes: {}}),
        baseRateEndTime: sanitizeHTML(this.data.baseRateEndTime.trim(), {allowedTags: [], allowedAttributes: {}}),
        baseRateStartTime: sanitizeHTML(this.data.baseRateStartTime.trim(), {allowedTags: [], allowedAttributes: {}}),
        clientTitle: sanitizeHTML(this.data.clientTitle.trim(), {allowedTags: [], allowedAttributes: {}}),
        saturdayRate: sanitizeHTML(this.data.saturdayRate.trim(), {allowedTags: [], allowedAttributes: {}}),
        sundayRate: sanitizeHTML(this.data.sundayRate.trim(), {allowedTags: [], allowedAttributes: {}}),
        publicHolidayRate: sanitizeHTML(this.data.publicHolidayRate.trim(), {allowedTags: [], allowedAttributes: {}}),
        foraddress1: sanitizeHTML(this.data.foraddress1.trim(), {allowedTags: [], allowedAttributes: {}}),
        foraddress2: sanitizeHTML(this.data.foraddress2.trim(), {allowedTags: [], allowedAttributes: {}}),
        foraddress3: sanitizeHTML(this.data.foraddress3.trim(), {allowedTags: [], allowedAttributes: {}}),
        penaltyrate: sanitizeHTML(this.data.penaltyrate.trim(), {allowedTags: [], allowedAttributes: {}}),
        toaddress1: sanitizeHTML(this.data.toaddress1.trim(), {allowedTags: [], allowedAttributes: {}}),
        toaddress2: sanitizeHTML(this.data.toaddress2.trim(), {allowedTags: [], allowedAttributes: {}}),
        toaddress3: sanitizeHTML(this.data.toaddress3.trim(), {allowedTags: [], allowedAttributes: {}}),
        footerNote: sanitizeHTML(this.data.footerNote.trim(), {allowedTags: [], allowedAttributes: {}}),
        author: new ObjectID(this.userid)
    }
}

//NEED TO COMPLETE
Client.prototype.validate = function (forCreate = true) {
    return new Promise(async (resolve, reject) => {
        if (this.data.baserate == "") {this.errors.push("You must provide a baserate.")}
        if (this.data.baseRateEndTime == "") {this.errors.push("You must provide a Rate End Time.")}
        if (this.data.baseRateStartTime == "") {this.errors.push("You must provide a Rate Start Time.")}
        
        //Check to see if the Start time is greater than the end time
        if((Date.parse('01/01/2011 ' + this.data.baseRateStartTime) > Date.parse('01/01/2011 '+ this.data.baseRateEndTime)) || (Date.parse('01/01/2011 ' + this.data.baseRateStartTime) == Date.parse('01/01/2011 '+ this.data.baseRateEndTime))) {this.errors.push("Start and End Times for Base Rate are not in the correct order, Start time should be before End time.")}

        if (this.data.penaltyrate == "") {this.errors.push("You must provide a Penalty Rate")}
    
        //Check for Numeric numbers
        if(this.data.baserate.length > 0){
            if (!validator.isNumeric(this.data.baserate)) {this.errors.push("The Base Rate should only contain numbers.")}
        }
        if(this.data.penaltyrate.length > 0){
            if (!validator.isNumeric(this.data.penaltyrate)) {this.errors.push("The Penalty Rate should only contain numbers.")}
        }
        if(this.data.saturdayRate.length > 0){
            if (!validator.isNumeric(this.data.saturdayRate)) {this.errors.push("The Saturday Rate should only contain numbers.")}
        }
        if(this.data.sundayRate.length > 0){
            if (!validator.isNumeric(this.data.sundayRate)) {this.errors.push("The Sunday Rate should only contain numbers.")}
        }
        if(this.data.publicHolidayRate.length > 0){
            if (!validator.isNumeric(this.data.publicHolidayRate)) {this.errors.push("The Public Holiday Rate should only contain numbers.")}
        }
    
        //We also need to validate if the client already exsist for the current user
        if (this.data.clientTitle == "") {this.errors.push("You must provide a Client Name.")}
        if (this.data.clientTitle.length < 3 || this.data.clientTitle.length > 45) {this.errors.push("You must provide a Client Name which is greater than 3 characters and less than 45 characters.")}
        //Check if the Client name is already taken
        if (this.data.clientTitle.length > 3 && this.data.clientTitle.length < 45 && forCreate) {
            let clientTitleExsists = await clientCollection.findOne({$and:[{clientTitle: this.data.clientTitle},{author: new ObjectID(this.userid)}]})
            if (clientTitleExsists) {this.errors.push("That Client Name is already taken for your account.")}
        }
        //Note: we don't want to validate the address details - if they are blank - well its blank
        resolve()
    })

}

//Create new Client
Client.prototype.create = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate()
        if (!this.errors.length){
            //Once validation process is complete and no validation errors - create new client
            clientCollection.insertOne(this.data).then((info) => {
                resolve(info.insertedId)
            }).catch((error) => {
                this.errors.push("Issue creating a new client: " + error)
                reject(this.errors)
            }) 
        } else {
            //Reject with validation errors
            reject(this.errors)
        }
    })
}

Client.reusableClientQuery = function(uniqueOperations, visitorId) {
    return new Promise( async function(resolve, reject) {
        try {
            let aggOperations = uniqueOperations.concat([
                {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
                {$project: {
                    baserate: 1,
                    baseRateEndTime: 1,
                    baseRateStartTime: 1,
                    saturdayRate: 1,
                    sundayRate: 1,
                    publicHolidayRate: 1,
                    clientTitle: 1,
                    foraddress1: 1,
                    foraddress2: 1,
                    foraddress3: 1,
                    penaltyrate: 1,
                    toaddress1: 1,
                    toaddress2: 1,
                    toaddress3: 1,
                    footerNote: 1,
                    createdDate: 1,
                    authorId: "$author",
                    author: {$arrayElemAt: ["$authorDocument", 0]}
                }}
            ])
            let clientData = await clientCollection.aggregate(aggOperations).toArray()
            // clean up author property in each category object
            clientData = clientData.map(function(cd){
                cd.isVisitorOwner = cd.authorId.equals(visitorId)
                cd.author = {
                    username: cd.author.username,
                    avatar: new User(cd.author, true).avatar
                }
                return cd
            })
            resolve(clientData)
        } catch (error) {
            console.log(error)
            reject()
        }
    })
}

Client.getClientDataById = function(id, visitorId) {
    return new Promise( async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            return
        }

        let clientData = await Client.reusableClientQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

        if (clientData.length) {
            //console.log(clientData[0])
            resolve(clientData[0])
        } else {
            reject()
        }
    })
}

// Default status - true or false
Client.prototype.checkDefaultStaus = function () {
    //Check the default status here
}

// Set default status
Client.prototype.setDefaultStatus = function (def) {
    this.default = def
}

// Set Address Details
Client.prototype.setAddressDetails = function () {

}

// Set Rates and time Details
Client.prototype.setRatesDetails = function () {
    /* These should cater for the following
        - Normal rates
        - Penalty Rates
        - Rates on Saturday and Sunday
        - Time Frames for normal rate - anything outside of the normal time frame will result as a penalty rate
    */
}

// Retrived assigned clientData
Client.prototype.retrivedAssignedclientData = function () {
    // Look into the DB and fetch all clientData which is assigned to this client
}

Client.findByAuthorId = function(authorId) {
    return Client.reusableClientQuery([
        {$match: {author: new ObjectID(authorId)}},
        {$sort: {createdDate: -1}}
    ])
}

Client.prototype.update = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let client = await Client.getClientDataById(this.requestedClientId, this.userid)
            if (client.isVisitorOwner) {
                //actually update db
                let status = await this.actuallyUpdate()
                resolve(status)
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

Client.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) =>{
        this.cleanUp(false)
        await this.validate(false)
        if (!this.errors.length) {
            await clientCollection.findOneAndUpdate({_id: new ObjectID(this.requestedClientId)}, {$set: {
                baserate: this.data.baserate,
                baseRateEndTime: this.data.baseRateEndTime,
                baseRateStartTime: this.data.baseRateStartTime,
                saturdayRate: this.data.saturdayRate,
                sundayRate: this.data.sundayRate,
                publicHolidayRate: this.data.publicHolidayRate,
                clientTitle: this.data.clientTitle,
                foraddress1: this.data.foraddress1,
                foraddress2: this.data.foraddress2,
                foraddress3: this.data.foraddress3,
                penaltyrate: this.data.penaltyrate,
                toaddress1: this.data.toaddress1,
                toaddress2: this.data.toaddress2,
                toaddress3: this.data.toaddress3,
                footerNote: this.data.footerNote
            }})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

Client.prototype.populatePublicHolidays = function () {
    return new Promise((resolve, reject)=>{
        // Perform API call to the data.gov.au site to gain public holiday data
        // sourced from https://data.gov.au/dataset/ds-dga-b1bc6077-dadd-4f61-9f8c-002ab2cdff10/details
        axios.get('https://data.gov.au/data/api/3/action/datastore_search', {
            params: {
                //2020
                //resource_id: 'c4163dc4-4f5a-4cae-b787-43ef0fcf8d8b'
                //2021
                //resource_id: '31eec35e-1de6-4f04-9703-9be1d43d405b'
                //2022
                resource_id: 'd256f989-8f49-46eb-9770-1c6ee9bd2661'
            }
        })
        .then(async function (response) {
            //Store all public holidays
            let ph = response.data.result.records
            let qldPublicHolidays = ph.filter((pd) => {
                    //Filtering out only QLD public holidays
                    if (pd.Jurisdiction == 'qld') {
                        return true
                    }
                }).map((pd)=> {
                    return {
                        //Mapping out the fields I would like to import into the publicholiday collection
                        //Dateg: pd.Date,
                        Date: new Date(pd.Date.substring(0,4) + '-' + pd.Date.substring(4,6) + '-' + pd.Date.substring(6,8)),
                        HolidayName: pd["Holiday Name"],
                        Information: pd.Information,
                        Jurisdiction: pd.Jurisdiction
                    }
                }) 
            //update the public holiday table
            let phupdate = await publicHolidayCollection.insert(qldPublicHolidays)
            if (phupdate.result.ok == '1') {
                resolve("success")
            } else {
                this.errors.push('Database did not update with new public holidays')
                reject(this.errors)
            }
        })
        .catch( (error) => {
            this.errors.push('There was an error fecting the public holiday data ' + error)
            reject(this.errors);
        })
    })
}

//Remove the client from DB
Client.delete = function (clientIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let client = await Client.getClientDataById(clientIdToDelete, currentUserId)
            if (client.isVisitorOwner) {
               await clientCollection.deleteOne({_id: new ObjectID(clientIdToDelete)})
               resolve()
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

module.exports = Client
