//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

//1.require a mongoose after installing it in the terminal
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


//2.create a database
mongoose.connect("mongodb+srv://admin-anna:test123@cluster0.9t9cy.mongodb.net/todolistDB?retryWrites=true&w=majority", {
  useNewUrlParser: true
});

//3.Schema and model
const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);

//4.Creating items following the schema
const item1 = new Item({
  name: "Hello! Here is my simple ToDoList!",
});
const item2 = new Item({
  name: "Hit + to add a new item!",
});
const item3 = new Item({
  name: "<-- Hit this checkbox to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);


//storing data without using DB
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function(req, res) {

  //6.Find the defaul items to render them into a listTitle
  //empty set of {} - to find everything in Item
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      //5.Inserting items into our collection
      Item.insertMany(defaultItems, (err) => {
        if (err) console.log(err);
        console.log("Seccessfully added default items to database!");
      })
    }

    if (err) console.log(err);
    res.render("list", {
      listTitle: "Today",
      newListItems: foundItems
    });
  })
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
    const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

console.log(req.body);

  if (listName === 'Today') {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName)
    })
  }
});

app.post('/delete', (req, res) => {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemID, (err) => {
      if (err) console.log(err);
      res.redirect('/');
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, (err, foundList) => {
      if (!err) res.redirect("/" + listName);
    })
  }


})

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundList) => {
    if (!foundList) {
    // Create a new list
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    list.save();
    res.redirect("/" + customListName);
    } else {
      //Show an existing list
      res.render('list', {
        listTitle: foundList.name,
        newListItems: foundList.items
      });
    }

  });


});

app.get("/work", function(req, res) {
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
