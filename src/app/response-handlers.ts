// ------------------------------------------------------------------------------
//  Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.  See License in the project root for license information.
// ------------------------------------------------------------------------------

import { getJsonViewer, getAceEditorFromElId } from "./api-explorer-jseditor"
import { AppComponent } from "./app.component";

export function showResults(results, responseContentType) {
    getJsonViewer().setValue("");    
    getJsonViewer().getSession().insert(0, results);
    if (responseContentType)
        getJsonViewer().getSession().setMode("ace/mode/" + responseContentType);
}

export function insertHeadersIntoResponseViewer(headers:Headers) {
    if (!headers) return; // prevents foreach of undefined error

    // format headers
    let headersArr = [];
    headers.forEach((headerValue, headerKey) => {
        headersArr.push(headerKey + ": " + headerValue);
    })

    getAceEditorFromElId("response-header-viewer").getSession().setValue("");
    getAceEditorFromElId("response-header-viewer").getSession().insert(0, headersArr.join("\n"));
}

export function handleImageResponse(method:any, headers, status, handleUnsuccessfulQueryResponse) {
    method('GET_BINARY', AppComponent.explorerValues.endpointUrl).then((result) => {
        let blob = new Blob( [ result.arrayBuffer() ], { type: "image/jpeg" } );
        let imageUrl = window.URL.createObjectURL( blob );

        const imageResultViewer = <HTMLImageElement>document.getElementById("responseImg");
        imageResultViewer.src = imageUrl;
        AppComponent.explorerValues.showImage = true;

        insertHeadersIntoResponseViewer(result.headers);
    }, handleUnsuccessfulQueryResponse);
}

export function handleHtmlResponse(results) {
    showResults(results, "html");
}

export function handleJsonResponse(results) {
    results = JSON.stringify(results, null, 4);
    showResults(results, "json");
}

export function handleXmlResponse(results) {
    results = formatXml(results);
    showResults(results, "xml");
}

export function isImageResponse(headers:Headers) {
    var contentType = getContentType(headers);
    return contentType === "application/octet-stream" || contentType.substr(0, 6) === "image/";
}

export function isHtmlResponse(headers:Headers) {
    var contentType = getContentType(headers);
    return contentType === "text/html" || contentType === "application/xhtml+xml";
}

export function isXmlResponse(results) {
    // Don't use headers since xml could be of a million content types.
    return JSON.stringify(results, null, 4).indexOf("<?xml") != -1;
}

export function isJsonResponse(headers:Headers) {
    var contentType = getContentType(headers);
    return contentType === "application/json";
}

export function getContentType(headers:Headers) {
    var full = headers.get("content-type");
    var delimiterPos = full.indexOf(";");
    if (delimiterPos != -1) {
        return full.substr(0, delimiterPos);
    } else {
        return full;
    }
}

// from swagger-js
var formatXml = function(xml) {
    console.log(1)
    var contexp, fn, formatted, indent, l, lastType, len, lines, ln, pad, reg, transitions, wsexp;
    reg = /(>)(<)(\/*)/g;
    wsexp = /[ ]*(.*)[ ]+\n/g;
    contexp = /(<.+>)(.+\n)/g;
    xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
    pad = 0;
    formatted = '';
    lines = xml.split('\n');
    indent = 0;
    lastType = 'other';
    transitions = {
      'single->single': 0,
      'single->closing': -1,
      'single->opening': 0,
      'single->other': 0,
      'closing->single': 0,
      'closing->closing': -1,
      'closing->opening': 0,
      'closing->other': 0,
      'opening->single': 1,
      'opening->closing': 0,
      'opening->opening': 1,
      'opening->other': 1,
      'other->single': 0,
      'other->closing': -1,
      'other->opening': 0,
      'other->other': 0
    };
    fn = function(ln) {
      var fromTo, j, key, padding, type, types, value;
      types = {
        single: Boolean(ln.match(/<.+\/>/)),
        closing: Boolean(ln.match(/<\/.+>/)),
        opening: Boolean(ln.match(/<[^!?].*>/))
      };
      type = ((function() {
        var results;
        results = [];
        for (key in types) {
          value = types[key];
          if (value) {
            results.push(key);
          }
        }
        return results;
      })())[0];
      type = type === void 0 ? 'other' : type;
      fromTo = lastType + '->' + type;
      lastType = type;
      padding = '';
      indent += transitions[fromTo];
      padding = ((function() {
        var m, ref1, results;
        results = [];
        for (j = m = 0, ref1 = indent; 0 <= ref1 ? m < ref1 : m > ref1; j = 0 <= ref1 ? ++m : --m) {
          results.push('  ');
        }
        return results;
      })()).join('');
      if (fromTo === 'opening->closing') {
        formatted = formatted.substr(0, formatted.length - 1) + ln + '\n';
      } else {
        formatted += padding + ln + '\n';
      }
    };
    for (l = 0, len = lines.length; l < len; l++) {
      ln = lines[l];
      fn(ln);
    }
    return formatted;
  };

