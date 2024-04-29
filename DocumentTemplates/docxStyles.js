const docx = require("docx")
const { UnderlineType  } = docx;
//Update
//Set the document styles
module.exports = {
    styles: {
        paragraphStyles: [
            {
                id: "Heading1",
                name: "Heading 1",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 35,
                    bold: false,
                    italics: true,
                    color: "6e6d6d",
                    font:"Calibri"
                },
                paragraph: {
                    spacing: {
                        after: 120,
                    },
                },
            },
            {
                id: "Heading2",
                name: "Heading 2",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 25,
                    bold: false,
                    color: "Black",
                    font: "Arial"
                },
                paragraph: {
                    spacing: { line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 },
                },
            },
            {
                id: "Heading3",
                name: "Heading 3",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 20,
                    bold: false,
                    color: "Black",
                    font: "Arial"
                },
                paragraph: {
                    spacing: { line: 276, before: 100 * 72 * 0.1, after: 20 * 72 * 0.05 },
                },
            },
            {
                id: "aside",
                name: "Aside",
                basedOn: "Normal",
                next: "Normal",
                run: {
                    color: "999999",
                    italics: true,
                },
                paragraph: {
                    indent: {
                        left: 720,
                    },
                    spacing: {
                        line: 276,
                    },
                },
            },
            {
                id: "wellSpaced",
                name: "Well Spaced",
                basedOn: "Normal",
                quickFormat: true,
                paragraph: {
                    spacing: { line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 },
                },
            },
            {
                id: "ListParagraph",
                name: "List Paragraph",
                basedOn: "Normal",
                quickFormat: true,
            },
            {
                id: "arialNormal",
                name: "Arial Normal",
                basedOn: "Normal",
                quickFormat: true,
                run: {
                    size: 18,
                    bold: false,
                    color: "Black",
                    font: "Arial"
                },
                paragraph: {
                    spacing: { before: 20, after: 20 },
                },
            },
            {
                id: "arialSmallNormal",
                name: "Arial Small Normal",
                basedOn: "Normal",
                quickFormat: true,
                run: {
                    size: 10,
                    bold: false,
                    color: "Black",
                    font: "Arial"
                },
                paragraph: {
                    spacing: { before: 20, after: 20 },
                },
            },
            {
                id: "arialNormalGrey",
                name: "Arial Normal Grey",
                basedOn: "Normal",
                quickFormat: true,
                run: {
                    size: 18,
                    bold: false,
                    color: "6e6d6d",
                    font: "Arial"
                },
                paragraph: {
                    spacing: { before: 20, after: 20 },
                },
            },
            {
                id: "arialNormalSB",
                name: "Arial Normal Slitly Bigger",
                basedOn: "Normal",
                quickFormat: true,
                run: {
                    size: 20,
                    bold: false,
                    color: "Black",
                    font: "Arial"
                },
                paragraph: {
                    spacing: { before: 20, after: 20 },
                },
            },
            {
                id: "arialNormalBlueUnderline",
                name: "Arial Normal Blue Underline",
                basedOn: "Normal",
                quickFormat: true,
                run: {
                    size: 20,
                    bold: false,
                    color: "2c2fe6",
                    font: "Arial",
                    underline: {
                        type: UnderlineType.SINGLE,
                        color: "2c2fe6",
                    },
                },
                paragraph: {
                    spacing: { before: 20, after: 20 },
                },
            },
        ],
    }
}
