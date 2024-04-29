//Used for database connections
const timeSchedulesCollection = require('../db').db().collection("timeSchedules")
const ObjectID = require('mongodb').ObjectId

//Constructor
let TimeScheduler = function(data, userid, requestedScheduleId) {
    this.data = data,
    this.errors = [],
    this.userid = userid,
    this.requestedScheduleId = requestedScheduleId
}

TimeScheduler.prototype.cleanUpForNewSchedule = function() {
    if (typeof(this.data.activityId) != "string") {this.data.activityId =""}


    // get rid of any bogus properties
    this.data = {
        createdDateTime: new Date(),
        endDateTime: "",
        author: new ObjectID(this.userid),
        activityId: new ObjectID(this.data.activityId),
        active: true
    }

}

TimeScheduler.prototype.cleanUpForUpdate = function() {
    if (typeof(this.data.startDate) != "string") {this.data.startDate = ""}
    if (typeof(this.data.startTime) != "string") {this.data.startTime = ""}
    if (typeof(this.data.endTime) != "string") {this.data.endTime = ""}

    if (this.data.endTime == "") {
        // get rid of any bogus properties
        let startDateAndTime = this.data.startDate + "T" + this.data.startTime + ":00Z"
        this.data = {
            createdDateTime: new Date(startDateAndTime),
            endDateTime: "",
            author: new ObjectID(this.userid),
        }
    } else {
        // get rid of any bogus properties
        let startDateAndTime = this.data.startDate + "T" + this.data.startTime + ":00"
        let endDateAndTime = this.data.startDate + "T" + this.data.endTime + ":00"
        this.data = {
            createdDateTime: new Date(startDateAndTime),
            endDateTime: new Date(endDateAndTime),
            author: new ObjectID(this.userid),
        }
    }
}

TimeScheduler.prototype.validate = function() {
    if (this.data.activityId == "") {this.errors.push("You must select and Activity to Track")}
}

TimeScheduler.prototype.validateForUpdate = function() {

    if (this.data.createdDateTime > this.data.endDateTime) {
        this.errors.push(`Start TIME is larger than End TIME, please try again.`)
    }
}

TimeScheduler.prototype.startActivity = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUpForNewSchedule()
        this.validate()
        if (!this.errors.length) {
            // Once all is validated - we need to set the active schedule and set it to false
            // Then update the End time automatically - User needs to stop the schedules manually
            TimeScheduler.removeActiveFlagAndSetEndTime().then( () => {
            // save post into database
                timeSchedulesCollection.insertOne(this.data).then((info) => {
                    resolve(info.insertedId)
                })   
            }).catch((e) => {
                //Something went wrong when updating active flags.
                this.errors.push("Update active flags error " + e)
                reject(this.errors)
            })

        } else {
            reject(this.errors)
        }
    })     
    
}

