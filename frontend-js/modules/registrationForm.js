import axios from 'axios'

export default class RegistrationForm {
    constructor(){
        this.form = document.querySelector("#registration-form")
        //For csrf token store
        this._csrf = document.querySelector('[name="_csrf"]').value
        /*We grab all user registration fields - then call the insertValidationElements Method
        To populate the "validation message areas" */
        this.allFields = document.querySelectorAll("#registration-form .form-control")
        this.insertValidationElements()

        //Get username fields
        this.username = document.querySelector('#username-register')
        this.username.previousValue = ""

        //Get Email fields
        this.email = document.querySelector("#email-register")
        this.email.previousValue = ""

        //Get Password Fields
        this.password = document.querySelector("#password-register")
        this.password.previousValue = ""

        this.username.isUnique = false
        this.password.isUnique = false
        this.events()
    }

    //Events
    events() {

        //submit is when the Form button is pressed and the SUBMIT command is issued
        this.form.addEventListener("submit", e => {
            e.preventDefault()
            this.formSubmitHandler()
        })

        //Keyup is when a keyboard button is pressed, and then "rissen up", indicating a full key press
        this.username.addEventListener("keyup", () => {
            this.isDifferent(this.username, this.usernameHandler)
        })
        this.email.addEventListener("keyup", () => {
            this.isDifferent(this.email, this.emailHandler)
        })
        this.password.addEventListener("keyup", () => {
            this.isDifferent(this.password, this.passwordHandler)
        })

        /*Blur refers to an event where the user moves off of the form field quickly, and not completing
        the KEYUP event, 
        such as a "tab" press very quickly
        */
        this.username.addEventListener("blur", () => {
            this.isDifferent(this.username, this.usernameHandler)
        })
        this.email.addEventListener("blur", () => {
            this.isDifferent(this.email, this.emailHandler)
        })
        this.password.addEventListener("blur", () => {
            this.isDifferent(this.password, this.passwordHandler)
        })
    }

    //Methods
    formSubmitHandler(){
        //Redo all validation checks before submit
        this.usernameImmediately()
        this.usernameAfterDelay()
        this.emailAfterDelay()
        this.passwordImmediately()
        this.passwordAfterDelay()

        //Check everything is ok before submitting the form
        if (
                this.username.isUnique && 
                !this.username.errors && 
                this.email.isUnique &&
                !this.email.errors &&
                !this.password.errors
            ) {
            this.form.submit()
        }
    }
    //See if the elements values has "Changed" - then perform action
    isDifferent(el, handler){
        if (el.previousValue != el.value) {
            handler.call(this)
        }
        el.previousValue = el.value
    }

    usernameHandler() {
        this.username.errors = false
        //This is where we split the username validation into two sections
        //Validation that needs to be perform "Immidately"
        this.usernameImmediately()

        //Validtion that will be used after the delay timeout has been reached
        clearTimeout(this.username.timer)
        this.username.timer = setTimeout(() => this.usernameAfterDelay(), 800)
    }
    
    passwordHandler() {
        this.password.errors = false
        //This is where we split the password validation into two sections
        //Validation that needs to be perform "Immidately"
        this.passwordImmediately()

        //Validtion that will be used after the delay timeout has been reached
        clearTimeout(this.password.timer)
        this.password.timer = setTimeout(() => this.passwordAfterDelay(), 800)
    }

    emailHandler() {
        this.email.errors = false
        //Validtion that will be used after the delay timeout has been reached
        clearTimeout(this.email.timer)
        this.email.timer = setTimeout(() => this.emailAfterDelay(), 800)
    }

    emailAfterDelay() {
        //User an regular expression to test out an email address
        if (!/^\S+@\S+$/.test(this.email.value)) {
            this.showValidationError(this.email, "You must provide a valid email address.")
        }

        if (!this.email.errors) {
            axios.post('/doesEmailExsist', {_csrf: this._csrf, email: this.email.value}).then((responce)=> {
                if (responce.data) {
                    this.email.isUnique = false
                    this.showValidationError(this.email, "That email address is already being used.")
                } else {
                    this.email.isUnique = true
                    this.hideValidationError(this.email)
                }
            }).catch(()=> {
                //Tech difficulty 
                console.log("Please try again later")
            })
        }
    }

    passwordImmediately(){
        if (this.password.value.length > 50) {
            this.showValidationError(this.password, "Password connot exceed 50 characters.")
        }

        if (!this.password.errors) {
            this.hideValidationError(this.password)
        }
    }

    passwordAfterDelay() {
        if (this.password.value.length < 5) {
            this.showValidationError(this.password, "Password must be at least 5 characters.")
        }
    }

    usernameImmediately(){
        if (this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
            this.showValidationError(this.username, "Username can only contain letters and numbers.")
        }

        if (this.username.value.length > 30) {
            this.showValidationError(this.username, "Username cannot exceed 30 characters.")
        }

        //If there are no user errors - hide the validation message
        if (!this.username.errors) {
            this.hideValidationError(this.username)
        }
    }

    usernameAfterDelay(){
        if (this.username.value.length < 3) {
            this.showValidationError(this.username, "Username must be at least 3 characters.")
        }

        if (!this.username.errors) {
            axios.post('/doesUsernameExsist', {_csrf: this._csrf, username: this.username.value}).then((responce) => {
                if (responce.data) {
                    this.showValidationError(this.username, "That Username is already taken.")
                    this.username.isUnique = false
                } else {
                    this.username.isUnique = true
                }
            }).catch(()=>{
                console.log("Please try again later.")
            })
        }
    }

    insertValidationElements(){
        this.allFields.forEach(function(el){
            //liveValidateMessage--visible css class will make the validation message "Visable"
            el.insertAdjacentHTML('afterend','<div class="alert alert-danger small liveValidateMessage"></div>')
        })
    }

    hideValidationError(el){
        el.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }

    showValidationError(el, message){
        el.nextElementSibling.innerHTML = message
        el.nextElementSibling.classList.add("liveValidateMessage--visible")
        el.errors = true
    }
}