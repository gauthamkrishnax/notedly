const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {
  AuthenticationError,
  ForbiddenError
} = require('apollo-server-express');
require('dotenv').config();

const gravatar = require('../util/gravatar');
const { authenticate } = require('passport');

module.exports = {
  newNote: async (parent, args, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You must Sign In to Create a Note');
    }
    return await models.Note.create({
      content: args.content,
      author: mongoose.Types.ObjectId(user.id)
    });
  },
  deleteNote: async (parent, { id }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You must Sign In to Delete a Note');
    }
    const note = await models.Note.findById(id);
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError('You dont have permission to delete the note.');
    }
    try {
      await models.Note.findByIdAndRemove(id);
      return true;
    } catch (err) {
      return false;
    }
  },
  updateNote: async (parent, { content, id }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You must be signed in to update a note');
    }
    const note = await models.Note.findById(id);
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError(
        "You don't have permission to update the notes."
      );
    }
    return await models.Note.findByIdAndUpdate(
      id,
      {
        content: content
      },
      { new: true }
    );
  },
  signUp: async (parent, { username, password, email }, { models }) => {
    email = email.trim().toLowerCase();
    const hashed = await bcrypt.hash(password, 10);
    const avatar = gravatar(email);
    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hashed
      });
      return jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    } catch (err) {
      console.log(err);
      throw new Error('Error Creating Account !');
    }
  },
  signIn: async (parent, { username, email, password }, { models }) => {
    if (email) {
      email.trim().toLowerCase();
    }

    const user = await models.User.findOne({
      $or: [{ email }, { username }]
    });

    if (!user) {
      throw new AuthenticationError('Error Signing In ');
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Error Signing In');
    }

    return jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  },
  toggleFavorite: async (parent, { id }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You need to Sign In.');
    }
    let noteCheck = await models.Note.findById(id);
    const hasUser = noteCheck.favoritedBy.indexOf(user.id);

    if (hasUser >= 0) {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $pull: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: -1
          }
        },
        {
          new: true
        }
      );
    } else {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $push: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: 1
          }
        },
        {
          new: true
        }
      );
    }
  }
};
