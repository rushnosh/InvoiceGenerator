# Invoice Generator
Create an application to cater for multiple clients and create a process for easy invoice generation.

This was created to assist NDIS workers in automating their invoice generation tasks.
It uses the Express API framework with docx implementation to use as the doc "Templater" to create the invoices.

Prerequisites are:
  * Node.js
  * Express
  * axios
  * docx (used to create the doc invoice files)
  * ejs (uses ejs view templates)
  * Mongo DB - js type database

## Installation
Feel free to download
Ensure you have at the very least Node.js version v20 or higher
Run npm install to gain all the nessesary packages 
```
npm install
```
You will need to create an .env file and have the following configuration items added before running.

```
 CONNECTIONSTRING=<Mongo DB connection string>
 PORT=4000
 SECURECOOKIE=true
//NOTE: for online db's you'll need the secure cookie
//SECURECOOKIE=false
 
 //Email Parameters
 EMAILSERVICEHOST=<host domain>
 EMAILUSERNAME=<email address your using to send emails>
 EMAILPASSWORD=<password>
```

 Once the npm packages are installed run via 'npm run watch'