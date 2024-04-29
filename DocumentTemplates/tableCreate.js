const docx = require("docx")
const {ShadingType, AlignmentType,Table,TableRow, TableCell, TextRun, Paragraph,HeadingLevel,WidthType,BorderStyle,Link,UnderlineType  } = docx;

//Constructor - update update
let TableCreate = function(activities) {
    this.activities = activities
}

TableCreate.theGap = function () {
    return new Paragraph({
        text: '\n'
    })

}

TableCreate.addShading = function () {
    return `shading: {
        fill: "4bc951",
        val: ShadingType.CLEAR,
        color: "auto"
     }`
}


TableCreate.invoiceHeaderInfo = function (profileData, client, fulldateString) {
    return new Table({
        rows: [
            // Name and invoice wording
            new TableRow({
                children: [
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: profileData.fullname,
                                heading: HeadingLevel.HEADING_2,
                                alignment: AlignmentType.LEFT
                            }),
                            new Paragraph({
                                text: "ABN " + profileData.abn,
                                alignment: AlignmentType.LEFT,
                                style: "arialNormalGrey",
                            })
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    }),
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: "TAX INVOICE",
                                heading: HeadingLevel.HEADING_1,
                                alignment: AlignmentType.RIGHT,
                            })
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    })
                ]
            }),
            //BSB and account details
            new TableRow({
                children: [
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: "BSB: " + profileData.bsb,
                                alignment: AlignmentType.LEFT,
                                style: "arialNormalGrey",
                            }),
                            new Paragraph({
                                text: "Account NO. " + profileData.accountno,
                                alignment: AlignmentType.LEFT,
                                style: "arialNormalGrey",
                            })
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    }),
                    new TableCell({
                        children:[
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    })
                ]
            }),
            //Slight GAP
            new TableRow({
                children: [
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: " ",
                                alignment: AlignmentType.LEFT,
                                style: "arialNormalSB",
                            })
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    }),
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: " ",
                                alignment: AlignmentType.RIGHT,
                                style: "arialNormalSB",
                            }),
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    })
                ]
            }),
            //Email and invoice number + date
            new TableRow({
                children: [
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: profileData.emailaddress,
                                alignment: AlignmentType.LEFT,
                                style: "arialNormalBlueUnderline",
                            })
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    }),
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: "INVOICE #" + profileData.nextinvoiceno,
                                alignment: AlignmentType.RIGHT,
                                style: "arialNormalSB",
                            }),
                            new Paragraph({
                                text: fulldateString,
                                alignment: AlignmentType.RIGHT,
                                style: "arialNormalSB",
                            })
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    })
                ]
            }),
            //TO and FOR account details
            new TableRow({
                children: [
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: "TO:",
                                alignment: AlignmentType.LEFT,
                                heading: HeadingLevel.HEADING_2,
                            }),
                            new Paragraph({
                                text: client.clientTitle,
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                            new Paragraph({
                                text: client.toaddress1,
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                            new Paragraph({
                                text: client.toaddress2,
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                            new Paragraph({
                                text: client.toaddress3,
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            })
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    }),
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: "FOR:",
                                alignment: AlignmentType.LEFT,
                                heading: HeadingLevel.HEADING_2,
                            }),
                            new Paragraph({
                                text: client.foraddress1,
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                            new Paragraph({
                                text: client.foraddress2,
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                            new Paragraph({
                                text: client.foraddress3,
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    })
                ]
            }),
        ]
    })
}

TableCreate.invoiceHeaderInfoForClient = function (profileData, fulldateString) {
    return new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: "TO:",
                                alignment: AlignmentType.LEFT,
                                heading: HeadingLevel.HEADING_2,
                            }),
                            new Paragraph({
                                text: "test1",
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                            new Paragraph({
                                text: profileData.toaddress2,
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                            new Paragraph({
                                text: "test2",
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            })
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    }),
                    new TableCell({
                        children:[
                            new Paragraph({
                                text: "FOR:",
                                alignment: AlignmentType.LEFT,
                                heading: HeadingLevel.HEADING_2,
                            }),
                            new Paragraph({
                                text: "test3",
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                            new Paragraph({
                                text: profileData.foraddress2,
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                            new Paragraph({
                                text: profileData.foraddress3,
                                alignment: AlignmentType.LEFT,
                                style:"arialNormalSB",
                            }),
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                    })
                ]
            }),
        ]})
}

