/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentIdentifier,
	CompletionItem, CompletionItemKind, TextDocumentPositionParams, Position
} from 'vscode-languageserver';
import {util} from './features/util';
import {DocContent} from './features/doccontents';

let docsChange: { [uri: string]: DocContent } = {};

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

let content: string;

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
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
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
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
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

// The settings interface describe the server relevant settings part
interface Settings {
	languageServerExample: ExampleSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100;
	// Revalidate any open text documents
	documents.all().forEach(validateTextDocument);
});

function validateTextDocument(textDocument: TextDocument): void {
	let diagnostics: Diagnostic[] = [];
	let lines = textDocument.getText().split(/\r?\n/g);
	let problems = 0;
	for (var i = 0; i < lines.length && problems < maxNumberOfProblems; i++) {
		let line = lines[i];
		let index = line.indexOf('typescript');
		if (index >= 0) {
			problems++;
			diagnostics.push({
				severity: DiagnosticSeverity.Warning,
				range: {
					start: { line: i, character: index },
					end: { line: i, character: index + 10 }
				},
				message: `${line.substr(index, 10)} should be spelled TypeScript`,
				source: 'ex'
			});
		}
	}
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function updateChangedText(textDocument: TextDocument): void {

	docsChange[textDocument.uri] = new DocContent({
		Position: 1,
		Content: textDocument.getText()
	});

}

function getPositionOffset(content: string, position: Position): number {
	let lines = content.split(/\r?\n/g);
	var currentPositionOffset = 0;
	for (var i = 0; i < position.line; i++) {
		currentPositionOffset += lines[i].length;
	}
	currentPositionOffset += position.character;
	return currentPositionOffset - 1;
}

connection.onDidChangeWatchedFiles((change) => {
	// Monitored files have change in VSCode
	connection.console.log('We recevied an file change event');
});


// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in 
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.

	// For test only 
	connection.console.log('[Server] Start getting the assembly');
	var edge = require('electron-edge');
	// var assemblyFilePath = 'c:\\Users\\tigeren\\.vscode\\extensions\\Microsoft.usql-vscode-ext-0.0.1\\scopecompiler\\ScopeSymbolManagerWrapper.dll';
	// var assemblyFilePath = 'd:\\Temp\\symbol_manager_cosmosvs14\\ScopeSymbolManagerWrapper.dll';
	var assemblyFilePath = 'd:\\Src\\usql-vscode-ext\\client\\scopecompiler\\ScopeSymbolManagerWrapper.dll';
	let fun2 = edge.func({
		assemblyFile: assemblyFilePath,
		typeName: 'ScopeSymbolManagerWrapper.SymbolManagerWrapper',
		methodName: 'GetCompletionListAsync'
	});
	connection.console.log('[Server] begin to get the file path');

	var usqlScriptPath = util.ConvertUriToPath(textDocumentPosition.textDocument.uri);
	connection.console.log(usqlScriptPath);

	var content = docsChange[textDocumentPosition.textDocument.uri];
	var textDocument = documents.get(textDocumentPosition.textDocument.uri);
	var offsetPosition = textDocument.offsetAt(textDocumentPosition.position)
	connection.console.log(offsetPosition.toString());
	var payload = {
		Path: usqlScriptPath,
		Source: content.Content,
		Start: getPositionOffset(content.Content, textDocumentPosition.position).toString()
	};
	connection.console.log('[Server] payload:');
	connection.console.log(payload.Path);
	connection.console.log(payload.Start);

	var completionList: CompletionItem[] = [];
	connection.console.log('[Server] Start getting completion list');
	fun2(payload, function (error, result) {
		if (error) {
			connection.console.log('[Server] call symbol manager failed');
			connection.console.log(error);
			throw error;
		}
		else {
			connection.console.log(result);
			var i = 1;
			if (result != null) {
				result.forEach(element => {
					completionList.push({
						label: element.Text,
						kind: CompletionItemKind.Text,
						data: i
					});
					i = i + 1;
				});
			}

			return completionList;
		}
	});
	return completionList;
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	item.detail = item.label;
	item.documentation = item.label
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
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	//connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);

	//connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);

	docsChange[params.textDocument.uri] = new DocContent({
		Position: 1,
		Content: params.contentChanges[0].text,
		TextDocument: null
	});

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