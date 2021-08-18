const { GraphQLDateTime } = require('graphql-iso-date');

const Query = require('./query');
const Mutation = require('./mutation');
const Note = require('./note');
const User = require('./user');

module.exports = {
  Query,
  Mutation,
  User,
  Note,
  DateTime: GraphQLDateTime
};
