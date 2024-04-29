//Used for database connections - only need actvities at this stage- 
const ObjectID = require('mongodb').ObjectId

//user model to grab the gravatar
const User = require('./User')

// get client data
const Client = require('./Client')

// Grab activities to populate invoice templates
const TimeScheduler = require('./TimeScheduler')

// Grab Public Holidays to check on rates
const  publicHolidayCollection = require('../db').db().collection("publicholiday")

// Use the document generator to create a 64Bit doc file
const DocumentCreate = require('./DocumentCreate')
const client = require('../db')
const { default: validator } = require('validator')

//Constructor
let InvoiceGenerator = function(data, userid) {
    this.data = data,
    this.errors = [],
    this.publicHolidaysArrary = [],
    this.userid = userid,
    this.publicholidayColour = "66bd7d", // Green
    this.categoryOverrideColour = "92a5f7", // Blue
    this.saturdayColour = "edcc80", // Orange
    this.sundayColour = "f28d8d", // Red
    this.penaltyShadeColour = "e3caed", // Purple
    this.profileData
}


InvoiceGenerator.prototype.generateInvoice = function() {
    return new Promise(async (resolve, reject) => {
        try {
            let prevDate =  {
                    startDate: this.data.startDate,
                    endDate: this.data.endDate
            }

            //Check to see if the user enter in the dates in the wrong order
            let checkPreDate = this.checkPrevDates(prevDate)
            if (checkPreDate) {
                resolve("fail")
            }
            // Gather the public holiday dates for later compare
            publicHolidaysArrary = await publicHolidayCollection.find({"Jurisdiction": "qld"},).toArray()
            if (publicHolidaysArrary.length < 1) {
                this.errors.push("Could not obtain any public holidays from the database.")
                resolve("fail")
            }


            //Define the list of invoices ready for invoice
            let invoiceActvities

            //Create an array of clients for Gen inv
            let clients = []

            //Check to see if the multiclient flag is on - if not - get all scedules for "all" clients
            if (this.data.multiclient != undefined && this.data.multiclient == "on") {
                //Client selected Single/multi select but failed to give us an option
                if (this.data.clientSelect == undefined) {
                    this.errors.push("You need to provide us with a client via the drop down. Please try again.")
                    resolve("fail")
                }
                //Get invoice activities based on client select
                invoiceActvities = await TimeScheduler.findCustomTimeSchedulesByAuthorIdClientSelect(prevDate, this.userid, this.data.clientSelect)
            } else {
                //Just get all activities in a given time frame
                invoiceActvities = await TimeScheduler.findCustomTimeSchedulesByAuthorId(prevDate, this.userid)
            }
            
            if (invoiceActvities.length > 0){
                //populate the clients array with client id data
                clients = Array.from(new Set(invoiceActvities.map( c => c.client.clientTitle)))
                    .map(ct => {
                        return {
                            clientTitle: ct,
                            _id: invoiceActvities.find(i => i.client.clientTitle === ct).client._id
                        }
                    })

                //Check if there are any Unassigned Categories within the activities - error if they are
                let unassignCats =  this.checkActivitiesForCategoryAssignments(invoiceActvities)
                if (unassignCats) {
                    resolve("fail")
                }
                //Here we need to check all clients - check to see if the base rates and penalty rates are on the client.
                let clientRatesNotUpdated = await this.checkClientBaseAndPenaltyRates()
                if (clientRatesNotUpdated) {
                    resolve("clientUpdate")
                }

                //update the actvities with the relevent data
                let updatedInvoiceActivity = this.updateAvtivitiesData(invoiceActvities,this.profileData)
                
                //Here we group the activities via its clients
                let clientActivitesArray = []
                clients.forEach( c => {
                    let fa = updatedInvoiceActivity.filter ( u => {
                        let checkCid = ObjectID(c._id).toString()
                        let iId = ObjectID(u.client._id).toString()
                        if (validator.equals(checkCid,iId)) {
                            return true
                        } 
                    })
                    let clientGroupedInvoices = {}
                    clientGroupedInvoices.clientTitle = c.clientTitle
                    //grab the client data into a separate property
                    clientGroupedInvoices.client = fa[0].client
                    clientGroupedInvoices.activities = fa
                    clientGroupedInvoices.totalAmount = InvoiceGenerator.gainTotalAmount(fa)
                    clientActivitesArray.push(clientGroupedInvoices)
                })
             
                //Get Todays Date String to place on the invoice
                let todaydate = new Date();  
                let monthString = todaydate.toLocaleString('default', { month: 'long' });
                let fulldateString = todaydate.getDate() + " " + monthString + " " + todaydate.getFullYear()
                
                // Update the "next invoice number" from within the profile data object to use 0000 based numbering
                this.profileData.nextinvoiceno = parseInt(this.profileData.nextinvoiceno).toLocaleString('en', {minimumIntegerDigits:4,useGrouping:false})
                
                //We are pushing the map of invoices in one mass document send
                let massDoc = new DocumentCreate(clientActivitesArray, this.profileData, fulldateString.toUpperCase())
                let theDocs = await massDoc.useMappedDocumentTemplates()

                //increment the invoice number in profile data
                let updateProfileInvoiceNumber = await User.updateInvoiceNumberForInvGen(this.userid)
                if (!updateProfileInvoiceNumber) {
                    //could not update the db with new invoice number - just continue
                    console.log("Could not update invoice number.")
                }
                resolve(theDocs)  
            } else {
                this.errors.push("No scheduled activities where saved with the date range provided.")
                resolve("fail")
            }
        } catch (error) {
           reject(error) 
        }
    })
}

