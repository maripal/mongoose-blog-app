"use strict"

const mongoose = require('mongoose');

const blogPostSchema = mongoose.Schema({
    title = {type: String, required: true},
    content = {type: String},
    author = {
        firstName: String,
        lastName: String
    }
});

blogPostSchema.virtual('authorName').get(function() {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogPostSchema.methods.serialize = function() {
    return {
        id: this._id,
        title: this.title,
        content: this.content,
        author: this.authorName
    }
}

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

module.exports = {BlogPost};