TimeScheduler.prototype.update = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let schedule = await TimeScheduler.findSingleById(this.requestedScheduleId, this.userid)
            if (schedule.isVisitorOwner) {
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

TimeScheduler.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) =>{
        this.cleanUpForUpdate()
        this.validateForUpdate()
        if (!this.errors.length) {
            await timeSchedulesCollection.findOneAndUpdate({_id: new ObjectID(this.requestedScheduleId)}, {$set: {
                createdDateTime: this.data.createdDateTime,
                endDateTime: this.data.endDateTime
            }})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

TimeScheduler.reusableActivityQuery = function(uniqueOperations, visitorId, clientSelect = []) {
    return new Promise( async function(resolve, reject) {
        try {
                // perform normal fetch
            
            let aggOperations = uniqueOperations.concat([
                {$lookup: {from: "activities", localField: "activityId", foreignField: "_id", as: "activityDocument"}},
                {$lookup: {from: "categories", localField: "activityDocument.categorySelect", foreignField: "_id", as: "categoryDocument"}},
                {$lookup: {from: "clients", localField: "categoryDocument.client", foreignField: "_id", as: "clientDocuement"}},
            ])
            
            //Filter on clients for invoice gen
            if (clientSelect.length) {
                let m = []
                //For single selects
                if (typeof(clientSelect) == "string") {
                    m = [new ObjectID(clientSelect)]
                } else {
                //For multiples
                    m = clientSelect.map(e => {
                        return new ObjectID(e)
                    })
                }

                aggOperations.push(
                {$match: 
                    {"clientDocuement._id": 
                    {$in: m}
                    }
                },                  
                ) 
            } 
            aggOperations.push(
                {$project: {
                    createdDateTime: 1,
                    endDateTime: 1,
                    activityDocument: {$arrayElemAt: ["$activityDocument", 0]},
                    categoryDocument: {$arrayElemAt: ["$categoryDocument", 0]},
                    client: {$arrayElemAt: ["$clientDocuement", 0]},
                    createdDate: 1,
                    authorId: "$author",
                    active: 1,
                }} 
            )

            let scheduledActivities = await timeSchedulesCollection.aggregate(aggOperations).toArray()
            scheduledActivities = scheduledActivities.map(function(sa){
                //This check is to use the MongoDB ObjectID method called equals
                // and from there we pass in the visitor of the activity id
                // if the author is looking at the activity then the isVisitorOwner should
                // equal to "true"
                sa.isVisitorOwner = sa.authorId.equals(visitorId)
                return sa
            })
            resolve(scheduledActivities)
        } catch (error) {
            console.log(error)
            reject()
        }
    })
}

TimeScheduler.findCustomTimeSchedulesByAuthorId = function (data, authorId){
    return TimeScheduler.reusableActivityQuery([
        {$match: {author: new ObjectID(authorId)}},
        {$match:{createdDateTime: {$gte: new Date(new Date(data.startDate).setHours(00,00,00)) , $lt :  new Date(new Date(data.endDate).setHours(23,59,59))} }},
        {$sort: {createdDateTime: -1} }
        //{$match:{createdDate: {$gte: new ISODate("2022-05-12T00:00:00.000Z"), $lte: new ISODate("2022-05-13T00:00:00.000Z")}}}
    ])
}
TimeScheduler.findCustomTimeSchedulesByAuthorIdClientSelect = function (data, authorId, clientSelect){
    return TimeScheduler.reusableActivityQuery([
        {$match: {author: new ObjectID(authorId)}},
        {$match:{createdDateTime: {$gte: new Date(new Date(data.startDate).setHours(00,00,00)) , $lt :  new Date(new Date(data.endDate).setHours(23,59,59))} }},
        {$sort: {createdDateTime: -1} }
        //{$match:{createdDate: {$gte: new ISODate("2022-05-12T00:00:00.000Z"), $lte: new ISODate("2022-05-13T00:00:00.000Z")}}}
    ],authorId, clientSelect)
}

TimeScheduler.findTodaysTimeSchedulesByAuthorId = function(authorId) {
    //Get the time range for a full day
    //Apply the $and operator to filter out schedules to todays date

    //let startDate = new Date(new Date().setDate())

    return TimeScheduler.reusableActivityQuery([
        {$match: {author: new ObjectID(authorId)}},
        {$match:{createdDateTime: {$gte: new Date(new Date().setHours(00,00,00)) , $lt :  new Date(new Date().setHours(23,59,59))} }},
        {$sort: {createdDateTime: -1} }
        //{$match:{createdDate: {$gte: new ISODate("2022-05-12T00:00:00.000Z"), $lte: new ISODate("2022-05-13T00:00:00.000Z")}}}
    ])
}

TimeScheduler.findSingleById = function(id, visitorId) {
    return new Promise( async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            return
        }
        
        let timeSchedule = await TimeScheduler.reusableActivityQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

        if (timeSchedule.length) {
            //console.log(activities[0])
            resolve(timeSchedule[0])
        } else {
            reject()
        }
    })
}

TimeScheduler.findSingleByActivityId = function(actId, visitorId) {
    return new Promise( async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            return
        }
        
        let timeSchedule = await TimeScheduler.reusableActivityQuery([
            {$match: {activityId: new ObjectID(actId)}}
        ], visitorId)

        if (timeSchedule.length) {
            //console.log(activities[0])
            resolve(timeSchedule[0])
        } else {
            reject()
        }
    })
}

TimeScheduler.removeActiveFlagAndSetEndTime = function () {
    return new Promise( async (resolve, reject) => {
        let checkActive = await timeSchedulesCollection.find({active: true},)

        if (checkActive) {
            //reset all active flags
           let updated = await timeSchedulesCollection.updateMany({active : true}, {$set:{"active" : false, "endDateTime" : new Date()}})
           if (updated.acknowledged) {
               resolve("success")
           } else {
               reject("Something went wrong with the update of active flags")
           }
        } else {
            //nothing to remove
            resolve("success")
        }
    })
}

TimeScheduler.stop = function (scheudleIDToDeactivate, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let schedule = await TimeScheduler.findSingleById(scheudleIDToDeactivate, currentUserId)
            if (schedule.isVisitorOwner) {
               await timeSchedulesCollection.findOneAndUpdate({_id: new ObjectID(scheudleIDToDeactivate)}, {$set: {
                endDateTime: new Date(),
                active: false
            }})
               resolve()
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

TimeScheduler.delete = function (scheduleIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let schedule = await TimeScheduler.findSingleById(scheduleIdToDelete, currentUserId)
            if (schedule.isVisitorOwner) {
               await timeSchedulesCollection.deleteOne({_id: new ObjectID(scheduleIdToDelete)})
               resolve("success")
            } else {
                reject(error)
            }
        } catch {
            reject()
        }
    })
}

TimeScheduler.deleteByActivtyId = function (activityId) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(typeof(activityId))
            //{activityId: {$eq: new ObjectId('5ec262e771a3ae0020c585e4')}}
            await timeSchedulesCollection.deleteMany({activityId: new ObjectID(activityId)})
            resolve("success")
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = TimeScheduler