const Post = require("../models/Post");

exports.viewCreateScreen = function (req, res) {
  res.render("create-post");
};

exports.create = function (req, res) {
  let post = new Post(req.body, req.session.user._id);
  post
    .create()
    .then((newId) => {
      req.flash("success", "New post successfully created.");
      req.session.save(() => res.redirect(`/post/${newId}`));
    })
    .catch((errors) => {
      errors.forEach((err) => req.flash("errors", err));
      req.session.save(() => res.redirect("/create-post"));
    });
};

exports.apiCreate = function (req, res) {
  let post = new Post(req.body, req.apiUser._id);
  post
    .create()
    .then(() => {
      res.json("Congrats.");
    })
    .catch((errors) => {
      res.json(errors);
    });
};

exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render("single-post-screen", { post: post });
  } catch {
    res.render("404");
  }
};

exports.viewEditScreen = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    if (post.isVisitorOwner) {
      res.render("edit-post", { post: post });
    } else {
      req.flash("errors", "You do not have permission to perform that action.");
      req.session.save(() => res.redirect("/"));
    }
  } catch {
    res.render("404");
  }
};

exports.edit = function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id);
  post
    .update()
    .then((status) => {
      if (status === "success") {
        req.flash("success", "Post successfully updated.");
        req.session.save(() => res.redirect(`/post/${req.params.id}/edit`));
      } else {
        // owner but val err
        post.errors.forEach((err) => {
          req.flash("errors", err);
        });
        req.session.save(() => res.redirect(`/post/${req.params.id}/edit`));
      }
    })
    .catch(() => {
      // no req id or no ownership
      req.flash("errors", "You do not have permission to perform that action.");
      req.session.save(() => res.redirect("/"));
    });
};

exports.delete = function (req, res) {
  Post.delete(req.params.id, req.visitorId)
    .then(() => {
      req.flash("success", "Post successfully deleted");
      req.session.save(() =>
        res.redirect(`/profile/${req.session.user.username}`)
      );
    })
    .catch(() => {
      req.flash("errors", "You do not have permission to perform that action.");
      req.session.save(() => res.redirect("/"));
    });
};

exports.apiDelete = function (req, res) {
  Post.delete(req.params.id, req.apiUser._id)
    .then(() => {
      res.json("Success");
    })
    .catch(() => {
      res.json("You do not have permission to perform that action.");
    });
};

exports.search = function (req, res) {
  Post.search(req.body.searchTerm)
    .then((posts) => {
      res.json(posts);
    })
    .catch(() => {
      res.json([]);
    });
};
