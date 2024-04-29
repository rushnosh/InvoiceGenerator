export default class GenInvoicePage {
    // 1. Select the DOM elements, and keep track of any useful data
    constructor() {
        //we only want this script to execute on "/generate-invoice" route
        this.multiclientCheckBox = document.getElementById("multiclient")
        this.clientSelectBox = document.querySelector('.clientSelect')
        this.events()

    }

    // 2. Events - like click or scroll events
    events() {
        this.multiclientCheckBox.addEventListener("click", (e) => {
            //e.preventDefault()
            this.openCloseClientBox()
        })
    }
    // 3. Methods
    openCloseClientBox() {
        if (this.clientSelectBox.classList.contains("clientSelect--hidden")) {
            this.clientSelectBox.classList.remove("clientSelect--hidden")
        } else {
            this.clientSelectBox.classList.add("clientSelect--hidden")           
        }
    }
}