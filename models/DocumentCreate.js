const docx = require("docx")
let TableCreate = require('../DocumentTemplates/tableCreate.js');
let templateStyles = require('../DocumentTemplates/docxStyles.js');
const client = require("../db.js");

const { Document,AlignmentType, HeadingLevel,Table,TableRow, TableCell, VerticalAlign, Packer, Paragraph, TextRun } = docx;



//Constructor
let DocumentCreate = function(clientActivitiesArray, profileData, fulldateString) {
    this.doc = new Document(templateStyles)
    this.clientActivitiesArray = clientActivitiesArray
    this.profileData = profileData
    this.fulldateString = fulldateString

    //Skills test
    this.skills = [
        {
            name: "Angular",
        },
        {
            name: "TypeScript",
        },
        {
            name: "JavaScript",
        },
        {
            name: "NodeJS",
        },
    ];
}

DocumentCreate.prototype.useMappedDocumentTemplates = function () {
    /*Here we have decided to "Combine" all clients and documents and send it 
    back to the client in one entire document
    */
    
    this.clientActivitiesArray.forEach(ca => {
        this.doc.addSection({
            properties: {},
            children: [
                TableCreate.invoiceHeaderInfo(this.profileData,ca.client, this.fulldateString),
                TableCreate.theGap(),
                TableCreate.invoiceTableHeaderRow(),
                /*NOTE: to create a template to loop through an "Array" 
                    the array call first needs the "tripple" periods at the front
                    of the call, and the template which the array will be looped in
                    must be within a "arrow function" call with "ZERO" {} for the encapsulation
                    as the table needs to return a "," at the end of the template call
                */
                ...TableCreate.invoiceTableRow(ca.activities),
                TableCreate.invoiceTableTotalAmountRow(ca.totalAmount),
                this.FooterNote(ca.client.footerNote) 
            ],
        });
    });

    return this.createDocument(this.doc)
}

DocumentCreate.prototype.useDocumentTemplates = function () {
    
    this.doc.addSection({
        properties: {},
        children: [
            TableCreate.invoiceHeaderInfo(this.profileData, this.fulldateString),
            TableCreate.theGap(),
            TableCreate.invoiceTableHeaderRow(),
            /*NOTE: to create a template to loop through an "Array" 
                the array call first needs the "tripple" periods at the front
                of the call, and the template which the array will be looped in
                must be within a "arrow function" call with "ZERO" {} for the encapsulation
                as the table needs to return a "," at the end of the template call
            */
            ...TableCreate.invoiceTableRow(this.activities),
            TableCreate.invoiceTableTotalAmountRow(this.totalAmount),
            this.FooterNote(this.profileData) 
        ],
    });
    return this.createDocument(this.doc)
}

DocumentCreate.prototype.FooterNote = (footerNote) => {
    return new Paragraph({
        children: [
            new TextRun({
                text: "",
            }),
            new TextRun({
            text: footerNote,
            bold: true,
        })],
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_3,
    });
}


DocumentCreate.prototype.createSkillList = (skills) => {
    return new Paragraph({
        children: [new TextRun(skills.map((skill) => skill.name).join(", ") + ".")],
    });
}


DocumentCreate.prototype.createDocument = function(doc){
    return new Promise( async (resolve, reject) => {
        try {
            let b64string = await Packer.toBase64String(doc)
            resolve(b64string)
        } catch (error) {
            reject(error)
        }
    })

    /*Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync("My Document.docx", buffer);
    });*/
}


module.exports = DocumentCreate