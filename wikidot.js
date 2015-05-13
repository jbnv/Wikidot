/* jshint node:true */

// Wikidot API library for node.js
// by Jay Bienvenu

var XmlRpc = require('xmlrpc');  // https://www.npmjs.org/package/xmlrpc

exports.ContentTypes = {
	'General' : 0,
	'DataForm' : 1,
	'LiveTemplate' : 2
};

exports.username = ''; // name of the user holding the API key

exports.apiKey = '';

exports.site = ''; // optional

// next: function(error,value)
exports.call = function(method,parameters,next) {

	clientOptions = { 
		'host': 'www.wikidot.com',
		'port': 443,
		'path': '/xml-rpc-api.php',
		'basic_auth': {
			'user': exports.username,
			'pass': exports.apiKey
		}
	};
	var client = XmlRpc.createSecureClient(clientOptions);
	client.methodCall(method,[parameters],next);

};

// The following code creates a .<namespace>.<method> method for each namespace and method
// defined on http://www.wikidot.com/doc:api
var namespaces = ['categories', 'files', 'tags', 'pages', 'posts', 'users'];
var methods = [
	'categories.select',
	'files.select','files.get_meta','files.get_one','files.save_one',
	'tags.select',
	'pages.select','pages.get_meta','pages.get_one','pages.save_one',
	'posts.select','posts.get',
	'users.get_me'
];

for (var i = 0; i < namespaces.length; i++) {
	namespace = namespaces[i];
	exports[namespace] = {};
}

for (var j = 0; j < methods.length; j++) {
	methodArray = methods[j].split('.');
	namespace = methodArray[0];
	method = methodArray[1];
	exports[namespace][method] = function(params,callback) {
		exports.call(methods[j],params,callback);
	};
}
	
// Some convenience functions.
// For each function, callback: function(error,value)

exports.listCategory = function(category,callback) {
	exports.call('pages.select',{
		'site': exports.site,
		'categories': [category]		
	}, callback);
};

exports.getPage = function(fullname,callback) {
	exports.call('pages.get_one',{
		'site': exports.site,
		'page': fullname
	}, callback);
};

// page: WikidotPage object below.
exports.putPage = function(page,comment,callback) {
	exports.call('pages.save_one',{
		'site': exports.site,
		'page': page.fullname,
		'content': page.content,
		'revision_comment': comment ? comment : "Change via Wikidot library."
	}, callback);
};

exports.WikidotPage = function() {

	this.injectContent = function(oData,contentType) {
	
		if (!oData) return;
	
		this.fullname = oData.fullname;
		this.title = oData.title;
		this.tags = oData.tags;
		this.parent_fullname = oData.parent_fullname;
		this.content = oData.content;
		this.contentType = contentType;
		if (contentType == exports.ContentTypes.DataForm) {
			// Split the content into separate fields.
			content = oData.content.split("\n");
			for (index in content) {
				parts = content[index].split(": ");
				text = parts[1];
				if (text) {
					if (text.substr(0,1) == '\'') {
						text = text.substr(1,text.length-2);
					}
					if (text.substr(0,1) == '\"') {
						text = text.substr(1,text.length-2);
					}
					this[parts[0]] = text;
				}
			}
		} else if (contentType == exports.ContentTypes.LiveTemplate) {
			// Split content into an array of sections.
			this.contentArray = oData.content.split("\n====\n");
		}
	}

	// [ slug: { selected, title, fn: change function } ]
	this.changeProposals = [];

	// Outbound object with parameters that will be given to the Wikidot API.
	
	this.addProposal = function(oProposal) {
		this.changeProposals.push({
			'selected': true,
			'title': oProposal.title,
			'fn': oProposal.apply
		});
	}
	
	this.compileChangeProposals = function() {
		//request = angular.copy(this);
		
		angular.forEach(this.changeProposals, function(oProposal, index) {
			oProposal.fn(this);
		}, request);
		return request;
	}
	
	this.hasTag = function(tag) {
		return (this.tags.indexOf(tag) > -1);
	}
	
}

exports.addTagProposal = function(tag) {
	
	this.title = "Add tag "+tag+".";
	
	this.apply = function(request) {
		request['tags'].push(tag);		
	}
}
