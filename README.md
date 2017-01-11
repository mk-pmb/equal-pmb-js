
<!--#echo json="package.json" key="name" underline="=" -->
equal-pmb
=========
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Expect two values to be equal, for whatever latest notion of equality.
<!--/#echo -->


Most of my unit tests are about comparing actual results with expectations,
so I want a central place (this module) to maintain a code description of
my latest notion of JavaScript value equality.



Usage
-----

see [test/usage.js](test/usage.js)

<!--!#include file="test/usage.js" start="  //#u" stop="  //#r"
  outdent="  " code="javascript" -->
<!--/include-->




<!--#toc stop="scan" -->


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