InvoiceGenerator.prototype.checkPrevDates = function(prevDate) {
    if (typeof prevDate.startDate != 'string') {this.errors.push(`Dates are entered in an incorrect format`)}
    if (typeof prevDate.endDate != 'string') {this.errors.push(`Dates are entered in an incorrect format`)}
    let d1 = new Date(prevDate.startDate);
    let d2 = new Date(prevDate.endDate);
    if (d1 > d2) {
        this.errors.push(`Start date is larger than End date, please try again.`)
    }
    if (!this.errors.length) {
        return false
    } else {
        return true
    }
}

InvoiceGenerator.prototype.checkActivitiesForCategoryAssignments = function(invoiceActvities){

    invoiceActvities.forEach(e => {
        if (typeof e.categoryDocument == 'undefined') {
            this.errors.push(`"${e.activityDocument.title}" does NOT have a category assigned. Please fix`)
        }
    })
    if (this.errors.length) {
        return true
    } else {
        return false
    }
     
}
InvoiceGenerator.prototype.checkClientBaseAndPenaltyRates = async function(){
    let clients = await Client.findByAuthorId(this.userid)
    clients.forEach(client => {
        if (client.baserate == "") {
            this.errors.push(`"${client.clientTitle}" does NOT have a base rate. Please fix`)
        }
        if (client.penaltyrate == "") {
            this.errors.push(`"${client.clientTitle}" does NOT have a penalty rate. Please fix`)
        }
        if (client.baseRateStartTime == "") {
            this.errors.push(`"${client.clientTitle}" does NOT have a base rate start time. Please fix`)
        }
        if (client.baseRateEndTime == "") {
            this.errors.push(`"${client.clientTitle}" does NOT have a base rate end time. Please fix`)
        }
    })
    if (this.errors.length) {
        return true
    } else {
        return false
    }
     
}

InvoiceGenerator.gainTotalAmount = function(updatedInvoiceActivity) {
    let total = 0
    updatedInvoiceActivity.forEach(item => {
        total = parseFloat(item.amount) + total
    });
    total = InvoiceGenerator.roundDownTwoDec(total)
    return total
}

InvoiceGenerator.prototype.gainTotalAmount = function(updatedInvoiceActivity) {
    let total = 0
    updatedInvoiceActivity.forEach(item => {
        total = parseFloat(item.amount) + total
    });
    total = InvoiceGenerator.roundDownTwoDec(total)
    return total
}

InvoiceGenerator.prototype.gainTotalAmountViaMap = function(invoiceItem, clientName, map) {
    let total = 0
    invoiceItem.forEach(item => {
        total = parseFloat(item.amount) + total
    });
    total = InvoiceGenerator.roundDownTwoDec(total)
    map.set(clientName,{invoiceItem, total})
}

InvoiceGenerator.amOrPmHour = function(i) {
    let hours = i;
    hours = (hours+24)%24; 
    if(hours==0){ //At 00 hours we need to show 12 am
    return 12;
    }
    else if(hours>12)
    {
        return hours%12;
    } else {
        return hours
    }
}

InvoiceGenerator.addZero = function (i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

InvoiceGenerator.amOrPm = function(i) {
    let hours = i;
    hours = (hours+24)%24; 
    if(hours==0){ //At 00 hours we need to show 12 am
    return "AM";
    }
    else if(hours>=12)
    {
        return "PM"
    } else {
        return "AM"
    }
}
InvoiceGenerator.diff_hours = function (dt2, dt1) 
 {
    let diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60);
    //return Math.abs(Math.round(diff));
    return Math.abs(Math.round((diff + Number.EPSILON) * 100) / 100).toString();
}

