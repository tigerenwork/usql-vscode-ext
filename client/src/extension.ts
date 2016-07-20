'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

import { workspace, Disposable, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

import {util} from './features/util'
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // console.log('Congratulations, your extension "usql-vscode-ext" is now active!');

    // // The command has been defined in the package.json file
    // // Now provide the implementation of the command with  registerCommand
    // // The commandId parameter must match the command field in package.json
    // let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
    //     // The code you place here will be executed every time your command is executed

    //     // Display a message box to the user
    //     vscode.window.showInformationMessage('Hello World!');
    // });

    // context.subscriptions.push(disposable);

    //
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
	// The debug options for the server
	let debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };

	// If the extension is launch in debug mode the debug server options are use
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	}

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: ['usql'],
		synchronize: {
			// Synchronize the setting section 'languageServerExample' to the server
			configurationSection: 'languageServerExample',
			// Notify the server about file changes to '.clientrc files contain in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	}

	// Create the language client and start the client.
	let disposable = new LanguageClient('Language Server Example', serverOptions, clientOptions).start();

	// Push the disposable to the context's subscriptions so that the 
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);

	console.log(util.ConvertUriToPath('file:///e%3A/Share/USQLSampleApplication1/USQLSampleApplication1/SearchLog/SearchLog-1-First_U-SQL_Script.usql'))

	// Test Dll Loading 
	var edge = require('electron-edge');
	let fun_load_dll = edge.func({
		assemblyFile: 'D:\\Src\\ClassLibrary1\\DllLoader\\bin\\Debug\\DllLoader.dll',
		typeName: 'DllLoader.DllLoader',
		methodName: 'GetValue'
	});
	console.log('Begin Calling DllLoader');
	try {
		fun_load_dll('JavaScript', function (error, result) {
			if (error) {
				// Console out error message 
				console.log(error);
			}
			else {
				console.log(result);
			}
		})
	} catch (ex) {
		console.log(ex);
	} finally {
		console.log('exception finally executed');
	}


	console.log('End calling DllLoader');



	// Create electron-edge 
	/*var edge = require('electron-edge');
		let fun2 = edge.func({
	assemblyFile:'D:\\Src\\ScopeSymbolManagerWrapper\\WrapperUT\\bin\\Debug\\ScopeSymbolManagerWrapper.dll',
	typeName:'ScopeSymbolManagerWrapper.SymbolManagerWrapper',
	methodName:'GetSymbolListAsync'
	});
	console.log('starting calling the symbol manager')
	fun2('JavaScript',function (error,result) {
		if (error) {
			console.log('call symbol manager failed');
			throw error;	
		} 
		else 
		{
			console.log(result);
		}
	});*/
	var payload = {
		Path: 'c:\\Workspace\\vscode_linux\\1.usql',
		Source: '',
		Start: '0'
	};
	//var edge = require('electron-edge');
	let fun2 = edge.func({
		assemblyFile: 'd:\\temp\\symbol_manager_cosmosvs14\\ScopeSymbolManagerWrapper.dll',
		//assemblyFile: 'd:\\temp\\symbol_manager_cosmosvs14\\Microsoft.Cosmos.ScopeStudio.BusinessObjects.SymbolManager.dll',
		typeName: 'ScopeSymbolManagerWrapper.SymbolManagerWrapper',
		// typeName: 'Microsoft.Cosmos.ScopeStudio.BusinessObjects.SymbolManager.CompilerServices.SymbolManagerWrapper',
		methodName: 'GetCompletionListAsync'
	});
/*	console.log('starting calling the symbol manager')

	try {
		fun2(payload, function (error, result) {
			if (error) {
				console.log('call symbol manager failed');
				throw error;
			}
			else {
				console.log(result);
			}
		});
	} catch (error) {
		console.log(error);
	}*/
}

// this method is called when your extension is deactivated
// export function deactivate() {
// }