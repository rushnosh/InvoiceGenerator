import GenInvoicePage from './modules/geninvoicepage'
import RegistrationForm from './modules/registrationForm'
//Run invoice gen script on the gen invoice page
if (window.location.pathname == "/generate-invoice" || window.location.pathname == "/generate-invoice/" ){new GenInvoicePage()}
if (document.querySelector("#registration-form")){ new RegistrationForm()}