InvoiceGenerator.roundDownTwoDec = function(num) {
    let retNum = Math.abs(Math.round((num + Number.EPSILON) * 100) / 100)
    return retNum.toFixed(2).toString();
}

InvoiceGenerator.checkForActivityRate = function(startTime, endTime, clientData, publicHolidayRate, categoryOverrideRate, saturdayRate, sundayRate) {
        //For public holiday date compare
        let tday = new Date(startTime.getFullYear() + ", " + (startTime.getMonth() + 1) + ", " + startTime.getDate() + ", 10:00")
       
        //Set some local time veriables
        let st = startTime.getHours() + ":" + InvoiceGenerator.addZero(startTime.getMinutes())
        let et = endTime.getHours() + ":" + InvoiceGenerator.addZero(endTime.getMinutes())
        //TODO: make some rate calculations based on user preferences
    
        //Check for public holiday - we needed to add 10 hours since the import did not account for GTM+ conversons
        let publicHolidayCheck = false
        publicHolidaysArrary.forEach(phd => {
            if (phd.Date.getTime() === tday.getTime() ) {
                publicHolidayCheck = true
            }
        })
        //If public holiday date is mached then use the public holiday rate
        if (publicHolidayCheck && publicHolidayRate != "") {
                return "publicholiday"
        }
        //check for category overrides
        if( typeof categoryOverrideRate == "string" && validator.isNumeric(categoryOverrideRate) && categoryOverrideRate != "" ){
            return "categoryOverride" 
        }
    
        // Is it a Saturday activity?
        if( typeof saturdayRate == "string" && validator.isNumeric(saturdayRate) && saturdayRate != "" && startTime.getDay() == "6" ){
            return "saturdayrate"
        }
        // Is it a Sunday activity?
        if( typeof sundayRate == "string" && validator.isNumeric(sundayRate) && sundayRate != "" && startTime.getDay() == "0" ){
            return "sundayrate"
        }
    
        //Check for penalty times
        if((Date.parse('01/01/2011 ' + st) < Date.parse('01/01/2011 ' + clientData.baseRateStartTime)) 
        && (Date.parse('01/01/2011 ' + et) < Date.parse('01/01/2011 ' + clientData.baseRateStartTime))) {
            //console.log('activity is outside of base time - apply penalty rate only')
            return "penalty"
        } else if((Date.parse('01/01/2011 ' + st) > Date.parse('01/01/2011 ' + clientData.baseRateEndTime)) 
        && (Date.parse('01/01/2011 ' + et) > Date.parse('01/01/2011 ' + clientData.baseRateEndTime))) {
            //console.log('activity is outside of base time - apply penalty rate only')
            return "penalty"
        } else if(Date.parse('01/01/2011 ' + st) < Date.parse('01/01/2011 ' + clientData.baseRateStartTime)){
            //console.log('activity started too early - apply split penalty rate')
            return "bpenalty"
        } else if (Date.parse('01/01/2011 ' + et) > Date.parse('01/01/2011 ' + clientData.baseRateEndTime)){
            //console.log('activity ended too late - apply split penalty rate')
            return "apenalty"
        } else {
            //console.log('normal activity - apply normal rate')
            return "normal"
        }
}

InvoiceGenerator.getDayName = function (day) {
    switch (day) {
        case 0:
            return "Sunday"
        case 1:
            return "Monday"
        case 2:
            return "Tuesday"
        case 3:
            return "Wednesday"
        case 4:
            return "Thursday"
        case 5:
            return "Friday"
        case 6:
            return "Saturday"
        default:
            break;
    }
}

