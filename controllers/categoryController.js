// Create new Categories
const Category = require('../models/Category')
const Client = require('../models/Client')

exports.viewCategoryCreateScreen = function (req,res) {
    res.render('create-category')
}


exports.create = function (req, res) {
    let category = new Category(req.body, req.session.user._id)

    category.create().then(function (newId) {
        req.flash("success", "New Category successfully created")
        req.session.save(()=> res.redirect(`create-category`))
    }).catch(function (errors) {
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("create-category"))
    })
}

exports.viewOnCreatePage = async function (req, res) {
    try {
        let categories = await Category.findByAuthorId(req.session.user._id)
        let clients = await Client.findByAuthorId(req.session.user._id)
        res.render('create-category',{
            categories: categories,
            username: req.session.user.username,
            avatar: req.session.user.avatar,
            clients: clients
        })
    } catch (error) {
        req.flash("errors", "Error message " + error)
        res.redirect('/')
    }   
}

// Edit categories
exports.viewEditScreen = async function(req, res) {
    try {
        let editCategory = await Category.findSingleById(req.params.id, req.visitorId)
        let clients = await Client.findByAuthorId(req.session.user._id)
        if (editCategory.isVisitorOwner) {
            //res.send("Success")
            res.render("edit-category", {category: editCategory,clients: clients})
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
    let category = new Category(req.body, req.visitorId, req.params.id)
    category.update().then((status) => {
        // the category was successfully updated in the database
        if (status == "success") {
            // category was updated in DB
            req.flash("success", "Category was successfully updated.")
            req.session.save(function(){
                res.redirect(`/create-category`) 
            })
        } else {
            // Validation errors
            category.errors.forEach(function(error){
                req.flash("errors", error)
            })
            req.session.save(function(){
                res.redirect(`/create-category`)
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

// Delete categories
exports.delete = function (req, res) {
    Category.delete(req.params.id, req.visitorId).then(() => {
        // the activity was deleted
        req.flash("success", "Category successfully deleted")
        req.session.save(() => {res.redirect('/create-category')})
    }).catch(() =>{
        req.flash("errors", "You do not have permission to perform that action")
        req.session.save(() => res.redirect("/"))
    })
}

// Delete category
exports.viewDeleteScreen = async function(req, res) {
    try {
        let deleteCategory = await Category.findSingleById(req.params.id, req.visitorId)
        if (deleteCategory.isVisitorOwner) {
            //res.send("Success")
            res.render("delete-category", {deleteCategory: deleteCategory})
        } else {
            req.flash("errors", "You dont have permission to perform that action.")
            req.session.save(()=> res.redirect("/"))
        }
    } catch {
        res.render("404")
    }
}