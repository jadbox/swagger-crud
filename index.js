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
  if(parseInt(file_contents.apiVersion) < 2) crudify_v1(file_contents, removeapis);
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
}


if(!module.parent) {
  exports.crudify("account.json", "out.json");
}

function crudify_v2(file_contents, removeapis) {
  console.log("=== Swagger v2 spec NOT supported yet ===");
}
//===============
function crudify_v1(file_contents, removeapis) {
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
        if(pk === "id" || pk === "uuid" || pk === "uid" || pk === "key") {
          keyName = pk;
          keyNode = prop;
          idFound = true;
        }

        _.forEach(operations, function(operation) {
          operation.parameters.push({
            name: pk,
            description: prop.description,
            paramType: "query",
            type: prop.type,
            required: operation.method === "PATCH" ? false : true
          });
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
