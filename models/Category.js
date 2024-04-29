//Used for database connections
const categoryCollection = require('../db').db().collection("categories")
const ObjectID = require('mongodb').ObjectId

//user model to grab the gravatar
const User = require('./User')

//Used to validate emails and text of strings
const validator = require("validator")

//to sanitize the html
const sanitizeHTML = require('sanitize-html')

//Constructor
let Category = function(data, userid, requestedcategoryId) {
    this.data = data,
    this.errors = [],
    this.userid = userid,
    this.requestedcategoryId = requestedcategoryId
}

Category.prototype.cleanUp = function(forCreate = true) {
    if (typeof(this.data.categoryTitle) != "string") {this.data.categoryTitle =""}
    if (typeof(this.data.categoryOverrideRate) != "string") {this.data.categoryOverrideRate =""}
    if (typeof(this.data.clientSelect) != "string" || !ObjectID.isValid(this.data.clientSelect)) {
        this.data.clientSelect = ""
        return
    }

    // get rid of any bogus properties
    this.data = {
        categoryTitle: sanitizeHTML(this.data.categoryTitle.trim(), {allowedTags: [], allowedAttributes: {}}),
        categoryOverrideRate: sanitizeHTML(this.data.categoryOverrideRate.trim(), {allowedTags: [], allowedAttributes: {}}),
        createdDate: forCreate ? new Date() : this.data.createdDate,
        author: new ObjectID(this.userid),
        client: new ObjectID(this.data.clientSelect)
    }
}

Category.prototype.validate = function() {
    if (this.data.categoryTitle == "") {this.errors.push("You must provide a Category name")}
    if (this.data.client == "") {this.errors.push("You must provide a Client name")}
    if (this.data.clientSelect == "") {this.errors.push("You must provide a Client name")}
    if(this.data.categoryOverrideRate.length > 0){
        if (!validator.isNumeric(this.data.categoryOverrideRate)) {this.errors.push("The override should only contain numbers.")}
    }
}

Category.prototype.create = function() {
    return new Promise( (resolve, reject) => {
        try {
            this.cleanUp()
            this.validate()
            if (!this.errors.length) {
                // save category into database
                categoryCollection.insertOne(this.data).then((info) => {
                    resolve(info.insertedId)
                }).catch((error) => {
                    this.errors.push("Error when creating a new category via Mongo DB: " + error)
                    reject(this.errors)
                })
            } else {
                reject(this.errors)
            }
        } catch (error) {
            this.errors.push("Error within the Category Create : " + error)
            reject(this.errors)
        }
    })     
    
}

Category.reusablecategoryQuery = function(uniqueOperations, visitorId) {
    return new Promise( async function(resolve, reject) {
        try {
                /*We are using the .aggregate method which is a "SUPREAM" way to perform mongo db
                filtering via separate documents or collections.
                Think of it as a "Pipe", it performs the filter actions one by one to then return
                one result.
                We use the $match to first gather the main category,
                we then use the $lookup function to perform a LEFT JOIN of the "user" collection (table) and
                the "category" collection - info here https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/#pipe._S_lookup
                Lastly we perfrom a project to simply output the fields that we require to an array
            */
            let aggOperations = uniqueOperations.concat([
                {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
                {$lookup: {from: "clients", localField: "client", foreignField: "_id", as: "clientDocument"}},
                {$project: {
                    categoryTitle: 1,
                    createdDate: 1,
                    categoryOverrideRate: 1,
                    clientSelect: 1,
                    authorId: "$author",
                    author: {$arrayElemAt: ["$authorDocument", 0]},
                    client: {$arrayElemAt: ["$clientDocument", 0]}
                }}
            ])
            let categories = await categoryCollection.aggregate(aggOperations).toArray()
            // clean up author property in each category object
            categories = categories.map(function(category){
                //This check is to use the MongoDB ObjectID method called equals
                // and from there we pass in the visitor of the category id
                // if the author is looking at the category then the isVisitorOwner should
                // equal to "true"
                category.isVisitorOwner = category.authorId.equals(visitorId)
                //below we are just redifining the category.author to only contain
                // the user name and the avatar - had to modify the user object 
                // to pass over just the gravatar link
                category.author = {
                    username: category.author.username,
                    avatar: new User(category.author, true).avatar
                }
                return category
            })

            resolve(categories)
        } catch (error) {
            console.log(error)
            reject()
        }
    })
}

Category.findSingleById = function(id, visitorId) {
    return new Promise( async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            return
        }

        let categories = await Category.reusablecategoryQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

        if (categories.length) {
            //console.log(categories[0])
            resolve(categories[0])
        } else {
            reject()
        }
    })
}

Category.findByAuthorId = function(authorId) {
    /*We're passing the "Aggregated" arrary of options to our reusablecategoryQuery function
     From there we simply pass in the author id and use the sort funciton to sort the 
    category "Decending" order by date
    --NOTE: the {sort: {createdDate: -1}} is not allowed on a Free tier of mongo DB - so this
    was removed 
    
    Ultimately the below will eventually retrun an "ARRAY" of categories

    */
    return Category.reusablecategoryQuery([
        {$match: {author: new ObjectID(authorId)}},
        {$sort: {createdDate: -1}}
    ])
}

Category.delete = function (categoryIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let category = await Category.findSingleById(categoryIdToDelete, currentUserId)
            if (category.isVisitorOwner) {
               await categoryCollection.deleteOne({_id: new ObjectID(categoryIdToDelete)})
               resolve()
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

Category.prototype.update = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let category = await Category.findSingleById(this.requestedcategoryId, this.userid)
            if (category.isVisitorOwner) {
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

Category.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) =>{
        this.cleanUp(false)
        this.validate()
        if (!this.errors.length) {
            await categoryCollection.findOneAndUpdate({_id: new ObjectID(this.requestedcategoryId)}, {$set: {
                categoryTitle: this.data.categoryTitle,
                client: new ObjectID(this.data.client),
                categoryOverrideRate: this.data.categoryOverrideRate
            }})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}


module.exports = Category
