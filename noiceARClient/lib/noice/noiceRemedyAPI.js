/*
    noiceRemedyAPI.js               "dude, noice!"

    this handles everything except sending attachments
    I just typically don't need to do that, and it looks like a huge headache
    to work out. Also associations.

    TO-DO: get attachments working
    https://communities.bmc.com/docs/DOC-60907

*/

'use strict';




/*
    noiceRemedyAPIException({})
    custom error class descending from noiceException
*/
class noiceRemedyAPIException extends noiceException {


/*
    constructor ({
        xhr:                    (optional) if specfied, extract arsErrorList, httpStatus and httpResponseHeaders
        message:                (optional) if specified, return this on *.message rather than the first entry in arsErrorList
        messageType:            (optional) if specified, return this on *.messageType rather than the first entry in arsErrorList
        thrownByFunction:       (optional) name of function that threw the error
        thrownByFunctionArgs:   (optional) copy of args sent to function that threw the error
    })
*/
constructor(args){

    // set it up
    super(args, {
        _version:       2,
        _className:     'noiceRemedyAPIException',
        _lastResort:    [],
        _message:       '',
        _messageType:   '',
        httpResponseHeaders: {},
        arsErrorList:        []
    });

    // set the timestamp
    this.time = this.epochTimestamp(true);

    // pull ars error messages from the xhr if we have one
    this.parseXHR();

} // end constructor


/*
    getter and setter for 'message'
    return this.message if it's set otherwise the first
    messageText from arsErrorList, or an error stating why not
*/
set message(v){ this._message = v; }
get message(){
    if (this.hasAttribute('_message')){
        return(this._message);
    }else {
        try {
            return(this.arsErrorList[0].messageText);
        }catch (e){
            return('no error messsage available (not set, cannot be parsed from xhr)');
        }
    }
}


/*
    getter and setter for 'messageType'
    return this.message if it's set otherwise the first
    messageText from arsErrorList, or an error stating why not
*/
set messageType(v){ this._messageType = v; }
get messageType(){
    if (this.hasAttribute('_messageType')){
        return(this._messageType);
    }else {
        try {
            return(this.arsErrorList[0].messageType);
        }catch (e){
            return('no messageType available (not set, cannot be parsed from xhr)');
        }
    }
}


/*
    getters for arsErrorList properties
    all default to the first entry in arsErrorList or false
*/
get messageText(){
    try {
        return(this.arsErrorList[0].messageText);
    }catch (e){
        return(false);
    }
}

get messageAppendedText(){
    try {
        return(this.arsErrorList[0].messageAppendedText);
    }catch (e){
        return(false);
    }
}

get messageNumber(){
    try {
        return(this.arsErrorList[0].messageNumber);
    }catch (e){
        return(false);
    }
}


/*
    return a legit Error object
*/
get error(){
    return(new Error(this.message));
}


/*
    return a nice string
*/
toString(){
    return(`[http/${this.httpStatus} ${this.messageType} (${this.messageNumber})]: ${this.message} / ${this.messageAppendedText}`);
}


/*
    parseXHR()
    if we have an *.xhr attribute, parse it looking for ARS Error Messages
*/
parseXHR(){
    let self = this;

    if (self.hasAttribute('xhr')){
        // try to get the httpStatus
        try {
            self.httpStatus = self.xhr.status;
        }catch (e){
            self.httpStatus = 0;
            self._lastResort.push(`[httpStatus]: cannot find ${e}`);
        }

        // try to get the httpResponseHeaders
        try {
            self.xhr.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(function(line){
                line = line.replace(/[\r\n]+/, '');
                let tmp = line.split(/:\s+/,2);
                self.httpResponseHeaders[tmp[0]] = tmp[1];
            });
        }catch (e){
            self._lastResort.push(`[httpResponseHeaders]: failed to parse ${e}`);
        }

        // try to parse out ars errors
        if (self.isNotNull(self.xhr.responseText) || self.isNotNull(self.xhr.response)){
            try {
                self.arsErrorList = JSON.parse(this.isNotNull(self.xhr.responseText)?self.xhr.responseText:self.xhr.response);
            }catch (e){
                self._lastResort.push(`[arsErrorList]: failed to parse ${e}`);
                self.messageType = 'non-ars';
            }
        }else{
            self.messageType = 'non-ars';
            self._message += '(error object not returned from ARServer)';
        }
    }
} // end parseXHR


} // end noiceRemedyAPIException class