//Table Cell
TableCreate.invoiceTableHeaderRow = function() {
     return new Table({
        rows:[
            //First Row - ONLY HEADER ROW
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({
                                text: "DATE",
                                heading: HeadingLevel.HEADING_2,
                                alignment: AlignmentType.CENTER
                            })
                        ],
                        width: {
                            size: 12,
                            type: WidthType.PERCENTAGE
                        },
                        borders: {
                            top:{
                                style: BorderStyle.THICK,
                                size: 16
                            }
                        }
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                text: "SERVICE",
                                heading: HeadingLevel.HEADING_2,
                                alignment: AlignmentType.CENTER
                            })
                        ],
                        width: {
                            size: 50,
                            type: WidthType.PERCENTAGE
                        },
                        borders: {
                            top:{
                                style: BorderStyle.THICK,
                                size: 16
                            }
                        },
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                text: "HOURS",
                                heading: HeadingLevel.HEADING_2,
                                alignment: AlignmentType.CENTER
                            })
                        ],
                        width: {
                            size: 13,
                            type: WidthType.PERCENTAGE
                        },
                        borders: {
                            top:{
                                style: BorderStyle.THICK,
                                size: 16
                            }
                        },
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                text: "RATE",
                                heading: HeadingLevel.HEADING_2,
                                alignment: AlignmentType.CENTER
                            })
                        ],
                        width: {
                            size: 10,
                            type: WidthType.PERCENTAGE
                        },
                        borders: {
                            top:{
                                style: BorderStyle.THICK,
                                size: 16
                            }
                        },
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                text: "AMOUNT",
                                heading: HeadingLevel.HEADING_2,
                                alignment: AlignmentType.CENTER
                            })
                        ],
                        width: {
                            size: 15,
                            type: WidthType.PERCENTAGE
                        },
                        borders: {
                            top:{
                                style: BorderStyle.THICK,
                                size: 16
                            }
                        },
                    })
                ]
            }),
        ]
    })
}

//Table Cell
TableCreate.invoiceTableTotalAmountRow = function(totalAmount) {
    return new Table({
       rows:[
           //First Row - ONLY HEADER ROW
           new TableRow({
               children: [
                   new TableCell({
                       children: [
                           new Paragraph({
                               text: "",
                               alignment: AlignmentType.CENTER
                           })
                       ],
                       width: {
                           size: 12,
                           type: WidthType.PERCENTAGE
                       },
                       borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                   }),
                   new TableCell({
                       children: [
                           new Paragraph({
                               text: "",
                               heading: HeadingLevel.HEADING_2,
                               alignment: AlignmentType.CENTER
                           })
                       ],
                       width: {
                           size: 50,
                           type: WidthType.PERCENTAGE
                       },
                       borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                   }),
                   new TableCell({
                       children: [
                           new Paragraph({
                               text: "",
                               heading: HeadingLevel.HEADING_2,
                               alignment: AlignmentType.CENTER
                           })
                       ],
                       width: {
                           size: 8,
                           type: WidthType.PERCENTAGE
                       },
                       borders:{
                            top: {
                                style: BorderStyle.NIL,
                            },
                            bottom: {
                                style: BorderStyle.NIL,
                            },
                            left: {
                                style: BorderStyle.NIL,
                            },
                            right: {
                                style: BorderStyle.NIL,
                            },
                        },
                   }),
                   new TableCell({
                       children: [
                           new Paragraph({
                               text: "TOTAL",
                               heading: HeadingLevel.HEADING_2,
                               alignment: AlignmentType.CENTER
                           })
                       ],
                       width: {
                           size: 15,
                           type: WidthType.PERCENTAGE
                       },
                       borders: {
                           top:{
                               style: BorderStyle.THICK,
                               size: 16
                           }
                       },
                   }),
                   new TableCell({
                       children: [
                           new Paragraph({
                               text: "$" + totalAmount,
                               heading: HeadingLevel.HEADING_2,
                               alignment: AlignmentType.CENTER
                           })
                       ],
                       width: {
                           size: 15,
                           type: WidthType.PERCENTAGE
                       },
                       borders: {
                           top:{
                               style: BorderStyle.THICK,
                               size: 16
                           }
                       },
                   })
               ]
           }),
       ]
   })
}


