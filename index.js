#!/usr/bin/env node
/*eslint quotes: [0, "single"], curly: 0, new-cap:1, eqeqeq:1, no-process-exit:0, no-loop-func:1, no-unreachable:1, camelcase:0, noempty:0, dot-notation:0, no-underscore-dangle:0, eol-last:0*/
/*eslint-disable no-console */
/*eslint-env node */
var parser = require("swagger-parser");
var _       = require("lodash");
var fs = require("fs");
var path = require("path");

exports.crudify = function(file, outfile, removeapis) {
  file = path.join(process.cwd(), file);
  outfile = path.join(process.cwd(), outfile);

  var file_contents = JSON.parse(fs.readFileSync(file));
  if(parseInt(file_contents.swaggerVersion) < 2) crudify_v1(file_contents, removeapis);
  else crudify_v2(file_contents, removeapis);

  fs.writeFileSync(outfile, JSON.stringify(file_contents, null, '\t'));
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
};


if(!module.parent) {
  exports.crudify("account.json", "out.json");
}

function crudify_v2(file_contents, removeapis) {
  //console.log("=== Swagger v2 spec WIP ===");
  if(!file_contents.paths) file_contents.paths = {};
  var apis = removeapis ? {} : file_contents.paths;
  if(removeapis) delete file_contents.apis; // legecy
  var models = file_contents.definitions;

  // FOR EACH MODEL (unique path, operations)
  _.forEach(models, function(model, k) {
    var api = {};

    var operations = [];

    // Create
    operations.push( {
      method: "POST",
      summary: "Create " + k,
      operationId: "create" + _.capitalize(k),
      "x-swagger-router-controller": "create" + _.capitalize(k),
      responses: {'200': {description: 'success', 'schema': {'$ref':'#/definitions/'+k}  } },
      parameters: []
    } );

    // Update field (or all fields)
    operations.push( {
      method: "PATCH",
      summary: "Update to " + k,
      operationId: "update" + _.capitalize(k),
      "x-swagger-router-controller": "update" + _.capitalize(k),
      responses: {'200': {description: 'success', 'schema': {'$ref':'#/definitions/'+k}  } },
      parameters: []
    } );

    //console.log(k);
    var idFound = false;
    var keyName, keyNode;
    // FOR EACH MODEL PROPERTY
    _.forEach(model.properties, function(prop, pk) {
        if(pk.indexOf("_id") !== -1 || pk === "id" || pk === "uuid" || pk === "uid" || pk === "key") {
          keyName = pk;
          keyNode = prop;
          idFound = true;
        }

        _.forEach(operations, function(operation) {
          var param = {
            name: pk,
            description: prop.description,
            'in': "query",
            type: prop.type,
            required: operation.method === "PATCH" ? false : true
          };
          if(!param.required) delete param.required;
          operation.parameters.push(param);
      });




    });

    if(!idFound) return;
    // get by id, uuid, key
    operations.push( {
      method: "GET",
      summary: "Fetch " + k,
      operationId: "get" + _.capitalize(k),
      "x-swagger-router-controller": "get" + _.capitalize(k),
      responses: {'200': {description: 'success', 'schema': {'$ref':'#/definitions/'+k}  } },
      parameters: [{
        name: keyName,
        description: keyNode.description,
        'in': "query",
        type: keyNode.type
      }]
    } );

    // Delete the model
    operations.push( {
      method: "DELETE",
      summary: "Delete " + k,
      operationId: "delete" + _.capitalize(k),
      "x-swagger-router-controller": "delete" + _.capitalize(k),
      responses: {'200': {description: 'success' } },
      parameters: [{
        name: keyName,
        description: keyNode.description,
        'in': "query",
        type: keyNode.type
      }]
    } );

    //======== diff
    _.forEach(operations, function(operation) {
      var method = operation.method.toLowerCase();
      delete operation.method;
      api[method] = operation;
    });
    //api.operations = operations; //merge

    apis["/" + k.toLowerCase()] = api;
  });

  file_contents.paths = apis;
}
//=============================================================================
function crudify_v1(file_contents, removeapis) {
  if(!file_contents.apis) file_contents.apis = [];
  var apis = removeapis ? [] : file_contents.apis;
  var models = file_contents.models;

  // FOR EACH MODEL (unique path, operations)
  _.forEach(models, function(model, k) {
    var api = {};
    api.path = "/" + k;
    api.operations = [];

    var operations = [];

    // Create
    operations.push( {
      method: "POST",
      summary: "Create " + k,
      nickname: "create" + _.capitalize(k),
      type: k,
      parameters: []
    } );

    // Update field (or all fields)
    operations.push( {
      method: "PATCH",
      summary: "Update to " + k,
      nickname: "update" + _.capitalize(k),
      type: k,
      parameters: []
    } );

    //console.log(k);
    var idFound = false;
    var keyName, keyNode;
    // FOR EACH MODEL PROPERTY
    _.forEach(model.properties, function(prop, pk) {
        if(pk.indexOf("_id") !== -1 || pk === "id" || pk === "uuid" || pk === "uid" || pk === "key") {
          keyName = pk;
          keyNode = prop;
          idFound = true;
        }

        _.forEach(operations, function(operation) {
          var param = {
            name: pk,
            description: prop.description,
            paramType: "query",
            type: prop.type,
            required: operation.method === "PATCH" ? false : true
          };
          if(!param.required) delete param.required;
          operation.parameters.push(param);
      });




    });

    if(!idFound) return;
    // get by id, uuid, key
    operations.push( {
      method: "GET",
      summary: "Fetch " + k,
      nickname: "get" + _.capitalize(k),
      type: k,
      parameters: [{
        name: keyName,
        description: keyNode.description,
        paramType: "query",
        type: keyNode.type
      }]
    } );

    // Delete the model
    operations.push( {
      method: "DELETE",
      summary: "Delete " + k,
      nickname: "delete" + _.capitalize(k),
      type: k,
      parameters: [{
        name: keyName,
        description: keyNode.description,
        paramType: "query",
        type: keyNode.type
      }]
    } );
    api.operations = operations; //merge
    apis.push(api);

  });

  file_contents.apis = apis;
}
