//Used for database connections
const activityCollection = require('../db').db().collection("activities")
const ObjectID = require('mongodb').ObjectId

//user model to grab the gravatar - update
const User = require('./User')

//Time Scheduler to remove dead activities
const TimeScheduler = require('./TimeScheduler')

//to sanitize the html
const sanitizeHTML = require('sanitize-html')

//Constructor
let Activity = function(data, userid, requestedActivityId) {
    this.data = data,
    this.errors = [],
    this.userid = userid,
    this.requestedActivityId = requestedActivityId
}

Activity.prototype.cleanUp = function() {

    if (typeof(this.data.title) != "string") {this.data.title =""}
    if (typeof(this.data.body) != "string") {this.data.body =""}
    if (typeof(this.data.categorySelect) != "string") {this.data.categorySelect =""}

    // get rid of any bogus properties
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
        createdDate: new Date(),
        author: new ObjectID(this.userid),
        categorySelect: new ObjectID(this.data.categorySelect)
    }

}

Activity.prototype.validate = function() {
    if (this.data.title == "") {this.errors.push("You must provide a Activity name")}
    if (this.data.body == "") {this.errors.push("You must provide Activity content which will be copied over to the invoice")}
    if (this.data.categorySelect == "") {this.errors.push("You must provide Category for your Activity")}
}

Activity.prototype.create = function() {
    return new Promise( (resolve, reject) => {
        try {
            this.cleanUp()
            this.validate()
            if (!this.errors.length) {
                // save post into database
                activityCollection.insertOne(this.data).then((info) => {
                    resolve(info.insertedId)
                }).catch((error) => {
                    this.errors.push("Error creating activity with Mongo DB: " + error)
                    reject(this.errors)
                })
            } else {
                reject(this.errors)
            }
        } catch (error) {
            this.errors.push("Error within the Activity Create : " + error)
            reject(this.errors)
        }

    })     
    
}

Activity.prototype.update = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let activity = await Activity.findSingleById(this.requestedActivityId, this.userid)
            if (activity.isVisitorOwner) {
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

Activity.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) =>{
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            await activityCollection.findOneAndUpdate({_id: new ObjectID(this.requestedActivityId)}, {$set: {
                title: this.data.title,
                body: this.data.body,
                categorySelect: new ObjectID(this.data.categorySelect)
            }})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

Activity.reusableActivityQuery = function(uniqueOperations, visitorId, sortByCat = false) {
    return new Promise( async function(resolve, reject) {
        try {
                /*We are using the .aggregate method which is a "SUPREAM" way to perform mongo db
                filtering via separate documents or collections.
                Think of it as a "Pipe", it performs the filter actions one by one to then return
                one result.
                We use the $match to first gather the main activity,
                we then use the $lookup function to perform a LEFT JOIN of the "user" collection (table) and
                the "activity" collection - info here https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/#pipe._S_lookup
                Lastly we perfrom a project to simply output the fields that we require to an array
            */
           let aggOperations = []
            if (sortByCat) {
                // perform category sort rather than date sort
                aggOperations = uniqueOperations.concat([
                    {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
                    {$lookup: {from: "categories", localField: "categorySelect", foreignField: "_id", as: "categoryDocument"}},
                    {$lookup: {from: "clients", localField: "categoryDocument.client", foreignField: "_id", as: "clientDocuement"}},
                    {$sort: {"categoryDocument.categoryTitle": 1}},
                    {$project: {
                        title: 1,
                        body: 1,
                        categorySelect: 1,
                        categoryDocument: {$arrayElemAt: ["$categoryDocument", 0]},
                        createdDate: 1,
                        authorId: "$author",
                        author: {$arrayElemAt: ["$authorDocument", 0]},
                        client: {$arrayElemAt: ["$clientDocuement", 0]},
                    }}
                ])
            } else {
                // perform normal fetch
                aggOperations = uniqueOperations.concat([
                    {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
                    {$lookup: {from: "categories", localField: "categorySelect", foreignField: "_id", as: "categoryDocument"}},
                    {$lookup: {from: "clients", localField: "categoryDocument.client", foreignField: "_id", as: "clientDocuement"}},
                    {$project: {
                        title: 1,
                        body: 1,
                        categorySelect: 1,
                        categoryDocument: {$arrayElemAt: ["$categoryDocument", 0]},
                        createdDate: 1,
                        authorId: "$author",
                        author: {$arrayElemAt: ["$authorDocument", 0]},
                        client: {$arrayElemAt: ["$clientDocuement", 0]},
                    }}
                ])
            }

            let activities = await activityCollection.aggregate(aggOperations).toArray()

            // clean up author property in each activity object
            activities = activities.map(function(activity){
                //This check is to use the MongoDB ObjectID method called equals
                // and from there we pass in the visitor of the activity id
                // if the author is looking at the activity then the isVisitorOwner should
                // equal to "true"
                activity.isVisitorOwner = activity.authorId.equals(visitorId)
                //console.log(activity.author)
                //below we are just redifining the activity.author to only contain
                // the user name and the avatar - had to modify the user object 
                // to pass over just the gravatar link
                activity.author = {
                    username: activity.author.username,
                    avatar: new User(activity.author, true).avatar
                }
                return activity
            })

            resolve(activities)
        } catch (error) {
            console.log(error)
            reject()
        }
    })
}

Activity.findSingleById = function(id, visitorId) {
    return new Promise( async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            return
        }
        
        let activities = await Activity.reusableActivityQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

        if (activities.length) {
            //console.log(activities[0])
            resolve(activities[0])
        } else {
            reject()
        }
    })
}

Activity.findByAuthorId = function(authorId) {
    /*We're passing the "Aggregated" arrary of options to our reusableActivityQuery function
     From there we simply pass in the author id and use the sort funciton to sort the 
    activity "Decending" order by date
    --NOTE: the {sort: {createdDate: -1}} is not allowed on a Free tier of mongo DB - so this
    was removed 
    
    Ultimately the below will eventually retrun an "ARRAY" of activities

    */
    return Activity.reusableActivityQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}}
    ])
}

Activity.findByAuthorIdWithOjectID = function(authorId) {

    return Activity.reusableActivityQuery([
        {$match: {author: new ObjectID(authorId)}},
        {$sort: {createdDate: -1}}
    ])
}


Activity.findByAuthorIdOjectIDSortByCategory = function(authorId) {

    return Activity.reusableActivityQuery([
        {$match: {author: new ObjectID(authorId)}},
    ], authorId, true)
}

Activity.delete = function (activityIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let activity = await Activity.findSingleById(activityIdToDelete, currentUserId)
            if (activity.isVisitorOwner) {
               //First delete all "linked" Scheduled tasks which is accociated to the activity
               await TimeScheduler.deleteByActivtyId(activityIdToDelete)
               //Then remove the activity
               await activityCollection.deleteOne({_id: new ObjectID(activityIdToDelete)})
               resolve()
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}



module.exports = Activity

