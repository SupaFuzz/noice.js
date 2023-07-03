/*
    this serves the contents of ../example
*/
const fs         = require('fs');
const express    = require('express');
const bodyParser = require('body-parser');

// configuration
const config = {
    name:               'noice.js Example HTTP Server',
    version:            1.0,
    debug:              true,
    port:               3000
};

/*
    the server
*/
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve the static content
app.use("/", express.static('./htdocs'));
app.use("/lib", express.static('../lib'));

/*
    see elsewhere for examples of setting up
    methods to post to, etc and complex routing
*/



// open the port n' start listnening
app.listen(config.port, () => console.log(`${config.name}/v${config.version} running on TCP/${config.port}!`))
