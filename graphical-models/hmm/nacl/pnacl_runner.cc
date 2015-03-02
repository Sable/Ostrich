// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/// @file hello_tutorial.cc
/// This example demonstrates loading, running and scripting a very simple NaCl
/// module.  To load the NaCl module, the browser first looks for the
/// CreateModule() factory method (at the end of this file).  It calls
/// CreateModule() once to load the module code.  After the code is loaded,
/// CreateModule() is not called again.
///
/// Once the code is loaded, the browser calls the CreateInstance()
/// method on the object returned by CreateModule().  It calls CreateInstance()
/// each time it encounters an <embed> tag that references your NaCl module.
///
/// The browser can talk to your NaCl module via the postMessage() Javascript
/// function.  When you call postMessage() on your NaCl module from the browser,
/// this becomes a call to the HandleMessage() method of your pp::Instance
/// subclass.  You can send messages back to the browser by calling the
/// PostMessage() method on your pp::Instance.  Note that these two methods
/// (postMessage() in Javascript and PostMessage() in C++) are asynchronous.
/// This means they return immediately - there is no waiting for the message
/// to be handled.  This has implications in your program design, particularly
/// when mutating property values that are exposed to both the browser and the
/// NaCl module.

#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "../c/main_bwa_hmm.h"
//#include "../common/common.h"

namespace {
	// The expected string sent by the browser.
	const char* const kHelloString = "hello";
	// The string sent back to the browser upon receipt of a message
	// containing "hello".
	const char* const kReplyString = "hello from NaCl";
} // namespace

/// The Instance class.  One of these exists for each instance of your NaCl
/// module on the web page.  The browser will ask the Module object to create
/// a new Instance for each occurrence of the <embed> tag that has these
/// attributes:
///     src="hello_tutorial.nmf"
///     type="application/x-pnacl"
/// To communicate with the browser, you must override HandleMessage() to
/// receive messages from the browser, and use PostMessage() to send messages
/// back to the browser.  Note that this interface is asynchronous.
class PnaclRunnerInstance : public pp::Instance {
	public:
		/// The constructor creates the plugin-side instance.
		/// @param[in] instance the handle to the browser-side plugin instance.
		explicit PnaclRunnerInstance(PP_Instance instance) : pp::Instance(instance)
	{}
		virtual ~PnaclRunnerInstance() {}

		/// Handler for messages coming in from the browser via postMessage().  The
		/// @a var_message can contain be any pp:Var type; for example int, string
		/// Array or Dictinary. Please see the pp:Var documentation for more details.
		/// @param[in] var_message The message posted by the browser.
		virtual void HandleMessage(const pp::Var& var_message) {
			if (!var_message.is_string())
				return;
			std::string message = var_message.AsString();
			pp::Var var_reply;
			if (message == kHelloString) {
				char argv0[] = "HMM";
				char argv1[] = "-v";
				char argv2[] = "n";
				char argv3[] = "-n";
				char argv4[] = "512";
				char *argv[5];
				argv[0] = argv0;	
				argv[1] = argv1;	
				argv[2] = argv2;	
				argv[3] = argv3;	
				argv[4] = argv4;	
				std::string time = std::to_string(runHMM(5, argv));
				var_reply = pp::Var(kReplyString);
				PostMessage(time);
			}
		}
};

/// The Module class.  The browser calls the CreateInstance() method to create
/// an instance of your NaCl module on the web page.  The browser creates a new
/// instance for each <embed> tag with type="application/x-pnacl".
class PnaclRunnerModule : public pp::Module {
	public:
		PnaclRunnerModule() : pp::Module() {}
		virtual ~PnaclRunnerModule() {}

		/// Create and return a PnaclRunnerInstance object.
		/// @param[in] instance The browser-side instance.
		/// @return the plugin-side instance.
		virtual pp::Instance* CreateInstance(PP_Instance instance) {
			return new PnaclRunnerInstance(instance);
		}
};

namespace pp {
	/// Factory function called by the browser when the module is first loaded.
	/// The browser keeps a singleton of this module.  It calls the
	/// CreateInstance() method on the object you return to make instances.  There
	/// is one instance per <embed> tag on the page.  This is the main binding
	/// point for your NaCl module with the browser.
	Module* CreateModule() {
		return new PnaclRunnerModule();
	}
}  // namespace pp
