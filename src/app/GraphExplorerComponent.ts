// ------------------------------------------------------------------------------
//  Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.  See License in the project root for license information.
// ------------------------------------------------------------------------------

import { getString } from "./localization-helpers";
import { AppComponent } from "./app.component";
import { ExplorerValues, GraphApiCall, SampleQuery, GraphRequestHeader, substituePostBodyTokens, substitueTokens } from "./base";
import { getRequestBodyEditor } from "./api-explorer-jseditor";
import { RequestEditorsComponent } from "./request-editors.component";
import { isAuthenticated as isAuthHelper } from "./auth";


export class GraphExplorerComponent {

  explorerValues = AppComponent.explorerValues;

  getStr(label:string):string {
    return getString(AppComponent.Options, label) || "*****" + label ;
  }

  getAssetPath(relPath:string):string {
    return AppComponent.Options.PathToBuildDir + "/" + relPath;
  }

  // used in sidebar and panel
  getRequestHistory = (limit?:number):GraphApiCall[] => {
      if (limit) return AppComponent.requestHistory.slice(0, limit);

      return AppComponent.requestHistory;
  }

  isAuthenticated() {
    return isAuthHelper();
  }
  
  loadQueryIntoEditor(originalQuery:GraphApiCall) {
    // prevent logged out users from POSTing/others
    if (!this.isAuthenticated() && originalQuery.method != 'GET') {
      return;
    }

    AppComponent.clearResponse();


      // copy the sample query or history item so we're not changing history/samples
      let query:SampleQuery = jQuery.extend(true, {}, originalQuery);


    // replace endpoint URL with tokens
      if (!this.isAuthenticated())
        substitueTokens(query);
    
      AppComponent.explorerValues.endpointUrl = query.requestUrl;
      AppComponent.explorerValues.selectedOption = query.method;

      if (query.headers) {
        AppComponent.explorerValues.headers = query.headers;
      } else {
        AppComponent.explorerValues.headers = []
      }

      this.shouldEndWithOneEmptyHeader();

      AppComponent.explorerValues.postBody = "";
      let postBodyEditorSession = getRequestBodyEditor().getSession();
      if (query.postBody) {
        substituePostBodyTokens(query);

        let rawPostBody = query.postBody;

        // try to format the post body

        let formattedPostBody;
        try {
          formattedPostBody = JSON.stringify(JSON.parse(rawPostBody), null, 2);
        } catch (e) {
          console.log("Can't format JSON post body");
        }

        AppComponent.explorerValues.postBody = formattedPostBody || rawPostBody;
      }

      postBodyEditorSession.setValue(AppComponent.explorerValues.postBody);


  }
  shouldEndWithOneEmptyHeader() {
    let lastHeader = this.getLastHeader();
    if (lastHeader && lastHeader.name == "" && lastHeader.value == "") {
      return;
    } else {
      this.addEmptyHeader();
    }
  }

  addEmptyHeader() {
      AppComponent.explorerValues.headers.push({
          name: "",
          value: ""
      })
  }

  getLastHeader():GraphRequestHeader {
      return this.explorerValues.headers[this.explorerValues.headers.length - 1]
  }

}