const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("./config");
var favicon = require("serve-favicon");
var firebase = require("firebase");
var firebaseConfig = {
    apiKey: "AIzaSyBDhS1KJ8xjKIPmGSpL-vZ54R5tfF3WBZg",
    authDomain: "alert-rush-127419.firebaseapp.com",
    databaseURL: "https://alert-rush-127419-default-rtdb.firebaseio.com/",
    storageBucket: "gs://alert-rush-127419.appspot.com",
    projectId: "alert-rush-127419"
};

// firebase.database.enableLogging(true);
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
var database = firebase.database();

app.use(bodyParser.json());

app.use(cors());

app.use(favicon(__dirname + "/favicon.ico"));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "DELETE, PUT, GET, POST");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// api routes
app.post("/firebase/add", async (req, res, next) => {
    let data = req.body;
    let name, info, color, figure, table;
    name = data.name === undefined ? "" : data.name;
    info = data.info === undefined ? "" : data.info;
    color = data.color === undefined ? "" : data.color;
    figure = data.figure === undefined ? "" : data.figure;
    if (data.key === 1)
        table = "Record1";
    else if (data.key === 2)
        table = "Record2";

    let newData = {
        name: name,
        info: info,
        color: color,
        figure: figure,
    };

    console.log("Invoke add entry");
    addEntry(table, newData)
        .then(() => { return res.send({ message: "Entry was added" }) })
        .catch(error => { return res.status(500).send({ message: "Server error" }) })
});

function addEntry(table, data) {
    let timestamp = new Date();
    let time = timestamp.getTime();
    return new Promise((resolve, reject) => {
        firebase
            .database()
            .ref(table)
            .child(time)
            .set(data)
            .then(() => {
                console.log("Success adding " + data.name);
                console.log("\n");
                resolve("Success")
            })
            .catch((error) => {
                console.log(error);
                reject("Error");
            });
    })
}


app.delete("/firebase/remove", async (req, res, next) => {
    let data = req.body;
    let table = null;
    if (data.key === 1)
        table = "Record1";
    else if (data.key === 2)
        table = "Record2";
    console.log("Invoke delete entry for ", table, data.name);
    deleteEntry(table, data.name).then(() => { return res.send({ message: "Entry was deleted" }); })
        .catch(error => { return res.status(500).send({ message: "Internal Server error" }); })
});

function deleteEntry(table, name) {
    var ref = firebase.database().ref(table);
    return new Promise((resolve, reject) => {
        ref.orderByChild("name").equalTo(name).on("child_added", function(snapshot) {
            if (snapshot) {
                let updates = {};
                updates[table + '/' + snapshot.key] = null;
                console.log(snapshot.key, table);
                firebase
                    .database()
                    .ref()
                    .update(updates)
                    .then(() => {
                        database.ref(table).once('value').then((snap) => {
                            console.log("Success Deleting " + name + " from " + table);
                            console.log("\n");
                            firebase.firestore().clearPersistence().then(() => {
                                ref.off();;
                                resolve("Success")
                            }).catch(error => {
                                console.error('Could not enable persistence:', error.code);
                                reject("Error")
                            })
                        });

                    })
                    .catch((error) => {
                        console.log(error);
                        reject("Error")
                    });
            } else {
                console.log("No data available");
            }
        });
    });
}


app.delete("/firebase/removeAll", async (req, res, next) => {
    let data = req.body;
    let table = null;
    if (data.key === 1)
        table = "Record1";
    else if (data.key === 2)
        table = "Record2";
    return await firebase
        .database()
        .ref(table)
        .remove()
        .then(() => {
            console.log("Success Deleting Entries");
            return res.send({ message: "Entries were deleted" });
        })
        .catch((error) => {
            console.log(error);
            return res.status(500).send({ message: "Internal Server error" }); // });
        });
});

const server = app.listen(process.env.PORT || 5000);