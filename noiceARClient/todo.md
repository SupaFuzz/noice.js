# Left Off Here: 10/27/21 @ 1028

building an actual ARClient is going to be difficult, mostly because to actually be useful, it needs to support Tables. Now, Tables in and of themselves
ain't that bad, but also they are rather pointless without being able to implement workflow that adds, removes and inspects items in the table. Else why even have them?

NOW: first thought was "cool pull back active links from the server". There is this form already on the server OOB:

AR System Metadata: actlink

and about 20 other ones for active links of various kinds. None seem to actually contain code or anything like it, though they've got a really extensive relational database model of all the options one can have inside an active link and the sort.

now THAT makes me just want to go it alone, start working on my server-side backend and you know ... do it right. Make an Audulus for workflow. The grand dream.

both implementing active links and implementing my own workflow system with
the levelDB backend and the rest -- both options qualify as Mt. Everest style
projects.

And THAT makes me want to pull back and get my fundamentals together.

which leads to the issue.
WTF am I even doing now?

I don't know when or if I'll ever get back to trying to do this ... write a legit ARClient. TO start with the latest ARS version supports PWAs out of the box. It'd behoove me to check that out and understand it before I start climbing BMC's Everest. I mean their product already supports this shit. What on Earth can I gain by home-brewing my own against their own proprietary system that does the same damn thing but supported?

Surely if there's an Everest worth climbing here, it's getting my own levelDB backend running, implementing my own ideas about workflow models, etc, no?

I left off in noiceARForm.js @ Line #664

I'm leaving it here for now. Do not know that I'll return to the ARClient project at least. I'm off now to tighten down what I've already got.

# in general
    * actual freakin' DOCUMENTATION
      it's documentation time sucka

    * absolutely none of the layout stuff seems to work on phones
      the dimensions are just too extreme (damn! it is at least fixable I s'pose)
      thought: move from defining dimensions by em to vh or vw based on orientation
      and media queries.

# noiceExamplePWA.js

    * handleSyncWorkerStatusUpdate()
    * crashedDialog()
    * resetApp()
    * exportFile()
    * [wip] startup()
    * wildcard searches
    * Category searches
    * make a remedy form
    * make a syncWorker that knows how to transmit things to it
    * pin the balloonDialog to the burger menu on the main landing UI

# serviceWorker.js
    * syntax validate and test from console

# syncWorker.js
    * phoneHome()

# mainUI.js
    * everything

# recordEditor.js
    * everything

# recordFormView.js
    * implement rowHandle as a getter of this class this time round
    * everything

# noiceExamplePWA.css
    * the fun part :-)

# noiceCoreUIFormElement / value getter
    * breaks valueStreamCallback, so we need to fix coreUIScannerInput

# indexedDB
    * change 'self' variable to something better
    * add timeouts
    * clean it up
