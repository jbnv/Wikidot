# Wikidot
Wikidot API library for node.js.

## Methods

**call(method,parameters,callback)** Call a specific method with the given parameters. On return, go to callback().

**listCategory(category,callback)** Get a list of all of the pages in a particular category and pass it to callback().

**getPage(fullname,callback)** Get the page with the particular name and pass it to callback().

**putPage(page,comment,callback)** Upload the page to the site.