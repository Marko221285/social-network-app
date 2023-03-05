const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const markdown = require("marked");
const sanitizeHTML = require("sanitize-html");
const app = express();

let sessionOptions = session({
  secret: "This app is cool",
  store: MongoStore.create({ client: require("./db") }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
});

app.use(sessionOptions);
app.use(flash());

app.use((req, res, next) => {
  // markdown function
  res.locals.filterUserHTML = function (content) {
    // disallow links when parsed
    // prettier-ignore
    return sanitizeHTML(markdown.parse(content), { allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {} })
  };
  // flash msgs
  res.locals.errors = req.flash("errors");
  res.locals.success = req.flash("success");
  // current user id available on req object
  if (req.session.user) {
    req.visitorId = req.session.user._id;
  } else {
    req.visitorId = 0;
  }
  // globally accessible object within ejs template
  res.locals.user = req.session.user;
  next();
});

const router = require("./router");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static("public"));
app.set("views", "views");
app.set("view engine", "ejs");

app.use("/", router);

const server = require("http").createServer(app);

const io = require("socket.io")(server);

io.on("connection", function (socket) {
  socket.on("chatMessageFromBrowser", function (data) {
    // sending to all connected browsers
    io.emit("chatMessageFromServer", { message: data.message });
  });
});

module.exports = server;