/*
    noiceRemedyAPI({})
    it's da big one ...
        * proxypath ... need to explain that shit to the chil
*/
class noiceRemedyAPI extends noiceCoreNetworkUtility {


/*
    constructor({
        protocol:   http | https (default https)
        server:     <hostname>
        port:       <portNumber> (optionally specify a nonstandard port number)
        user:       <userId>
        password:   <password>
    })

    everything is optional, but if you wanna call *.authenticate, you've got
    to set at least server, user & pass either here, before you call *.authenticate
    or on the args to *.authenticate
*/
constructor (args){
    super(args, {
        _version:   2,
        _className: 'noiceRemedyAPI',
        debug:      false,
        protocol:   'https',
        timeout:    (60 * 1000 * 2)     // <-- 2 minute default timeout
    });

    // sort out the protocol and default ports
    switch (this.protocol){
        case 'https':
            if (! this.hasAttribute('port')){ this.port = 443; }
        break;
        case 'http':
            if (! this.hasAttribute('port')){ this.port = 80; }
        break;
        default:
            throw(new noiceRemedyAPIException({
                messageType:    'non-ars',
                message:        `unsupported protocol: ${this.protocol}`
            }));
    }

} // end constructor




/*
    isAuthenticated
    return true if we have an api session token, else false
*/
get isAuthenticated(){
    return(this.hasAttribute('token'));
}




/*
    authenticate({args})
        protocol:           http || https (default https -- should already be set on object, but overridable here)
        server:             <hostname> (str)
        port:               <portNumber> int (overridable here)
        user:               <userId>
    password:               <password>
*/
async authenticate(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    /*
        protocol, server, user & password are required.
        if missing from the function call, but extant on the
        object, use the object value, otherwise barf.
    */
    ['protocol','server','user','password', 'port'].forEach(function(arg){
        if (! (p.hasOwnProperty(arg) && self.isNotNull(p[arg]))){
            if (self.hasAttribute(arg)){
                p[arg] = self[arg];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${arg}`,
                    thrownByFunction:       'authenticate',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    // detail debug ...
    if (self.debug){ console.log(`[endpoint]: ${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/jwt/login`); }

    let authRespXHR = await self.fetch({
        endpoint:   `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/jwt/login`,
        method:     'POST',
        headers:  {
            "Content-Type":     "application/x-www-form-urlencoded",
            "Cache-Control":    "no-cache"
        },
        expectHtmlStatus: 200,
        timeout:       self.timeout,
        content:       `username=${p.user}&password=${p.password}`,
        encodeContent: false,
        timeout:       p.timeout
    }).catch(function(e){
        // hannle yo bidness down heeyuh
        e.thrownByFunction =    'authenticate';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });

    /*
        snag the auth token or die tryin' ...
        this is sneakier than it should have to be as *.hasOwnProperty
        does not work on XHR objects apparently. noice!
    */
    try {
        let tmp = authRespXHR.responseText;
        if (self.isNull(tmp)){ throw("null response"); }
        self.token = tmp;
        if (self.debug){ console.log(`[auth token]: ${self.token}`); }

        return(self);
    }catch(e){
        throw(new noiceRemedyAPIException({
            messageType:            'non-ars',
            message:                `authentication response does not contain token`,
            thrownByFunction:       'authenticate',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

} // end authenticate




/*
    logout()
    destroy the session token on the server
*/
async logout(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // if we're not authenticated, don't bother
    if (! self.isAuthenticated){
        if (self.debug){ console.log('[logout] call on object that is not authenticated. nothing to do.'); }
        return(true);
    }

    // we need a protocol, port, server, and token, either as args or on the object
    ['protocol', 'server', 'token', 'port'].forEach(function(a){
        if (! ((p.hasOwnProperty(a)) && (self.isNotNull(p[a])))){
            if (self.hasAttribute(a)){
                p[a] = self[a];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${a}`,
                    thrownByFunction:       'logout',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });
    if (self.debug){console.log(`[endpoint]: ${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/jwt/logout`); }
    let resp = await self.fetch({
        endpoint:           `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/jwt/logout`,
        method:             'POST',
        expectHtmlStatus:   204,
        timeout:            self.timeout,
        headers:  {
            "Authorization":    `AR-JWT ${p.token}`,
            "Cache-Control":    "no-cache",
            "Content-Type":     "application/x-www-form-urlencoded"
        }
    }).catch(function(e){
        e.thrownByFunction = 'logout';
        e.thrownByFunctionArgs = (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });
    delete(self.token);
    return(self);
} // end logout




/*
    getAttachment({

    })
*/
async getAttachment(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'getAttachment',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // flatten/check the args
    ['protocol', 'server', 'port', 'schema', 'ticket', 'fieldName'].forEach(function(f){
        if (!(p.hasOwnProperty(f) && self.isNotNull(p[f]))){
            if (self.hasAttribute(f)){
                p[f] = self[f];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${f}`,
                    thrownByFunction:       'getAttachment',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    if (self.debug){ console.log(`[getAttachment (endpoint)]: ${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1/entry/${encodeURIComponent(p.schema)}/${p.ticket}/attach/${encodeURIComponent(p.fieldName)}`)}

    // do it. do it. do it 'till ya satisfied
    let resp = await self.fetch({
        endpoint:           `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1/entry/${encodeURIComponent(p.schema)}/${p.ticket}/attach/${encodeURIComponent(p.fieldName)}`,
        method:             "GET",
        expectHtmlStatus:   200,
        timeout:            self.timeout,
        responseType:       'blob',
        headers:  {
            "Authorization":    `AR-JWT ${self.token}`,
        }
    }).catch(function(e){
        e.ThrownByFunction = 'getAttachment';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });

    // this'll be a raw binary array buffer ... just so ya know ...
    return(resp.response);

} // end getAttachment




/*
    query({
        schema:       <form name>
        fields:       [array, of, fieldnames, to, get, values, for] -- note add something for assoc stuff later
        QBE:          <QBE string>
        offset:       <return data from this row number -- for paging>
        limit:        <max number of rows to return>
        sort:         <see the docs. but basically <field>.asc or <field>.desc comma separated
    })
*/
async query(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'query',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // flatten/check the args
    ['protocol', 'server', 'port', 'schema', 'fields', 'QBE'].forEach(function(f){
        if (!(p.hasOwnProperty(f) && self.isNotNull(p[f]))){
            if (self.hasAttribute(f)){
                p[f] = self[f];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${f}`,
                    thrownByFunction:       'query',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    // default false value of fetchAttachments
    p.fetchAttachments = (p.hasOwnProperty('fetchAttachments') && p.fetchAttachments === true);

    // fields should be an object
    if (typeof p.fields !== 'object'){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `required argument missing: 'fields' is not an object!`,
            thrownByFunction:       'query',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // construct endpoints
    let url = `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1/entry/${encodeURIComponent(p.schema)}/?q=${encodeURIComponent(p.QBE)}&fields=values(${p.fields.join(",")})`;
    ['offset', 'limit', 'sort'].forEach(function(a){
        if ((p.hasOwnProperty(a)) && (self.isNotNull(p[a]))){
            url += `&${a}=${encodeURIComponent(p[a])}`;
        }
    });
    if (self.debug){ console.log(`[query (endpoint)]: ${url}`); }

    let resp = await self.fetch({
        endpoint:           url,
        method:             'GET',
        expectHtmlStatus:   200,
        timeout:            self.timeout,
        headers:  {
            "Authorization":    `AR-JWT ${self.token}`,
            "Content-Type":     "application/x-www-form-urlencoded",
            "Cache-Control":    "no-cache"
        },
        progressCallback:   p.hasOwnProperty('progressCallback')?p.progressCallback:null
    }).catch(function(e){
        e.thrownByFunction = 'query';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        console.log(e)
        throw(new noiceRemedyAPIException (e));
    });

    // parse the response
    let data;
    try {
        data = JSON.parse(resp.responseText);
    }catch(e){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `cannot parse server response (${JSON.stringify(resp).length}) bytes: ${e}`,
            thrownByFunction:       'query',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // fetch attachments
    if (p.fetchAttachments){
        let promiseKeeper = [];
        data.entries.forEach(function(row){
            if (row.hasOwnProperty('_links') && row._links.hasOwnProperty('self') && row._links.self[0].hasOwnProperty('href')){
                let parse = row._links.self[0].href.split('/');
                let ticket = parse[(parse.length -1)];

                // find attachment fields if there are any
                Object.keys(row.values).forEach(function(field){
                    if (self.isNotNull(row.values[field])){
                        if ((typeof(row.values[field]) == 'object') && row.values[field].hasOwnProperty('name') && row.values[field].hasOwnProperty('sizeBytes')){
                            if (self.debug){ console.log(`fetching attachment from record: ${ticket} and field: ${field} with size: ${row.values[field].sizeBytes} and filename: ${row.values[field].name}`); }
                            promiseKeeper.push(
                                self.getAttachment({
                                    schema:     p.schema,
                                    ticket:     ticket,
                                    fieldName:  field
                                }).then(function(dta){
                                    row.values[field].data = dta;
                                })
                            );
                        }
                    }
                });
            }
        });
        await Promise.all(promiseKeeper);
    }

    // send it back
    return(data);

} // end query




/*
    getTicket({
        schema:             <form name>
        ticket:             <ticket number>
        fields:             [array, of, fieldnames, to, get, values, for] -- note add something for assoc stuff later
        fetchAttachments:   true | false (default false). if true, fetch the binary data for attachments and include in .data
        progressCallback:   function(evt){ ... xhr progress event handler ... }
    })
*/
async getTicket(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'getTicket',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // flatten/check the args
    ['protocol', 'server', 'port', 'schema', 'fields', 'ticket'].forEach(function(f){
        if (!(p.hasOwnProperty(f) && self.isNotNull(p[f]))){
            if (self.hasAttribute(f)){
                p[f] = self[f];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${f}`,
                    thrownByFunction:       'getTicket',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    // we need fields to be an object of course
    if (typeof p.fields !== 'object'){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `required argument missing: 'fields' is not an object (${typeof(p.fields)})`,
            thrownByFunction:       'getTicket',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // default false value of fetchAttachments
    p.fetchAttachments = (p.hasOwnProperty('fetchAttachments') && p.fetchAttachments === true);

    let url = `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1/entry/${encodeURIComponent(p.schema)}/${p.ticket}/?fields=values(${p.fields.join(",")})`;
    if (self.debug){ console.log(`[getTicket (endpoint)]: ${url}`); }

    let resp = await self.fetch({
        endpoint:           url,
        method:             'GET',
        expectHtmlStatus:   200,
        timeout:            self.timeout,
        headers:  {
            "Authorization":    `AR-JWT ${self.token}`,
            "Content-Type":     "application/x-www-form-urlencoded",
            "Cache-Control":    "no-cache"
        },
        progressCallback:   (p.progressCallback instanceof Function)?p.progressCallback:null
    }).catch(function(e){
        e.thrownByFunction = 'getTicket';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });

    // parse the response
    let data;
    try {
        data = JSON.parse(resp.responseText);
    }catch(e){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `cannot parse server response (${JSON.stringify(resp).length}) bytes: ${e}`,
            thrownByFunction:       'getTicket',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // get dem attachments yo
    if (p.fetchAttachments){
        let promiseKeeper = [];
        Object.keys(data.values).forEach(function(field){
            if (self.isNotNull(row.values[field])){
                if ((typeof(data.values[field]) == 'object') && data.values[field].hasOwnProperty('name') && data.values[field].hasOwnProperty('sizeBytes')){
                    if (self.debug){ console.log(`fetching attachment from field: ${field} with size: ${data.values[field].sizeBytes} and filename: ${data.values[field].name}`); }
                    promiseKeeper.push(
                        self.getAttachment({
                            schema:     p.schema,
                            ticket:     p.ticket,
                            fieldName:  field
                        }).then(function(dta){
                            data.values[field].data = dta;
                        })
                    );
                }
            }
        });
        await Promise.all(promiseKeeper);
    }
    return(data);

} // end getTicket




/*
    createTicket({
        schema:         <formName>
        fields:         { ... },
        attachments:    { fieldName: {fileObject} ... }
    })
*/
async createTicket(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'createTicket',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // flatten/check the args
    ['protocol', 'server', 'port', 'schema', 'fields'].forEach(function(f){
        if (!(p.hasOwnProperty(f) && self.isNotNull(p[f]))){
            if (self.hasAttribute(f)){
                p[f] = self[f];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${f}`,
                    thrownByFunction:       'createTicket',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    // we need fields to be an object of course
    if (typeof p.fields !== 'object'){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `required argument missing: 'fields' is not an object (${typeof(p.fields)})`,
            thrownByFunction:       'createTicket',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    let url = `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1/entry/${encodeURIComponent(p.schema)}`;
    if (self.debug){ console.log(`[createTicket (endpoint)]: ${url}`); }

    let fetchArgs = {
        endpoint:           url,
        method:             'POST',
        expectHtmlStatus:   201,
        timeout:            self.timeout,
        content:            { values: p.fields },
        encodeContent:      true,
        headers:            {
            "Authorization":    `AR-JWT ${self.token}`,
            "Content-Type":     "application/json",
            "Cache-Control":    "no-cache"
        }
    };

    /*
        LOH -- 11/25/19 @ 1708
        don't forget to try and hack sending attachments on here.

        RESUME -- 8/9/21 @ 1220
        FINALLY ... the Rock has returned ... to ATTACHMENTS!
        here's how it works.

        1) send the filename as the value to your attachment field in the fields argument
        2) your attachments object should look like this

        {
            'attachmentFieldName': {
                name:     <filename>
                content:  <the content of the file>
                encoding: <optional>
            }
        }

        if you are sending ACTUAL binary data you're gonna have to use FileReader.readAsDataURL()
        see here:
            https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
        you are gonna need to lop some bs off the front of the string. like this:

            let fileBase64Content = reader.result.replace(/(.+)base64,/,'');

        then fileBase64Content above would become file.content in the attachments object
        NOTE you are going to have to specify:

            encoding: 'BASE64'

        if you pull such shenanigans. If you're sending ascii ... like a CSV for instance (wink wink)
        you can just set the string on file.content, and you don't have to specify the encoding
    */
    if (p.hasOwnProperty('attachments') && (p.attachments instanceof Object)){
        let separator = this.getGUID().replaceAll('-', '');
        let fieldsJSON = JSON.stringify({ values: p.fields });
        fetchArgs.content =
`
--${separator}
Content-Disposition: form-data; name="entry"
Content-Type: application/json; charset=UTF-8
Content-Transfer-Encoding: 8bit

${fieldsJSON}

`;
        let that = this;
        Object.keys(p.attachments).forEach(function(fileFieldName){
            let file = p.attachments[fileFieldName];
            let encoding = (file.hasOwnProperty('encoding'))?file.encoding:'binary';
            fetchArgs.content +=
`
--${separator}
Content-Disposition: form-data; name="attach-${fileFieldName}"; filename="attach-${file.name}"
Content-Type: application/octet-stream
Content-Transfer-Encoding: ${encoding}

${file.content}
--${separator}--
`;
        });

        fetchArgs.encodeContent = false;
        fetchArgs.headers["Content-Type"] = `multipart/form-data;boundary=${separator}`;

    } // end handling attachments


    // as you were!
    let resp = await self.fetch(fetchArgs).catch(function(e){
        e.thrownByFunction = 'createTicket';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });

    try {
        let tmp = resp.getResponseHeader('location').split('/');
        return({
            url:       resp.getResponseHeader('location'),
            entryId:   tmp[(tmp.length -1)]
        });
    }catch(e){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `failed to parse server response for record identification (create successful?): ${e}`,
            thrownByFunction:       'createTicket',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }
} // end createTicket




/*
    modifyTicket({
        schema:         <formName>,
        ticket:         <entryId>.
        fields:         {fieldName:fieldValue ... },
        attachments:    { fieldName: {fileObject} ... }
    });
*/
async modifyTicket(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'modifyTicket',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // flatten/check the args
    ['protocol', 'server', 'port', 'schema', 'fields', 'ticket'].forEach(function(f){
        if (!(p.hasOwnProperty(f) && self.isNotNull(p[f]))){
            if (self.hasAttribute(f)){
                p[f] = self[f];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${f}`,
                    thrownByFunction:       'modifyTicket',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    // we need fields to be an object of course
    if (typeof p.fields !== 'object'){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `required argument missing: 'fields' is not an object (${typeof(p.fields)})`,
            thrownByFunction:       'modifyTicket',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    let url = `${self.protocol}://${self.server}:${self.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1/entry/${encodeURIComponent(p.schema)}/${p.ticket}`;
    if (self.debug){ console.log(`[modifyTicket (endpoint)]: ${url}`); }

    let fetchArgs = {
        endpoint:           url,
        method:             'PUT',
        expectHtmlStatus:   204,
        timeout:            self.timeout,
        content:            { values: p.fields },
        encodeContent:      true,
        headers:  {
            "Authorization":    `AR-JWT ${self.token}`,
            "Content-Type":     "application/json",
            "Cache-Control":    "no-cache"
        }
    };


    /*
        handle attachments (see notes in createTicket -- same thing)
    */
    if (p.hasOwnProperty('attachments') && (p.attachments instanceof Object)){
        let separator = this.getGUID().replaceAll('-', '');
        let fieldsJSON = JSON.stringify({ values: p.fields });
        fetchArgs.content =
`
--${separator}
Content-Disposition: form-data; name="entry"
Content-Type: application/json; charset=UTF-8
Content-Transfer-Encoding: 8bit

${fieldsJSON}

`;
    let that = this;
    Object.keys(p.attachments).forEach(function(fileFieldName){
        let file = p.attachments[fileFieldName];
        let encoding = (file.hasOwnProperty('encoding'))?file.encoding:'binary';
        fetchArgs.content +=
`
--${separator}
Content-Disposition: form-data; name="attach-${fileFieldName}"; filename="attach-${file.name}"
Content-Type: application/octet-stream
Content-Transfer-Encoding: ${encoding}

${file.content}
--${separator}--
    `;
        });

        fetchArgs.encodeContent = false;
        fetchArgs.headers["Content-Type"] = `multipart/form-data;boundary=${separator}`;

    } // end handling attachments


    // as you were
    let resp = await self.fetch(fetchArgs).catch(function(e){
        e.thrownByFunction = 'modifyTicket';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });

    // guess it worked?
    return(true);
}




/*
    deleteTicket({
        schema:     <formName>,
        ticket:     <entryID>
    })
*/
async deleteTicket(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'deleteTicket',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // flatten/check the args
    ['protocol', 'server', 'port', 'schema', 'ticket'].forEach(function(f){
        if (!(p.hasOwnProperty(f) && self.isNotNull(p[f]))){
            if (self.hasAttribute(f)){
                p[f] = self[f];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${f}`,
                    thrownByFunction:       'deleteTicket',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    let url = `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1/entry/${encodeURIComponent(p.schema)}/${p.ticket}`;
    if (self.debug){ console.log(`[deleteTicket (endpoint)]: ${url}`); }

    let resp = await self.fetch({
        endpoint:           url,
        method:             'DELETE',
        expectHtmlStatus:   204,
        timeout:            self.timeout,
        headers:  {
            "Authorization":    `AR-JWT ${self.token}`,
            "Content-Type":     "application/json",
            "Cache-Control":    "no-cache"
        }
    }).catch(function(e){
        e.thrownByFunction = 'deleteTicket';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });

    // guess it worked, send back the ticket number we deleted why not?
    return(p.ticket);

    /*
        11/26/19 @ 1014
        y'know what'd be a cool feature would be an archive:<bool>
        argument, to have the thing fetch all the fields off the form
        before deleting and return that.

        dunno, gotta think on that.
        it might just be an entirely different meta function like
        archiveAndDelete() or something ...
    */
} // end deleteTicket




/*
mergeData({
    schema:                 <formName>
    fields:                 {fieldOne:valueOne, fieldTwo:valueTwo ...}
    QBE:                    <qualification> (optional)
    handleDuplicateEntryId: error | create | overwrite | merge | alwaysCreate (default error)
    ignorePatterns:         <bool> (default false)
    ignoreRequired:         <bool> (default false)
    workflowEnabled:        <bool> (default true)
    associationsEnabled:    <bool> (default true)
    multimatchOption:       error | useFirstMatching (default error)
})
*/
async mergeData(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'mergeData',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // flatten/check the args
    ['protocol', 'server', 'port', 'schema', 'fields'].forEach(function(f){
        if (!(p.hasOwnProperty(f) && self.isNotNull(p[f]))){
            if (self.hasAttribute(f)){
                p[f] = self[f];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${f}`,
                    thrownByFunction:       'mergeData',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    // we need fields to be an object of course
    if (typeof p.fields !== 'object'){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `required argument missing: 'fields' is not an object (${typeof(p.fields)})`,
            thrownByFunction:       'mergeData',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // validate handleDuplicateEntryId (default "error")
    let mergeTypeDecoder = {
        error:          "DUP_ERROR",
        create:         "DUP_NEW_ID",
        overwrite:      "DUP_OVERWRITE",
        merge:          "DUP_MERGE",
        alwaysCreate:   "GEN_NEW_ID"
    };
    if (!((p.hasOwnProperty('handleDuplicateEntryId')) && self.isNotNull(p.handleDuplicateEntryId) && (Object.keys(mergeTypeDecoder).indexOf(p.handleDuplicateEntryId) >= 0))){
        p.handleDuplicateEntryId = 'error';
    }

    // validate multimatchOption (default "error")
    let multimatchOptionDecoder = {
        error:              0,
        useFirstMatching:   1
    };
    if (!((p.hasOwnProperty('multimatchOption')) && self.isNotNull(p.multimatchOption) && (Object.keys(multimatchOptionDecoder).indexOf(p.multimatchOption) >= 0))){
        p.multimatchOption = 'error';
    }

    // she.done.already.done.had.herses
    let url = `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1/mergeEntry/${encodeURIComponent(p.schema)}`;
    if (self.debug){ console.log(`[mergeData (endpoint)]: ${url}`); }

    let body = {
        values:         p.fields,
        mergeOptions:   {
            mergeType:              mergeTypeDecoder[p.handleDuplicateEntryId],
            multimatchOption:       multimatchOptionDecoder[p.multimatchOption],
            ignorePatterns:         (p.hasOwnProperty('ignorePatterns') && p.ignorePatterns === true),
            ignoreRequired:         (p.hasOwnProperty('ignoreRequired') && p.ignoreRequired === true),
            workflowEnabled:        (! (p.hasOwnProperty('workflowEnabled') && p.workflowEnabled === true)),
            associationsEnabled:    (! (p.hasOwnProperty('associationsEnabled') && p.associationsEnabled === true))
        }
    };
    if (p.hasOwnProperty('QBE') && (self.isNotNull(p.QBE))){ body.qualification = p.QBE; }

    let resp = await self.fetch({
        endpoint:           url,
        method:             'POST',
        expectHtmlStatus:   [201, 204],
        timeout:            self.timeout,
        headers: {
            "Authorization":    `AR-JWT ${self.token}`,
            "Content-Type":     "application/json",
            "Cache-Control":    "no-cache"
        },
        content: body,
        encodeContent: true
    }).catch(function(e){
        e.thrownByFunction = 'mergeData';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });

    try {
        let parse = resp.getResponseHeader('location').split('/');
        return({
            url:        resp.getResponseHeader('location'),
            entryId:    parse[(parse.length -1)]
        });
    }catch (e){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `failed to parse server response for record identification (create successful?): ${e}`,
            thrownByFunction:       'mergeData',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }
} // end mergeData




/*
    getFormFields({
        schema: <schemaName>
    })
    https://docs.bmc.com/docs/ars2002/endpoints-in-ar-rest-api-909638176.html
*/
async getFormFields(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'getFormFields',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // flatten/check the args
    ['protocol', 'server', 'port', 'schema'].forEach(function(f){
        if (!(p.hasOwnProperty(f) && self.isNotNull(p[f]))){
            if (self.hasAttribute(f)){
                p[f] = self[f];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${f}`,
                    thrownByFunction:       'getFormFields',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    let url = `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1.0/fields/${encodeURIComponent(p.schema)}`;
    if (self.debug){ console.log(`[getFormFields (endpoint)]: ${url}`); }

    let resp = await self.fetch({
        endpoint:           url,
        method:             'GET',
        expectHtmlStatus:   200,
        timeout:            self.timeout,
        headers:  {
            "Authorization":    `AR-JWT ${self.token}`,
            "Content-Type":     "application/json",
            "Cache-Control":    "no-cache"
        }
    }).catch(function(e){
        e.thrownByFunction = 'getFormFields';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });
    try {
        let tmp = JSON.parse(resp.responseText);
        let formDefinition = {idIndex: {}, nameIndex: {}};
        tmp.forEach(function(field){
            formDefinition.idIndex[field.id] = field;
            formDefinition.nameIndex[field.name] = field;
        });
        return(formDefinition);
    }catch(e){
        throw(e);
    }
}




/*
    getFormOptions({
        schema: <schemaName>
    })
    https://docs.bmc.com/docs/ars2002/endpoints-in-ar-rest-api-909638176.html
    well ... ok ... I'm not sure how this is useful?
    but it's in the docs, so why not ...
*/
async getFormOptions(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'getFormFields',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // flatten/check the args
    ['protocol', 'server', 'port', 'schema'].forEach(function(f){
        if (!(p.hasOwnProperty(f) && self.isNotNull(p[f]))){
            if (self.hasAttribute(f)){
                p[f] = self[f];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${f}`,
                    thrownByFunction:       'getFormOptions',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    let url = `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1.0/entry/${encodeURIComponent(p.schema)}`;
    if (self.debug){ console.log(`[getFormOptions (endpoint)]: ${url}`); }

    let resp = await self.fetch({
        endpoint:           url,
        method:             'OPTIONS',
        expectHtmlStatus:   200,
        timeout:            self.timeout,
        headers:  {
            "Authorization":    `AR-JWT ${self.token}`,
            "Content-Type":     "application/json",
            "Cache-Control":    "no-cache"
        }
    }).catch(function(e){
        e.thrownByFunction = 'getFormOptions';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });
    return(resp.responseText);
}




/*
    getMenu({name: <menuName>})
    returns meta-data about the specified menu
    use getMenuValues() to get the actual menu content

    see this (strangely detailed for BMC) documentation:
    https://docs.bmc.com/docs/ars2002/example-of-using-the-rest-api-to-retrieve-menu-details-909638136.html

    some notes about return data struct: {
        menu_type:      <Query|...>
        refresh_code:   <?>
        menu_information: {
            qualification_current_fields: [ fieldId, ... ],
            qualification_keywords: [ keyWord ... ]
        }
    }

    menu_information.qualification_current_fields contains an array of the field_id's you can replace in the qualification
    this array will be null if you have a menu with no qualification replacement inputs

    <root>.qualification_string contains the verbatim QBE in the menu definition so I guess you could parse it if ya want

    menu_information.qualification_keywords seems to be the same thing for keywords, which I've never fully understood anyhow

    menu_type will be one of these:
        Sql     (yes, really initcapped)
        Search
        File
        DataDictionary
        List   (aka "Character Manu")

    refresh_codes:
        1:  On Connect
        2:  On Open
        3:  On 15 Minute Interval


*/
async getMenu(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'getMenu',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // flatten/check the args
    ['protocol', 'server', 'port', 'name'].forEach(function(f){
        if (!(p.hasOwnProperty(f) && self.isNotNull(p[f]))){
            if (self.hasAttribute(f)){
                p[f] = self[f];
            }else{
                throw(new noiceRemedyAPIException ({
                    messageType:            'non-ars',
                    message:                `required argument missing: ${f}`,
                    thrownByFunction:       'getMenu',
                    thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
                }));
            }
        }
    });

    let url = `${p.protocol}://${p.server}:${p.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1.0/menu/${encodeURIComponent(p.name)}`;
    if (self.debug){ console.log(`[getMenu (endpoint)]: ${url}`); }

    let resp = await self.fetch({
        endpoint:           url,
        method:             'GET',
        expectHtmlStatus:   200,
        timeout:            self.timeout,
        headers:  {
            "Authorization":    `AR-JWT ${self.token}`,
            "Content-Type":     "application/json",
            "Cache-Control":    "no-cache"
        }
    }).catch(function(e){
        e.thrownByFunction = 'getMenu';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });
    return(resp.responseText);
}




/*
    getMenuValues({
        name:   <menuName>,
        qualification_substitute_info: { <object> }
    })

    there's not a lot of detail about qualification_substitute_info
    in the documentation but this is the example given there, so one
    presumes at least form_name:<str>, field_values:{}, and keyword_values:{}
    keys are supported.

        qualification_substitute_info: {
            form_name: "TestForm_dfb88",
            field_values: {
              "536870915": 100
            },
            keyword_values: {
              "USER": "Demo"
            }
        }

    TRIAL & ERROR ANECTODE:
    form_name needs to be the form owning the field values that you wish to replace in the qualification.
    For instance if you've got a menu with a qualification like this from the recipe demo:

        [primary ui form]           noice:demo:recipe
        [supporting table form]     noice:demo:recipe:ingredient

    now say on your primary form you have a field: 536870919
    and on a menu you have a qualification like this: 'recipe Entry ID' = $536870919$
    where 'recipe Entry ID' is the foreign key on your supporting table that links the rows to the parent

    NOW ... say you want to retrieve the ingredient list for the noice:demo:recipe row where '1' = "000000000000003"

    this will work:
    qualification_substitute_info: {
        form_name: 'noice:demo:recipe',
       	field_values: {
          '536870919': "000000000000003"
        }
      }

    NOTE: some things:

        1) you can't use the system field '1' [Entry ID] in the menu qualification
           it'll work inside ARS, but the API will return an empty string. that's why
           I created a BS field: 536870919. System fields need not apply, but I suspect
           the bug is more sinister ... any field-id replicated between your supposed "calling"
           form (even though the menu would have no concept of that), and your data target form
           gets total confusion server side. I'll guarantee it like the men's warehouse.

        2) the menu points at noice:demo:recipe:ingredient, but you have to specify
           the form from which you might call the menu, which is the form with the BS
           field on it: 536870919, that is noice:demo:recipe. Which makes NO DAMN SENSE
           but ok, BMC ...

    some more things. hooo boy, the return data structure is fun AF!
    here's one with two 'Label Fields' specified.
    {
        items: [
            {
                type:   <SubMenu|?>
                label:  <string menu entry value>,
                content: [
                    {
                        type:   <Value|?>
                        label:  <string menu entry value>,
                        value:  <associated value>
                    }
                ]
            },
            ...
        ]
    }
    basically type gets "SubMenu" or "Value". If there's just one field in the 'Label Fields' section
    it looks like this:
    {
        items: [
            {
                type: 'Value',
                label:  <string>
                value: <string>
            }
        ]
    }
*/
async getMenuValues(p){
    let self = this;
    if (typeof p === 'undefined'){ p = {}; }

    // bounce if we're not authenticated
    if (! this.isAuthenticated){
        throw(new noiceRemedyAPIException ({
            messageType:            'non-ars',
            message:                `api handle is not authenticated`,
            thrownByFunction:       'getMenuValues',
            thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
        }));
    }

    // check the args
    ['name'].forEach(function(f){
        if (!(p.hasOwnProperty(f))){
            throw(new noiceRemedyAPIException ({
                messageType:            'non-ars',
                message:                `required argument missing: ${f}`,
                thrownByFunction:       'getMenuValues',
                thrownByFunctionArgs:   (typeof(p) !== 'undefined')?p:{}
            }));
        }
    });

    let url = `${self.protocol}://${self.server}:${self.port}${(self.hasAttribute('proxyPath'))?self.proxyPath:''}/api/arsys/v1.0/menu/expand`;
    if (self.debug){ console.log(`[getMenuValues (endpoint)]: ${url}`); }

    let resp = await self.fetch({
        endpoint:           url,
        method:             'POST',
        expectHtmlStatus:   200,
        timeout:            self.timeout,
        encodeContent:      true,
        content:            p,
        headers:  {
            "Authorization":    `AR-JWT ${self.token}`,
            "Content-Type":     "application/json",
            "Cache-Control":    "no-cache"
        },
    }).catch(function(e){
        e.thrownByFunction = 'getMenuValues';
        e.thrownByFunctionArgs =   (typeof(p) !== 'undefined')?p:{}
        throw(new noiceRemedyAPIException (e));
    });
    return(resp.responseText);
}




/*
    getFormDefinitions({
        schemaList: [],
        progressCallback: <function(currentSchema, message, percentComplete)>
    })

    schemaList array is a list of <schemaName> values

    progressCallback (if specified) is periodically called with these args:
        currentSchema:   the value in <schemaList> currently processing
        message:         arbitrary string
        percentComplete: a nuber you can use to drive a progress display

    this will execute getFormFields() against each one but will
    also descend each form and retrieve any referenced menus
    or other schemas referenced by Table fields

    LOH 10/13/21 @ 1603
*/



} // end noiceRemedyAPI class