InvoiceGenerator.prototype.updateAvtivitiesData = function (invoiceAct) {
    let returnArr = []
    invoiceAct.forEach(a => {
        let cd = a.createdDateTime
        let ed = a.endDateTime
        let cdate = cd.getDate() + "/" + (cd.getMonth() + 1) + "/" + cd.getFullYear()
        let commadate = cd.getFullYear()  + "-" + (cd.getMonth() + 1) +  "-" + cd.getDate()

        let stime = InvoiceGenerator.amOrPmHour(cd.getHours()) + ":" + InvoiceGenerator.addZero(cd.getMinutes()) + " " + InvoiceGenerator.amOrPm(cd.getHours())
        let etime = InvoiceGenerator.amOrPmHour(ed.getHours()) + ":" + InvoiceGenerator.addZero(ed.getMinutes()) + " " + InvoiceGenerator.amOrPm(ed.getHours())

        //For penalty time frames
        let psd = new Date(commadate + " " + a.client.baseRateStartTime)
        let ped = new Date(commadate + " " + a.client.baseRateEndTime)

        let pstime = InvoiceGenerator.amOrPmHour(psd.getHours()) + ":" + InvoiceGenerator.addZero(psd.getMinutes()) + " " + InvoiceGenerator.amOrPm(psd.getHours())
        let petime = InvoiceGenerator.amOrPmHour(ped.getHours()) + ":" + InvoiceGenerator.addZero(ped.getMinutes()) + " " + InvoiceGenerator.amOrPm(ped.getHours())
        let isSplitRate = InvoiceGenerator.checkForActivityRate(cd, ed, a.client,a.client.publicHolidayRate, a.categoryDocument.categoryOverrideRate, a.client.saturdayRate, a.client.sundayRate)

        //Initialise some veriables
        let dayOftheWeek = InvoiceGenerator.getDayName(cd.getDay())
        let rate = ""
        let diffHours = ""
        let amount = ""
        let rate1 = ""
        let rate2 = ""
        let diffHours1 = ""
        let diffHours2 = ""
        let amount1 = ""
        let amount2 = ""

        switch(isSplitRate) {
            case 'publicholiday':
                // Its a public Holiday - use the normal public holiday rates - no split
                rate = a.client.publicHolidayRate
                diffHours = InvoiceGenerator.diff_hours(cd, ed)
                amount = InvoiceGenerator.roundDownTwoDec(diffHours * rate)
                returnArr.push({
                    _id: a._id,
                    title: a.activityDocument.title,
                    body: a.activityDocument.body,
                    createdDate: cdate,
                    startTime: stime,
                    endTime: etime,
                    diffHours: diffHours,
                    rate: rate,
                    amount: amount,
                    client: a.client,
                    shade: this.publicholidayColour,
                    rateType: "Public Holiday Rate",
                    dayOftheWeek: dayOftheWeek
                })
                break;
            case 'categoryOverride':
                // Its a category override - use the normal category rates - no split
                rate = a.categoryDocument.categoryOverrideRate
                diffHours = InvoiceGenerator.diff_hours(cd, ed)
                amount = InvoiceGenerator.roundDownTwoDec(diffHours * rate)
                returnArr.push({
                    _id: a._id,
                    title: a.activityDocument.title,
                    body: a.activityDocument.body,
                    createdDate: cdate,
                    startTime: stime,
                    endTime: etime,
                    diffHours: diffHours,
                    rate: rate,
                    amount: amount,
                    client: a.client,
                    shade: this.categoryOverrideColour,
                    rateType: "Category Override Rate",
                    dayOftheWeek: dayOftheWeek
                })
                break;
            case 'saturdayrate':
                // Its a Saturday - use the normal saturday rates - no split
                rate = a.client.saturdayRate
                diffHours = InvoiceGenerator.diff_hours(cd, ed)
                amount = InvoiceGenerator.roundDownTwoDec(diffHours * rate)
                returnArr.push({
                    _id: a._id,
                    title: a.activityDocument.title,
                    body: a.activityDocument.body,
                    createdDate: cdate,
                    startTime: stime,
                    endTime: etime,
                    diffHours: diffHours,
                    rate: rate,
                    amount: amount,
                    client: a.client,
                    shade: this.saturdayColour,
                    rateType: "Saturday Rate",
                    dayOftheWeek: dayOftheWeek
                })
                break;
            case 'sundayrate':
                // Its a Sunday - use the normal Sunday rates - no split
                rate = a.client.sundayRate
                diffHours = InvoiceGenerator.diff_hours(cd, ed)
                amount = InvoiceGenerator.roundDownTwoDec(diffHours * rate)
                returnArr.push({
                    _id: a._id,
                    title: a.activityDocument.title,
                    body: a.activityDocument.body,
                    createdDate: cdate,
                    startTime: stime,
                    endTime: etime,
                    diffHours: diffHours,
                    rate: rate,
                    amount: amount,
                    client: a.client,
                    shade: this.sundayColour,
                    rateType: "Sunday Rate",
                    dayOftheWeek: dayOftheWeek
                })
                break
            case 'bpenalty':
              // Split activity for activities which are too early - penalty rate split with normal rate
                rate1 = a.client.penaltyrate
                rate2 = a.client.baserate
                diffHours1 = InvoiceGenerator.diff_hours(cd, psd)
                diffHours2 = InvoiceGenerator.diff_hours(psd, ed)
                amount1 = InvoiceGenerator.roundDownTwoDec(diffHours1 * rate1)
                amount2 = InvoiceGenerator.roundDownTwoDec(diffHours2 * rate2)
                returnArr.push(
                    {_id: a._id,
                    title: a.activityDocument.title,
                    body: a.activityDocument.body,
                    createdDate: cdate,
                    startTime: stime,
                    endTime: pstime,
                    diffHours: diffHours1,
                    rate: rate1,
                    amount: amount1,
                    client: a.client,
                    shade: this.penaltyShadeColour,
                    rateType: "Penalty Rate",
                    dayOftheWeek: dayOftheWeek
                },
                {
                    _id: a._id,
                    title: a.activityDocument.title,
                    body: a.activityDocument.body,
                    createdDate: cdate,
                    startTime: pstime,
                    endTime: etime,
                    diffHours: diffHours2,
                    rate: rate2,
                    client: a.client,
                    amount: amount2,
                    shade: "",
                    dayOftheWeek: dayOftheWeek
                })
              break;
            case 'apenalty':
              // Split activity for activities which are too late - normal rate split with penalty rate
              rate1 = a.client.baserate
              rate2 = a.client.penaltyrate
              diffHours1 = InvoiceGenerator.diff_hours(cd, ped)
              diffHours2 = InvoiceGenerator.diff_hours(ped, ed)
              amount1 = InvoiceGenerator.roundDownTwoDec(diffHours1 * rate1)
              amount2 = InvoiceGenerator.roundDownTwoDec(diffHours2 * rate2)
              returnArr.push(
                  {_id: a._id,
                  title: a.activityDocument.title,
                  body: a.activityDocument.body,
                  createdDate: cdate,
                  startTime: stime,
                  endTime: petime,
                  diffHours: diffHours1,
                  rate: rate1,
                  client: a.client,
                  amount: amount1,
                  shade: "",
                  dayOftheWeek: dayOftheWeek
              },
              {
                  _id: a._id,
                  title: a.activityDocument.title,
                  body: a.activityDocument.body,
                  createdDate: cdate,
                  startTime: petime,
                  endTime: etime,
                  diffHours: diffHours2,
                  rate: rate2,
                  client: a.client,
                  amount: amount2,
                  shade: this.penaltyShadeColour,
                  rateType: "Penalty Rate",
                  dayOftheWeek: dayOftheWeek
              })
              break;
            case 'penalty':
              // Normal penalty rate activity
              rate = a.client.penaltyrate
              diffHours = InvoiceGenerator.diff_hours(cd, ed)
              amount = InvoiceGenerator.roundDownTwoDec(diffHours * rate)
              returnArr.push({
                  _id: a._id,
                  title: a.activityDocument.title,
                  body: a.activityDocument.body,
                  createdDate: cdate,
                  startTime: stime,
                  endTime: etime,
                  diffHours: diffHours,
                  rate: rate,
                  client: a.client,
                  amount: amount,
                  shade: this.penaltyShadeColour,
                  rateType: "Penalty Rate",
                  dayOftheWeek: dayOftheWeek
              })
              break;
            default:
              // Normal rate activity
              rate = a.client.baserate
              diffHours = InvoiceGenerator.diff_hours(cd, ed)
              amount = InvoiceGenerator.roundDownTwoDec(diffHours * rate)
              returnArr.push({
                  _id: a._id,
                  title: a.activityDocument.title,
                  body: a.activityDocument.body,
                  createdDate: cdate,
                  startTime: stime,
                  endTime: etime,
                  diffHours: diffHours,
                  rate: rate,
                  client: a.client,
                  amount: amount,
                  shade: "",
                  dayOftheWeek: dayOftheWeek
              })
          }

    });
    return returnArr
}

InvoiceGenerator.prototype.profileDataObtain = function() {
    return new Promise(async (resolve,reject) => {
    //Now Grab the profile data
        this.profileData = await User.getProfileSettingsForInvGen(this.userid)
        if (!this.profileData) {
            reject("No profile data, please update your profile with some data first.")
        }
        resolve()
    })
}
                

InvoiceGenerator.prototype.getInvoiceNumber = function () {
    return this.profileData.nextinvoiceno
}

module.exports = InvoiceGenerator