TableCreate.createAchivementsList = function(achivements) {
    return achivements.map(
        (achievement) =>
            new Paragraph({
                text: achievement.name,
                bullet: {
                    level: 0,
                },
            }),
    );
}

TableCreate.invoiceTableRow = (activities) => {
    return activities.map(
     (a)=> 
     new Table({
         rows:[
             //This should be loopable for each activity row
             new TableRow({
                 children: [
                    new TableCell({
                        children: [
                            new Paragraph({
                                //Date
                                text: a.createdDate,
                                bold: false,
                                alignment: AlignmentType.CENTER,
                                style: "arialNormal",
                            }),
                            new Paragraph({
                                //Date
                                text: a.startTime + " - " + a.endTime,
                                bold: false,
                                alignment: AlignmentType.CENTER,
                                style: "arialSmallNormal",
                            }),
                            new Paragraph({
                                //Date
                                text: a.dayOftheWeek,
                                bold: false,
                                alignment: AlignmentType.CENTER,
                                style: "arialNormal",
                            }),
                        ],
                        width: {
                            size: 12,
                            type: WidthType.PERCENTAGE
                        },
                        //Apply shade if penalty rate is applied
                        shading: {
                            fill: a.shade,
                            val: ShadingType.CLEAR,
                            color: "auto"
                         },                  
                    }),
                     new TableCell({
                         children: [
                             new Paragraph({
                                 //Service - this can be a very long string
                                 text: a.body,
                                 bold: false,
                                 alignment: AlignmentType.CENTER,
                                 style: "arialNormal",
                             })
                         ],
                         width: {
                             size: 50,
                             type: WidthType.PERCENTAGE
                         },
                        //Apply shade if penalty rate is applied
                        shading: {
                            fill: a.shade,
                            val: ShadingType.CLEAR,
                            color: "auto"
                         },
                     }),
                     new TableCell({
                         children: [
                             new Paragraph({
                                 //How many hours Paula took to complete a job
                                 text: a.diffHours,
                                 bold: false,
                                 alignment: AlignmentType.CENTER,
                                 style: "arialNormal",
                             })
                         ],
                         width: {
                             size: 13,
                             type: WidthType.PERCENTAGE
                         },
                         //Apply shade if penalty rate is applied
                         shading: {
                             fill: a.shade,
                             val: ShadingType.CLEAR,
                             color: "auto"
                          },
                     }),
                     new TableCell({
                         children: [
                             new Paragraph({
                                 //How much is the job - per hour rate
                                 text: "$" + a.rate,
                                 bold: false,
                                 alignment: AlignmentType.CENTER,
                                 style: "arialNormal",
                             }),
                             new Paragraph({
                                //How much is the job - per hour rate
                                text: a.rateType,
                                bold: false,
                                alignment: AlignmentType.CENTER,
                                style: "arialSmallNormal",
                            })
                         ],
                         width: {
                             size: 10,
                             type: WidthType.PERCENTAGE
                         },
                         //Apply shade if penalty rate is applied
                         shading: {
                            fill: a.shade,
                            val: ShadingType.CLEAR,
                            color: "auto"
                         },
                     }),
                     new TableCell({
                         children: [
                             new Paragraph({
                                 //This should be automatic - Rate * hours = the amount
                                 text: "$" + a.amount,
                                 bold: true,
                                 alignment: AlignmentType.CENTER,
                                 style: "arialNormal",
                             })
                         ],
                         width: {
                             size: 15,
                             type: WidthType.PERCENTAGE
                         },
                         //Apply shade if penalty rate is applied
                         shading: {
                           fill: a.shade,
                           val: ShadingType.CLEAR,
                           color: "auto"
                         },
                     }),
                 ]
             }),
         ]
     },)
    
    )
 }


module.exports = TableCreate