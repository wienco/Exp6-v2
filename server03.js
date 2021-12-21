var express = require("express")
var app = express()
const PORT = 3000;
var hbs = require('express-handlebars');
path = require("path")
app.use(express.static('static'))

app.set('views', path.join(__dirname, 'views'));         // ustalamy katalog views
app.engine('hbs', hbs({ defaultLayout: 'main.hbs' }));   // domyślny layout, potem można go zmienić
app.set('view engine', 'hbs');
app.use(express.json());

app.engine('hbs', hbs({
    extname: '.hbs',
    partialsDir: "views/partials",
    defaultLayout: 'main.hbs',
    helpers: {
        notEdited: function (index) {
            return index != editIndex
        },
        not: function (boolean) {
            return !boolean
        },
        display: function (boolean) {
            if(boolean == null){
                return "NO DATA"
            }
            else if (boolean){
                return "YES"
            } else {
                return "NO"
            }
        },
    }
}));

app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})

const Datastore = require('nedb')

const coll1 = new Datastore({
    filename: 'collection.db',
    autoload: true
});

editIndex = -1

context = {
    inputs: [
        { name: "Insured", checked: true },
        { name: "Fuel", checked: false },
        { name: "Damaged", checked: false },
        { name: "Drive", checked: false },
    ],
    options: ["YES", "NO", "NO DATA"],
    data: [],
}

coll1.find({}, function (err, docs) {
    //zwracam dane w postaci JSON
    context.data = docs
});

app.get("/", function (req, res) {
    coll1.find({}, function (err, docs) {
        context.data = docs
        res.render('main.hbs', context);

        //zwracam dane w postaci JSON
    });
})

app.get("/addToDb", function (req, res) {
    var creator = {}
    context.inputs.forEach(e => {
        let test
        if(e.name != "4x4\u0020Drive"){
            test = req.query.hasOwnProperty(e.name)
        }
        else{
            test = req.query.hasOwnProperty('4x4')
        }
        creator[e.name] = test
        if (test) {
            e.checked = true
        } else {
            e.checked = false
        }
    });
    coll1.insert(creator, function (err, newDoc) {    
        editIndex = -1
        res.redirect("/");
    });
})

app.get("/deleteForm", function (req, res) {
    coll1.remove({ "_id": req.query.id }, {}, function (err, numRemoved) {
        editIndex = -1
        res.redirect("/")
    });

})

app.get("/enableEdit", function (req, res) {
    editIndex = req.query.index
    res.redirect("/");
})

app.get("/cancelEdit", function (req, res) {
    editIndex = -1
    res.redirect("/");
})

app.get("/editForm", function (req, res) {
    var creator = {}
    context.inputs.forEach(e => {
        let n = e.name
        if(e.name == "4x4\u0020Drive"){
            n = "Drive"
        }
        console.log(req.query[n])
        if(req.query[n] == "YES"){
            creator[e.name] = true
        }
        else if(req.query[n] == "NO"){
            creator[e.name] = false
        }else{
            creator[e.name] = null
        }
    });
    coll1.update({ _id: req.query.id  }, { $set: creator }, {}, function (err, numUpdated) {
        console.log("zaktualizowano " + numUpdated)
        editIndex = -1
        res.redirect("/")
     });

})