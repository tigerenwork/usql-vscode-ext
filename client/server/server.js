/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var vscode_languageserver_1 = require('vscode-languageserver');
var util_1 = require('./features/util');
// Create a connection for the server. The connection uses Node's IPC as a transport
var connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
var content;
// Create a simple text document manager. The text document manager
// supports full document sync only
var documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Create electron-edge 
/*
let edge = require('electron-edge');

let get_completion_list = edge.fun({
    assemblyFile:'c:\\Program Files (x86)\\Microsoft VS Code\\ScopeSymbolManagerWrapper.dll',
    typeName:'ScopeSymbolManagerWrapper.SymbolManagerWrapper',
    methodName:'GetSymbolListAsync'
});*/
// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites. 
var workspaceRoot;
connection.onInitialize(function (params) {
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind,
            // Tell the client that the server support code complete
            completionProvider: {
                resolveProvider: true
            }
        }
    };
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(function (change) {
    validateTextDocument(change.document);
});
// hold the maxNumberOfProblems setting
var maxNumberOfProblems;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration(function (change) {
    var settings = change.settings;
    maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100;
    // Revalidate any open text documents
    documents.all().forEach(validateTextDocument);
});
function validateTextDocument(textDocument) {
    var diagnostics = [];
    var lines = textDocument.getText().split(/\r?\n/g);
    var problems = 0;
    for (var i = 0; i < lines.length && problems < maxNumberOfProblems; i++) {
        var line = lines[i];
        var index = line.indexOf('typescript');
        if (index >= 0) {
            problems++;
            diagnostics.push({
                severity: vscode_languageserver_1.DiagnosticSeverity.Warning,
                range: {
                    start: { line: i, character: index },
                    end: { line: i, character: index + 10 }
                },
                message: line.substr(index, 10) + " should be spelled TypeScript",
                source: 'ex'
            });
        }
    }
    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: diagnostics });
}
connection.onDidChangeWatchedFiles(function (change) {
    // Monitored files have change in VSCode
    connection.console.log('We recevied an file change event');
});
// This handler provides the initial list of the completion items.
connection.onCompletion(function (textDocumentPosition) {
    // The pass parameter contains the position of the text document in 
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    // For test only 
    connection.console.log('[Server] Start getting the assembly');
    var edge = require('electron-edge');
    var fun2 = edge.func({
        assemblyFile: 'D:\\Src\\ScopeSymbolManagerWrapper\\WrapperUT\\bin\\Debug\\ScopeSymbolManagerWrapper.dll',
        typeName: 'ScopeSymbolManagerWrapper.SymbolManagerWrapper',
        methodName: 'GetCompletionListAsync'
    });
    connection.console.log('[Server] begin to get the file path');
    var usqlScriptPath = util_1.util.ConvertUriToPath(textDocumentPosition.textDocument.uri);
    connection.console.log(usqlScriptPath);
    var startPoint = content.length;
    var payload = {
        Path: usqlScriptPath,
        Source: content,
        Start: (startPoint - 1).toString()
    };
    connection.console.log('[Server] Start getting completion list');
    fun2(payload, function (error, result) {
        if (error) {
            connection.console.log('[Server] call symbol manager failed');
            throw error;
        }
        else {
            connection.console.log(result);
            var completionList = [];
            var i = 1;
            result.forEach(function (element) {
                completionList.push({
                    label: element.Text,
                    kind: vscode_languageserver_1.CompletionItemKind.Text,
                    data: i
                });
                i = i + 1;
            });
            return completionList;
        }
    });
    return [
        {
            label: 'CREATE',
            kind: vscode_languageserver_1.CompletionItemKind.Text,
            data: 1
        },
        {
            label: 'Good',
            kind: vscode_languageserver_1.CompletionItemKind.Class,
            data: 2
        }
    ];
});
// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve(function (item) {
    if (item.data === 1) {
        item.detail = 'TypeScript details',
            item.documentation = 'TypeScript documentation';
    }
    else if (item.data === 2) {
        item.detail = 'JavaScript details',
            item.documentation = 'JavaScript documentation';
    }
    return item;
});
/*
connection.onDidOpenTextDocument((params) => {
    // A text document got opened in VSCode.
    // params.uri uniquely identifies the document. For documents store on disk this is a file URI.
    // params.text the initial full content of the document.
    connection.console.log(`${params.uri} opened.`);
});
*/
connection.onDidChangeTextDocument(function (params) {
    // The content of a text document did change in VSCode.
    // params.uri uniquely identifies the document.
    // params.contentChanges describe the content changes to the document.
    //connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
    //connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
    content = params.contentChanges[0].text;
});
/*
connection.onDidCloseTextDocument((params) => {
    // A text document got closed in VSCode.
    // params.uri uniquely identifies the document.
    connection.console.log(`${params.uri} closed.`);
});
*/
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map