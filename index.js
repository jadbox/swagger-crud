var parser = require("swagger-parser");
var _       = require("lodash");
var fs = require("fs");

exports.crudify = function(file) {
  var file_contents = JSON.parse(fs.readFileSync(file));

  var apis = [];// file_contents.apis;
  var models = file_contents.models;
  _.forEach(models, function(model, k) {
    var api = {};
    api.path = "/" + k;
    api.operations = [];

    var idAnyFound = false;
    var operation = {
      method: "GET",
      summary: "Fetch " + k,
      type: k,
      parameters: []
    }

    //console.log(k);
    var idFound = false;
      _.forEach(model.properties, function(prop, pk) {
        if(pk !== "id" && pk !== "uuid" && pk !== "uid" && pk !== "key") return;
        idFound = idAnyFound = true;
        operation.parameters.push({
          name: pk,
          description: prop.description,
          paramType: "query",
          type: prop.type
        });
      });
      if(idFound) api.operations.push(operation);

      if(idAnyFound) apis.push(api);
  });


  file_contents.apis = apis;
  fs.writeFileSync("out.json", JSON.stringify(file_contents, null, '\t'));
/*
  parser.parse(file_contents, {parseYaml:false}, function(err, api, metadata) {
    if (!err) {
      console.log(api.models);
      return;
      console.log("API name: %s, Version: %s", api.info.title, api.info.version);
    }
    else throw new Error(err);
  });
  */
}
if(!module.parent) {
  exports.crudify("account.json");
}

/*
{
    "path": "/account/{email}",
    "operations": [
        {
            "method": "HEAD",
            "summary": "Checks if an account exists",
            "notes": "This method requires no authentication.",
            "type": "void",
            "nickname": "checkAccount",
            "parameters": [
                {
                    "name": "email",
                    "description": "The account email.",
                    "required": true,
                    "type": "string",
                    "paramType": "path"
                }
            ],
            "responseMessages": [
                {
                    "code": 404,
                    "message": "The specified account cannot be found."
                }
            ]
        },
        {
            "method": "GET",
            "summary": "Retrieves an account metadata",
            "notes": "This method requires a valid API token which has been generated for the same account specified in the request.",
            "type": "Account",
            "nickname": "getAccountMetadata",
            "parameters": [
                {
                    "name": "email",
                    "description": "The account email.",
                    "required": true,
                    "type": "string",
                    "paramType": "path"
                },
                {
                    "name": "token",
                    "description": "An API token generated for the specified account.",
                    "required": true,
                    "type": "string",
                    "paramType": "query"
                }
            ],
            "responseMessages": [
                {
                    "code": 400,
                    "message": "Bad request: a parameter is missing or invalid.",
                    "responseModel": "Error"
                },
                {
                    "code": 401,
                    "message": "Unauthorized: the specified API token is invalid or expired.",
                    "responseModel": "Error"
                },
                {
                    "code": 404,
                    "message": "The specified account cannot be found.",
                    "responseModel": "Error"
                },
                {
                    "code": 500,
                    "message": "An internal error occurred during the processing of the request.",
                    "responseModel": "Error"
                }
            ]
        },
        */
