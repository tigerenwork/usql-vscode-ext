'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { workspace, Disposable, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

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
		run : { module: serverModule, transport: TransportKind.ipc },
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
	
	
	// use electron-edge to load dll
	var edge = require('electron-edge');
	
	let fun_get_wrapper_symbol = edge.func({
		assemblyFile:'/vagrant/symbol_manager_cosmosvs14/ScopeSymbolManagerWrapper.dll',
		typeName:'ScopeSymbolManagerWrapper.SymbolManagerWrapper',
		methodName:'GetSymbolListAsync'
	});
	
	let fun_test_assembly_denpendency = edge.func({
		assemblyFile:'/vagrant/Debug/ClassLibrary2.dll',
		typeName:'ClassLibrary2.Class2',
		methodName:'GetStringAsyncFromClass1'
	});
	
	let fun_test_app_domain = edge.func({
		assemblyFile:'/vagrant/ClassLibrary1.dll',
		typeName:'ClassLibrary1.Class1',
		methodName:'GetStringAsync'
	});
	
	console.log('start calling ClassLibrary1 dll with app domain');
	fun_test_app_domain('JavaScript',function (error,result) {
		if (error) 
		{
			console.log('calling dll failed');
			throw error;
		}
		else{
		console.log(result);	
		}
	});
	

	console.log('start calling ClassLibrary2 dll');
	fun_test_assembly_denpendency('JavaScript',function (error,result) {
		if (error) 
		{
			console.log('calling dll failed');
			throw error;
		}
		else{
		console.log(result);	
		}
	});
	
	console.log('start calling ScopeSymbolManagerWrapper dll');
	fun_get_wrapper_symbol('JavaScript',function (error,result) {
		if (error) 
		{
			console.log('calling dll failed');
			throw error;
		}
		else{
		console.log(result);	
		}
	});
	
	// helloWorld('JavaScript', function (error, result) {
    // if (error) throw error;
    // console.log(result);
//});
}

// this method is called when your extension is deactivated
// export function deactivate() {
// }