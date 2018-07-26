"use strict"

const express = require('express');
//const morgan = require('morgan');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {Author, BlogPost} = require('./models');
const {PORT, DATABASE_URL} = require('./config');

const app = express();
app.use(express.json());

//endpoints for author
app.get('/authors', (req, res) => {
    Author
    .find()
    .then(authors => {
        res.json(authors.map(author => {
            return {
                id: author._id,
                name : `${author.firstName} ${author.lastName}`,
                userName: author.userName
            };
        }));
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    });
});

//endpoint to add another author
app.post('/authors', (req, res) => {
    const requiredFields = ['firstName', 'lastName', 'userName'];
    requiredFields.forEach(field => { 
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    });
    Author
        .findOne({userName: req.body.userName})
        .then(author => {
            if (author) {
                const message = `Username already taken`;
                console.error(message);
                return res.status(400).send(message);
            } else {
                Author  
                    .create ({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        userName: req.body.userName
                    })
                    .then(author => res.status(201).json({
                        _id: author.id,
                        name: `${author.firstName} ${author.lastName}`,
                        userName: author.userName
                    }))
                    .catch(err => {
                        console.error(err);
                        return res.status(500).json({error: "Something went wrong"});
                    });
            }
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: "Internal Server error"});
        });
});

//endpoint to update author by id
app.put('/authors/:id', (req, res) => {
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({error: 'Request path id and request body id values must match'});
    }

    const updated = {};
    const updatedableFields = ['firstName', 'lastName', 'userName'];
    updatedableFields.forEach(field => {
        if(field in req.body) {
            updated[field] = req.body[field];
        }
    })

    Author
    .findOne({ userName: updated.userName || '', _id: { $ne: req.params.id } })
    .then(author => {
      if(author) {
        const message = `Username already taken`;
        console.error(message);
        return res.status(400).send(message);
      }
      else {
        Author
          .findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
          .then(updatedAuthor => {
            res.status(200).json({
              id: updatedAuthor.id,
              name: `${updatedAuthor.firstName} ${updatedAuthor.lastName}`,
              userName: updatedAuthor.userName
            });
          })
          .catch(err => res.status(500).json({ message: err }));
      }
    });
});

//endpoing to delete author blog post by id
app.delete('/authors/:id', (req, res) => {
    BlogPost
    .remove({author: req.params.id})
    .then(() => {
        Author
        .findByIdAndRemove(req.params.id)
        .then(() => {
            console.log(`Deleted blog posts by author with this id \`${req.params.id}\``);
            res.status(204).json({message: 'success'});
        });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: "Internal Server Error"});
    });
});

//endpoints for blog posts

app.get('/blogposts', (req, res) => {
    BlogPost.find()

    .then(blogposts => {
        res.json(blogposts.map(blogpost => {
            return {
                id: blogpost._id,
                author: blogpost.authorName,
                content: blogpost.content,
                title: blogpost.title,
            }
        }));
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    });
});

app.get('/blogposts/:id', (req, res) => {
    BlogPost
    .findById(req.params.id)
    .then(blogpost => { res.json({
        id: blogpost._id,
        title: blogpost.title,
        content: blogpost.content,
        author: blogpost.authorName,
        comments: blogpost.comments
    });
})
    .catch(err => {
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    });
});

app.post('/blogposts', (req, res) => {
    const requiredFields = ['title', 'content', 'author_id'];
    for (let i = 0; i < requiredFields; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \'${field}\' in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    Author
    .findById(req.body.author_id)
    .then(author => {
        if (author) {
            BlogPost.create({
                title: req.body.title,
                content: req.body.content,
                author: req.body.author
            })
            .then(blogpost => res.status(201).json({
                id: blogpost._id,
                title: blogpost.title,
                content: blogpost.content,
                author: `${author.firstName} ${author.lastName}`,
                comments: blogpost.comments
            }))
            .catch(err => {
                console.error(err);
                res.status(500).json({message: "Internal Server Error"});
            });
        } else {
            const message = `Author not found`;
            console.error(message);
            return res.status(400).send(message);
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    });

});

app.put('/blogposts/:id', (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = `Request path id (${req.params.id}) and request body id ` +
        `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({message: message});
    }

    const toUpdate = {};
    const updatedableFields = ['title', 'content'];

    updatedableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field];
        }
    });

    BlogPost
    .findByIdAndUpdate(req.params.id, {$set: toUpdate}, {new: true})
    .then(blogpost => res.status(200).json({
        id: blogpost.id,
        title: blogpost.title,
        content: blogpost.content
    }))
    .catch(err => res.status(400).json({message: "Internal Server Error"}));
});

app.delete('/blogposts/:id', (req, res) => {
    BlogPost
    .findByIdAndRemove(req.params.id)
    .then(blogpost => res.status(204).end())
    .catch(err => res.status(400).json({message: "Internal Server Error"}));
});

app.use('*', (req, res) => {
    res.status(404).json({message: "Not Found"});
});

let server;

function runServer(databaseUrl, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(
            databaseUrl,
            err => {
                if (err) {
                    return reject(err);
                }
                server = app
                    .listen(port, () => {
                        console.log(`Your app is listening on port ${port}`);
                        resolve();
                    })
                    .on('error', err => {
                        mongoose.disconnect();
                        reject(err);
                    });
            }
        );
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log("Closing server");
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

if(require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};